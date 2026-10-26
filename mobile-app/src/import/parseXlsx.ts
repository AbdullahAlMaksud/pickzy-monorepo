import { strFromU8, unzipSync } from 'fflate';
import { ImportError, type ImportDocument } from './types';
import { yieldToEventLoop } from './textDecoding';

/**
 * Minimal, dependency-light XLSX (Office Open XML) reader.
 *
 * Why not SheetJS? Its npm package is unmaintained and relies on Node/browser APIs. An .xlsx file is
 * a ZIP of XML parts, so we unzip with `fflate` (pure JS, works in Hermes) and read just the parts
 * that matter for a list of names: workbook.xml, its relationships, sharedStrings.xml and the sheets.
 * Everything runs locally; no file ever leaves the device.
 */

const MAX_XLSX_BYTES = 25 * 1024 * 1024;

export const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04] as const;
const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0] as const;

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((b, i) => bytes[i] === b);
}

export function looksLikeXlsx(bytes: Uint8Array): boolean {
  return startsWith(bytes, ZIP_SIGNATURE);
}

export function looksLikeLegacyXls(bytes: Uint8Array): boolean {
  return startsWith(bytes, OLE_SIGNATURE);
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

export function decodeXmlText(value: string): string {
  if (!value.includes('&') && !value.includes('_x')) return value;
  return value
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body: string) => {
      if (body[0] === '#') {
        const code = body[1] === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
        if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
        return match;
      }
      return NAMED_ENTITIES[body] ?? match;
    })
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

function getAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`);
  const match = re.exec(attrs);
  if (!match) return undefined;
  return decodeXmlText(match[1] ?? match[2] ?? '');
}

/** Collects the text of all `<t>` elements in a fragment, ignoring phonetic (`<rPh>`) runs. */
function collectText(fragment: string): string {
  const withoutPhonetic = fragment.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  const re = /<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(withoutPhonetic)) !== null) {
    out += decodeXmlText(match[1] ?? '');
  }
  return out;
}

export function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const re = /<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    strings.push(match[1] ? collectText(match[1]) : '');
  }
  return strings;
}

/** "A" -> 0, "B" -> 1, "AA" -> 26 */
export function columnIndexFromRef(ref: string): number {
  let index = 0;
  for (let i = 0; i < ref.length; i++) {
    const code = ref.charCodeAt(i);
    if (code >= 65 && code <= 90) index = index * 26 + (code - 64);
    else if (code >= 97 && code <= 122) index = index * 26 + (code - 96);
    else break;
  }
  return index - 1;
}

export function columnLabel(index: number): string {
  let n = index + 1;
  let label = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function cellValue(attrs: string, inner: string, shared: string[]): string {
  const type = getAttr(attrs, 't');
  if (type === 'inlineStr') {
    const isMatch = /<is\b[^>]*>([\s\S]*?)<\/is>/.exec(inner);
    return isMatch ? collectText(isMatch[1]) : collectText(inner);
  }
  const vMatch = /<v\b[^>]*?>([\s\S]*?)<\/v>/.exec(inner);
  if (!vMatch) return '';
  const raw = decodeXmlText(vMatch[1]);
  switch (type) {
    case 's': {
      const idx = parseInt(raw, 10);
      return Number.isFinite(idx) ? (shared[idx] ?? '') : '';
    }
    case 'b':
      return raw === '1' ? 'TRUE' : 'FALSE';
    case 'e':
      return ''; // error cells (#N/A, ...) carry no usable name
    default:
      return raw;
  }
}

const ROWS_PER_YIELD = 2000;

export async function parseSheetXml(xml: string, shared: string[]): Promise<string[][]> {
  const rows: string[][] = [];
  const rowRe = /<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g;
  let rowMatch: RegExpExecArray | null;
  let count = 0;
  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const body = rowMatch[1];
    const cells: string[] = [];
    if (body) {
      const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let cellMatch: RegExpExecArray | null;
      let sequential = 0;
      while ((cellMatch = cellRe.exec(body)) !== null) {
        const attrs = cellMatch[1];
        const ref = getAttr(attrs, 'r');
        const col = ref ? columnIndexFromRef(ref) : sequential;
        sequential = col + 1;
        const value = cellMatch[2] ? cellValue(attrs, cellMatch[2], shared) : '';
        while (cells.length < col) cells.push('');
        cells[col] = value;
      }
    }
    rows.push(cells);
    count += 1;
    if (count % ROWS_PER_YIELD === 0) await yieldToEventLoop();
  }
  return rows;
}

interface SheetRef {
  name: string;
  path: string;
}

function resolveTarget(target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  return target.startsWith('xl/') ? target : `xl/${target.replace(/^\.\//, '')}`;
}

function readSheetRefs(workbookXml: string, relsXml: string): SheetRef[] {
  const relTargets = new Map<string, string>();
  const relRe = /<Relationship\b([^>]*?)\/?>/g;
  let relMatch: RegExpExecArray | null;
  while ((relMatch = relRe.exec(relsXml)) !== null) {
    const id = getAttr(relMatch[1], 'Id');
    const target = getAttr(relMatch[1], 'Target');
    const type = getAttr(relMatch[1], 'Type') ?? '';
    if (id && target && /worksheet$/i.test(type)) relTargets.set(id, resolveTarget(target));
  }

  const sheets: SheetRef[] = [];
  const sheetRe = /<sheet\b([^>]*?)\/?>/g;
  let sheetMatch: RegExpExecArray | null;
  while ((sheetMatch = sheetRe.exec(workbookXml)) !== null) {
    const name = getAttr(sheetMatch[1], 'name');
    const rid = getAttr(sheetMatch[1], 'r:id') ?? getAttr(sheetMatch[1], 'id');
    const path = rid ? relTargets.get(rid) : undefined;
    if (name !== undefined && path) sheets.push({ name, path });
  }
  return sheets;
}

function safeUnzip(bytes: Uint8Array, filter: (name: string) => boolean): Record<string, Uint8Array> {
  try {
    return unzipSync(bytes, { filter: (file) => filter(file.name) });
  } catch {
    throw new ImportError('CORRUPT_FILE', 'The workbook could not be opened');
  }
}

/**
 * Opens an .xlsx workbook. Only the workbook index and shared strings are read up front; sheet XML is
 * unzipped and parsed lazily, so choosing a different worksheet in the UI is cheap.
 */
export async function openXlsx(bytes: Uint8Array, fileName: string): Promise<ImportDocument> {
  if (bytes.length === 0) throw new ImportError('EMPTY_FILE');
  if (bytes.length > MAX_XLSX_BYTES) throw new ImportError('FILE_TOO_LARGE');
  if (looksLikeLegacyXls(bytes)) throw new ImportError('LEGACY_XLS');
  if (!looksLikeXlsx(bytes)) throw new ImportError('CORRUPT_FILE', 'Not a valid .xlsx file');

  const core = safeUnzip(
    bytes,
    (name) =>
      name === 'xl/workbook.xml' ||
      name === 'xl/_rels/workbook.xml.rels' ||
      name === 'xl/sharedStrings.xml',
  );

  const workbook = core['xl/workbook.xml'];
  const rels = core['xl/_rels/workbook.xml.rels'];
  if (!workbook || !rels) {
    throw new ImportError('UNSUPPORTED_WORKBOOK', 'workbook.xml is missing');
  }

  const sheets = readSheetRefs(strFromU8(workbook), strFromU8(rels));
  if (sheets.length === 0) throw new ImportError('UNSUPPORTED_WORKBOOK', 'No worksheets found');

  await yieldToEventLoop();
  const shared = core['xl/sharedStrings.xml'] ? parseSharedStrings(strFromU8(core['xl/sharedStrings.xml'])) : [];
  const cache = new Map<number, string[][]>();

  return {
    fileName,
    format: 'xlsx',
    sheetNames: sheets.map((s) => s.name),
    async loadSheet(index: number): Promise<string[][]> {
      const cached = cache.get(index);
      if (cached) return cached;
      const sheet = sheets[index];
      if (!sheet) throw new ImportError('UNSUPPORTED_WORKBOOK', 'Worksheet not found');
      const parts = safeUnzip(bytes, (name) => name === sheet.path);
      const data = parts[sheet.path];
      if (!data) throw new ImportError('UNSUPPORTED_WORKBOOK', 'Worksheet data is missing');
      const rows = await parseSheetXml(strFromU8(data), shared);
      cache.set(index, rows);
      return rows;
    },
  };
}
