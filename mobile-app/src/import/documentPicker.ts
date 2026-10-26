import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { decodeTextBytes } from './textDecoding';
import { parseCsvAsync } from './parseCsv';
import { parseTxtAsync } from './parseTxt';
import { looksLikeLegacyXls, openXlsx } from './parseXlsx';
import { ImportError, type ImportDocument, type ImportFormat } from './types';

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

/**
 * Lets the user pick a local file and parses it. Throws {@link ImportError} for expected failures.
 * Returns `null` if the user cancels the picker.
 */
export async function pickAndOpenImportFile(): Promise<ImportDocument | null> {
  let result: DocumentPicker.DocumentPickerResult;
  try {
    result = await DocumentPicker.getDocumentAsync({
      // '*/*' because some Android providers report .xlsx/.csv with generic MIME types;
      // we validate by extension / MIME ourselves and show a clear error instead.
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
  } catch (error) {
    throw new ImportError('READ_FAILED', error instanceof Error ? error.message : undefined);
  }
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const format = detectFormat(asset.name, asset.mimeType);
  if (format === 'xls') throw new ImportError('LEGACY_XLS');
  if (!format) throw new ImportError('UNSUPPORTED_TYPE');

  let bytes: Uint8Array;
  try {
    bytes = await new File(asset.uri).bytes();
  } catch (error) {
    throw new ImportError('READ_FAILED', error instanceof Error ? error.message : undefined);
  }
  return openImportDocument(asset.name, format, bytes);
}
