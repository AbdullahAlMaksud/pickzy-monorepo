import type { DuplicatePolicy, NameBatchResult } from '@/features/participants/types';

export type ImportFormat = 'csv' | 'txt' | 'xlsx';

export type ImportErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'LEGACY_XLS'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'CORRUPT_FILE'
  | 'BAD_ENCODING'
  | 'UNSUPPORTED_WORKBOOK'
  | 'NO_VALID_ROWS'
  | 'READ_FAILED';

export class ImportError extends Error {
  readonly code: ImportErrorCode;
  constructor(code: ImportErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ImportError';
    this.code = code;
  }
}

/** A parsed file: one or more sheets of raw string cells. */
export interface ImportDocument {
  fileName: string;
  format: ImportFormat;
  sheetNames: string[];
  /** Loads (and caches) the raw rows of a sheet. Yields to the UI thread while working. */
  loadSheet(index: number): Promise<string[][]>;
}

export interface ColumnInfo {
  index: number;
  /** Header text when the first row looks like a header, otherwise "Column A". */
  label: string;
  nonEmpty: number;
}

export interface ImportOptions {
  columnIndex: number;
  hasHeader: boolean;
  duplicatePolicy: DuplicatePolicy;
  existingNames: readonly string[];
}

export interface ImportPreview extends NameBatchResult {
  totalRows: number;
  /** The header cell that was skipped, if any (so the UI can show what was dropped). */
  headerSkipped: string | null;
  /** Rows with a valid name before the duplicate policy is applied. */
  validRows: number;
}
