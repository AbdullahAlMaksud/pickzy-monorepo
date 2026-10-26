import {
  applyDuplicatePolicy,
  normalizeName,
} from '@/features/participants/services/participantNormalization';
import { columnLabel } from './parseXlsx';
import type { ColumnInfo, ImportOptions, ImportPreview } from './types';

/** Header labels (English + Bengali) that identify a "name" column. Compared in lowercase. */
const HEADER_WORDS = new Set([
  'name',
  'names',
  'full name',
  'fullname',
  'participant',
  'participants',
  'participant name',
  'student',
  'student name',
  'employee',
  'employee name',
  'person',
  'attendee',
  'attendee name',
  'candidate',
  'member',
  'player',
  'নাম',
  'পুরো নাম',
  'পূর্ণ নাম',
  'অংশগ্রহণকারী',
]);

export function looksLikeHeaderLabel(cell: string): boolean {
  return HEADER_WORDS.has(normalizeName(cell).toLocaleLowerCase());
}

function cellAt(row: readonly string[], index: number): string {
  return index >= 0 && index < row.length ? row[index] : '';
}

export function columnCount(rows: readonly string[][]): number {
  let max = 0;
  const sample = Math.min(rows.length, 500);
  for (let i = 0; i < sample; i++) max = Math.max(max, rows[i].length);
  return max;
}

/**
 * Suggests whether row 1 is a header: only when at least one cell matches a known header label.
 * It is only a *suggestion*: the UI shows a switch, so a first row like "Name" that is really a
 * participant is never dropped without the user being able to see and undo it.
 */
export function detectHeaderRow(rows: readonly string[][]): boolean {
  if (rows.length === 0) return false;
  return rows[0].some((cell) => looksLikeHeaderLabel(cell));
}

export function detectColumns(rows: readonly string[][], hasHeader: boolean): ColumnInfo[] {
  const total = columnCount(rows);
  const columns: ColumnInfo[] = [];
  const start = hasHeader ? 1 : 0;
  for (let c = 0; c < total; c++) {
    let nonEmpty = 0;
    for (let r = start; r < rows.length; r++) {
      if (normalizeName(cellAt(rows[r], c))) nonEmpty += 1;
    }
    const headerText = hasHeader ? normalizeName(cellAt(rows[0], c)) : '';
    columns.push({
      index: c,
      label: headerText || `${columnLabel(c)}`,
      nonEmpty,
    });
  }
  return columns;
}

/** Best column for names: the one whose header looks like a name column, else the fullest column. */
export function suggestColumn(rows: readonly string[][], hasHeader: boolean): number {
  const columns = detectColumns(rows, hasHeader);
  if (columns.length === 0) return 0;
  if (hasHeader && rows.length > 0) {
    const named = rows[0].findIndex((cell) => looksLikeHeaderLabel(cell));
    if (named >= 0) return named;
  }
  let best = columns[0];
  for (const column of columns) {
    if (column.nonEmpty > best.nonEmpty) best = column;
  }
  return best.index;
}

/** Builds the numbers shown in the import preview and the final list of names to add. */
export function buildImportPreview(
  rows: readonly string[][],
  options: ImportOptions,
): ImportPreview {
  const start = options.hasHeader ? 1 : 0;
  const headerSkipped =
    options.hasHeader && rows.length > 0
      ? normalizeName(cellAt(rows[0], options.columnIndex)) || null
      : null;

  const candidates: string[] = [];
  let blankSkipped = 0;
  for (let r = start; r < rows.length; r++) {
    const name = normalizeName(cellAt(rows[r], options.columnIndex));
    if (name) candidates.push(name);
    else blankSkipped += 1;
  }

  const applied = applyDuplicatePolicy(options.existingNames, candidates, options.duplicatePolicy);
  return {
    ...applied,
    blankSkipped,
    totalRows: Math.max(0, rows.length - start),
    headerSkipped,
    validRows: candidates.length,
  };
}
