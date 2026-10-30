import { decodeTextBytes } from './textDecoding';
import { parseCsvAsync } from './parseCsv';
import { parseTxtAsync } from './parseTxt';
import { looksLikeLegacyXls, openXlsx } from './parseXlsx';
import { ImportError, type ImportDocument, type ImportFormat } from '../types';

const MAX_TEXT_BYTES = 25 * 1024 * 1024;

export function detectFormat(fileName: string, mimeType?: string | null): ImportFormat | 'xls' | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) return 'xlsx';
  if (lower.endsWith('.xls')) return 'xls';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.txt') || lower.endsWith('.text')) return 'txt';
  const mime = (mimeType ?? '').toLowerCase();
  if (mime.includes('spreadsheetml')) return 'xlsx';
  if (mime === 'application/vnd.ms-excel') return 'xls';
  if (mime.includes('csv')) return 'csv';
  if (mime === 'text/plain') return 'txt';
  return null;
}

function staticDocument(fileName: string, format: ImportFormat, rows: string[][]): ImportDocument {
  return {
    fileName,
    format,
    sheetNames: [fileName],
    loadSheet: async () => rows,
  };
}

/** Parses already-read bytes into an {@link ImportDocument}. Pure; used by the picker and by tests. */
export async function openImportDocument(
  fileName: string,
  format: ImportFormat,
  bytes: Uint8Array,
): Promise<ImportDocument> {
  if (bytes.length === 0) throw new ImportError('EMPTY_FILE');
  if (format === 'xlsx') {
    return openXlsx(bytes, fileName);
  }
  if (bytes.length > MAX_TEXT_BYTES) throw new ImportError('FILE_TOO_LARGE');
  if (looksLikeLegacyXls(bytes)) throw new ImportError('LEGACY_XLS');
  const text = decodeTextBytes(bytes);
  if (text.trim() === '') throw new ImportError('EMPTY_FILE');
  const rows = format === 'csv' ? (await parseCsvAsync(text)).rows : await parseTxtAsync(text);
  return staticDocument(fileName, format, rows);
}

/** Reads a file chosen with an `<input type="file">` or dropped on the page. Throws {@link ImportError}. */
export async function openImportFile(file: File): Promise<ImportDocument> {
  const format = detectFormat(file.name, file.type);
  if (format === 'xls') throw new ImportError('LEGACY_XLS');
  if (!format) throw new ImportError('UNSUPPORTED_TYPE');

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch (error) {
    throw new ImportError('READ_FAILED', error instanceof Error ? error.message : undefined);
  }
  return openImportDocument(file.name, format, bytes);
}
