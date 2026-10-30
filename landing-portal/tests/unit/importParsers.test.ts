import { describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { detectDelimiter, parseCsv, parseCsvAsync } from '@/features/import/services/parseCsv';
import { parseTxt, parseTxtAsync } from '@/features/import/services/parseTxt';
import { decodeTextBytes } from '@/features/import/services/textDecoding';
import {
  columnIndexFromRef,
  columnLabel,
  decodeXmlText,
  openXlsx,
  parseSharedStrings,
} from '@/features/import/services/parseXlsx';
import {
  buildImportPreview,
  detectColumns,
  detectHeaderRow,
  looksLikeHeaderLabel,
  suggestColumn,
} from '@/features/import/services/importValidation';
import { ImportError } from '@/features/import/types';

import { detectFormat, openImportDocument } from '@/features/import/services/importFile';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b\nc,d').rows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('handles quoted fields with commas, escaped quotes and line breaks', () => {
    const csv = 'Name,Note\n"Smith, John","He said ""hi"""\n"Multi\nLine",x\n';
    expect(parseCsv(csv).rows).toEqual([
      ['Name', 'Note'],
      ['Smith, John', 'He said "hi"'],
      ['Multi\nLine', 'x'],
    ]);
  });

  it('supports \\n, \\r\\n and \\r line endings', () => {
    expect(parseCsv('a\r\nb\rc\nd').rows).toEqual([['a'], ['b'], ['c'], ['d']]);
  });

  it('keeps empty cells and empty lines so row numbers stay meaningful', () => {
    expect(parseCsv('a,,c\n\nd').rows).toEqual([['a', '', 'c'], [''], ['d']]);
  });

  it('removes a UTF-8 BOM and keeps Bengali text intact', () => {
    const result = parseCsv('﻿নাম,বয়স\nরহিম,২৫');
    expect(result.rows[0][0]).toBe('নাম');
    expect(result.rows[1]).toEqual(['রহিম', '২৫']);
  });

  it('detects semicolon and tab delimiters', () => {
    expect(detectDelimiter('a;b;c\nd;e;f')).toBe(';');
    expect(detectDelimiter('a\tb\nc\td')).toBe('\t');
    expect(detectDelimiter('"a;b",c\nd,e')).toBe(',');
    expect(parseCsv('a;b\nc;d').rows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('rejects binary content', () => {
    expect(() => parseCsv('abc\u0000def')).toThrow(ImportError);
  });

  it('async parsing matches sync parsing on a large file', async () => {
    const lines = Array.from({ length: 30000 }, (_, i) => `"Person ${i}, Jr",${i}`).join('\n');
    const sync = parseCsv(lines).rows;
    const async = (await parseCsvAsync(lines)).rows;
    expect(async).toHaveLength(30000);
    expect(async).toEqual(sync);
  });

  it('works when a chunk boundary falls inside a quoted field or CRLF', async () => {
    const filler = 'x'.repeat(199_996);
    const text = `${filler}\r\n"a ""q"" b",c\r\n`; // chunk size is 200_000
    const rows = (await parseCsvAsync(text)).rows;
    expect(rows[1]).toEqual(['a "q" b', 'c']);
  });
});

describe('parseTxt', () => {
  it('returns one single-column row per line and keeps commas', () => {
    expect(parseTxt('Smith, John\nRahim\r\n\nNusrat\n')).toEqual([['Smith, John'], ['Rahim'], [''], ['Nusrat']]);
  });

  it('removes a BOM', () => {
    expect(parseTxt('﻿Rahim')).toEqual([['Rahim']]);
  });

  it('async version gives the same result', async () => {
    const text = Array.from({ length: 50000 }, (_, i) => `N${i}`).join('\n');
    expect(await parseTxtAsync(text)).toEqual(parseTxt(text));
  });
});

describe('decodeTextBytes', () => {
  it('decodes UTF-8 with and without BOM', () => {
    expect(decodeTextBytes(bytes('নুসরাত'))).toBe('নুসরাত');
    expect(decodeTextBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('Rahim')]))).toBe('Rahim');
  });

  it('decodes UTF-16 LE and BE with a BOM', () => {
    const le = new Uint8Array([0xff, 0xfe, 0x52, 0x00, 0x61, 0x00]);
    const be = new Uint8Array([0xfe, 0xff, 0x00, 0x52, 0x00, 0x61]);
    expect(decodeTextBytes(le)).toBe('Ra');
    expect(decodeTextBytes(be)).toBe('Ra');
  });

  it('rejects text that is not valid UTF-8', () => {
    const latin1 = new Uint8Array(Array.from({ length: 50 }, () => 0xe9));
    expect(() => decodeTextBytes(latin1)).toThrow(expect.objectContaining({ code: 'BAD_ENCODING' }));
  });

  it('rejects binary data', () => {
    expect(() => decodeTextBytes(new Uint8Array([0x41, 0x00, 0x42, 0x00, 0x00]))).toThrow(
      expect.objectContaining({ code: 'CORRUPT_FILE' }),
    );
  });
});

/* ---------- XLSX ---------- */

function buildWorkbook(opts: {
  sheets: { name: string; xml: string }[];
  shared?: string[];
  omitWorkbook?: boolean;
}): Uint8Array {
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8('<Types/>'),
  };
  if (!opts.omitWorkbook) {
    files['xl/workbook.xml'] = strToU8(
      `<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${opts.sheets
        .map((s, i) => `<sheet name="${s.name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join('')}</sheets></workbook>`,
    );
    files['xl/_rels/workbook.xml.rels'] = strToU8(
      `<Relationships>${opts.sheets
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
        )
        .join('')}</Relationships>`,
    );
  }
  opts.sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(s.xml);
  });
  if (opts.shared) {
    files['xl/sharedStrings.xml'] = strToU8(`<sst>${opts.shared.map((s) => `<si><t>${s}</t></si>`).join('')}</sst>`);
  }
  return zipSync(files);
}

const sheetXml = (rows: string) => `<worksheet><sheetData>${rows}</sheetData></worksheet>`;

describe('xlsx helpers', () => {
  it('converts column references', () => {
    expect(columnIndexFromRef('A1')).toBe(0);
    expect(columnIndexFromRef('B7')).toBe(1);
    expect(columnIndexFromRef('AA10')).toBe(26);
    expect(columnLabel(0)).toBe('A');
    expect(columnLabel(25)).toBe('Z');
    expect(columnLabel(26)).toBe('AA');
  });

  it('decodes XML entities', () => {
    expect(decodeXmlText('Tom &amp; Jerry &lt;3 &#233; &#x9A30;')).toBe('Tom & Jerry <3 é 騰');
    expect(decodeXmlText('a_x0041_b')).toBe('aAb');
  });

  it('reads shared strings including rich text runs and ignores phonetic hints', () => {
    const xml = '<sst><si><t>Plain</t></si><si><r><t>Rich </t></r><r><t>Text</t></r></si><si><t>নাম</t><rPh><t>ignore</t></rPh></si><si/></sst>';
    expect(parseSharedStrings(xml)).toEqual(['Plain', 'Rich Text', 'নাম', '']);
  });
});

describe('openXlsx', () => {
  it('reads shared strings, inline strings and numbers, with sparse cells', async () => {
    const xlsx = buildWorkbook({
      shared: ['Name', 'Rahim', 'নুসরাত'],
      sheets: [
        {
          name: 'People',
          xml: sheetXml(
            '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Team</t></is></c></row>' +
              '<row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>42</v></c></row>' +
              '<row r="3"><c r="A3" t="s"><v>2</v></c></row>' +
              '<row r="4"/>',
          ),
        },
      ],
    });
    const doc = await openXlsx(xlsx, 'people.xlsx');
    expect(doc.sheetNames).toEqual(['People']);
    expect(await doc.loadSheet(0)).toEqual([['Name', '', 'Team'], ['Rahim', '42'], ['নুসরাত'], []]);
  });

  it('supports several worksheets and loads them lazily', async () => {
    const xlsx = buildWorkbook({
      shared: ['A1', 'B1'],
      sheets: [
        { name: 'One', xml: sheetXml('<row r="1"><c r="A1" t="s"><v>0</v></c></row>') },
        { name: 'Two', xml: sheetXml('<row r="1"><c r="A1" t="s"><v>1</v></c></row>') },
      ],
    });
    const doc = await openXlsx(xlsx, 'multi.xlsx');
    expect(doc.sheetNames).toEqual(['One', 'Two']);
    expect(await doc.loadSheet(1)).toEqual([['B1']]);
    expect(await doc.loadSheet(0)).toEqual([['A1']]);
  });

  it('turns booleans and error cells into sensible text', async () => {
    const xlsx = buildWorkbook({
      sheets: [{ name: 'S', xml: sheetXml('<row r="1"><c r="A1" t="b"><v>1</v></c><c r="B1" t="e"><v>#N/A</v></c></row>') }],
    });
    expect(await (await openXlsx(xlsx, 'x.xlsx')).loadSheet(0)).toEqual([['TRUE', '']]);
  });

  it('fails with clear error codes', async () => {
    await expect(openXlsx(new Uint8Array(0), 'e.xlsx')).rejects.toMatchObject({ code: 'EMPTY_FILE' });
    await expect(openXlsx(bytes('this is not a zip file'), 'x.xlsx')).rejects.toMatchObject({ code: 'CORRUPT_FILE' });
    const legacy = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);
    await expect(openXlsx(legacy, 'old.xlsx')).rejects.toMatchObject({ code: 'LEGACY_XLS' });
    const truncated = buildWorkbook({ sheets: [{ name: 'S', xml: sheetXml('') }] }).slice(0, 40);
    await expect(openXlsx(truncated, 'bad.xlsx')).rejects.toBeInstanceOf(ImportError);
    const noWorkbook = buildWorkbook({ sheets: [{ name: 'S', xml: sheetXml('') }], omitWorkbook: true });
    await expect(openXlsx(noWorkbook, 'odd.xlsx')).rejects.toMatchObject({ code: 'UNSUPPORTED_WORKBOOK' });
  });

  it('reads a large worksheet', async () => {
    const rows = Array.from({ length: 6000 }, (_, i) => `<row r="${i + 1}"><c r="A${i + 1}" t="inlineStr"><is><t>Person ${i}</t></is></c></row>`).join('');
    const doc = await openXlsx(buildWorkbook({ sheets: [{ name: 'Big', xml: sheetXml(rows) }] }), 'big.xlsx');
    const sheet = await doc.loadSheet(0);
    expect(sheet).toHaveLength(6000);
    expect(sheet[5999][0]).toBe('Person 5999');
  });
});

describe('openImportDocument / detectFormat', () => {
  it('detects formats by extension and MIME type', () => {
    expect(detectFormat('a.XLSX')).toBe('xlsx');
    expect(detectFormat('a.csv')).toBe('csv');
    expect(detectFormat('a.txt')).toBe('txt');
    expect(detectFormat('a.xls')).toBe('xls');
    expect(detectFormat('download', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('xlsx');
    expect(detectFormat('a.pdf', 'application/pdf')).toBeNull();
  });

  it('opens CSV and TXT bytes', async () => {
    const csv = await openImportDocument('a.csv', 'csv', bytes('Name\nRahim'));
    expect(await csv.loadSheet(0)).toEqual([['Name'], ['Rahim']]);
    const txt = await openImportDocument('a.txt', 'txt', bytes('Rahim\nNusrat'));
    expect(await txt.loadSheet(0)).toEqual([['Rahim'], ['Nusrat']]);
  });

  it('reports empty and legacy files', async () => {
    await expect(openImportDocument('a.csv', 'csv', new Uint8Array(0))).rejects.toMatchObject({ code: 'EMPTY_FILE' });
    await expect(openImportDocument('a.txt', 'txt', bytes('   \n  '))).rejects.toMatchObject({ code: 'EMPTY_FILE' });
    const legacy = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3, 4]);
    await expect(openImportDocument('a.csv', 'csv', legacy)).rejects.toMatchObject({ code: 'LEGACY_XLS' });
  });
});

describe('import validation and preview', () => {
  const rows = [['Name', 'Team'], ['Rahim', 'A'], ['', 'B'], ['rahim', 'C'], ['Nusrat', 'D']];

  it('recognizes header labels in English and Bengali', () => {
    expect(looksLikeHeaderLabel(' Full Name ')).toBe(true);
    expect(looksLikeHeaderLabel('নাম')).toBe(true);
    expect(looksLikeHeaderLabel('Rahim')).toBe(false);
  });

  it('suggests a header only when a known label is present', () => {
    expect(detectHeaderRow(rows)).toBe(true);
    expect(detectHeaderRow([['Rahim'], ['Nusrat']])).toBe(false);
  });

  it('never drops a real first name just because it looks like data', () => {
    const preview = buildImportPreview([['Rahim'], ['Nusrat']], { columnIndex: 0, hasHeader: false, duplicatePolicy: 'keep', existingNames: [] });
    expect(preview.names).toEqual(['Rahim', 'Nusrat']);
    expect(preview.headerSkipped).toBeNull();
  });

  it('a first row called "Name" is only skipped when the user (or detection) says so', () => {
    const asHeader = buildImportPreview(rows, { columnIndex: 0, hasHeader: true, duplicatePolicy: 'keep', existingNames: [] });
    const asData = buildImportPreview(rows, { columnIndex: 0, hasHeader: false, duplicatePolicy: 'keep', existingNames: [] });
    expect(asHeader.headerSkipped).toBe('Name');
    expect(asHeader.names).not.toContain('Name');
    expect(asData.names[0]).toBe('Name');
  });

  it('counts valid rows, blank rows and duplicates for the review step', () => {
    const preview = buildImportPreview(rows, { columnIndex: 0, hasHeader: true, duplicatePolicy: 'keep', existingNames: [] });
    expect(preview).toMatchObject({ totalRows: 4, validRows: 3, blankSkipped: 1, duplicatesFound: 1, duplicatesSkipped: 0 });
    expect(preview.names).toEqual(['Rahim', 'rahim', 'Nusrat']);
  });

  it('applies the skip policy against existing participants too', () => {
    const preview = buildImportPreview(rows, { columnIndex: 0, hasHeader: true, duplicatePolicy: 'skip', existingNames: ['NUSRAT'] });
    expect(preview.names).toEqual(['Rahim']);
    expect(preview).toMatchObject({ duplicatesFound: 2, duplicatesSkipped: 2 });
  });

  it('picks the name column from the header, or the fullest column', () => {
    expect(suggestColumn([['ID', 'Full Name'], ['1', 'Rahim']], true)).toBe(1);
    expect(suggestColumn([['1', 'Rahim'], ['2', 'Nusrat'], ['', 'Tanzim']], false)).toBe(1);
  });

  it('describes the columns with their fill counts', () => {
    const cols = detectColumns(rows, true);
    expect(cols.map((c) => [c.label, c.nonEmpty])).toEqual([
      ['Name', 3],
      ['Team', 4],
    ]);
  });

  it('can read the names from another column', () => {
    const preview = buildImportPreview(rows, { columnIndex: 1, hasHeader: true, duplicatePolicy: 'keep', existingNames: [] });
    expect(preview.names).toEqual(['A', 'B', 'C', 'D']);
  });
});
