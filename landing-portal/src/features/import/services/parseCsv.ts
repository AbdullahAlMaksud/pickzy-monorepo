import { ImportError } from '../types';
import { yieldToEventLoop } from './textDecoding';

export type CsvDelimiter = ',' | ';' | '\t';

export interface CsvParseResult {
  rows: string[][];
  delimiter: CsvDelimiter;
}

const CANDIDATES: readonly CsvDelimiter[] = [',', ';', '\t'];

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Counts delimiter occurrences outside quotes in the first few lines and picks the most frequent. */
export function detectDelimiter(text: string): CsvDelimiter {
  const counts: Record<CsvDelimiter, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  let lines = 0;
  const limit = Math.min(text.length, 20000);
  for (let i = 0; i < limit && lines < 20; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (ch === '\n') lines += 1;
      else if (ch === ',' || ch === ';' || ch === '\t') counts[ch] += 1;
    }
  }
  let best: CsvDelimiter = ',';
  for (const candidate of CANDIDATES) {
    if (counts[candidate] > counts[best]) best = candidate;
  }
  return best;
}

/**
 * Incremental RFC-4180 style parser. Supports quoted fields, commas/newlines inside quotes,
 * escaped quotes (`""`), and `\n`, `\r\n` and `\r` line endings. `feed()` can be called with slices
 * of a large text so the caller can yield to the UI thread between slices.
 */
export class CsvParser {
  readonly rows: string[][] = [];
  private row: string[] = [];
  private field = '';
  private inQuotes = false;
  private fieldWasQuoted = false;
  private pendingQuote = false; // saw a quote while inQuotes; might be an escape or the end
  private pendingCr = false;

  constructor(private readonly delimiter: CsvDelimiter) {}

  private endField(): void {
    this.row.push(this.field);
    this.field = '';
    this.fieldWasQuoted = false;
  }

  private endRow(): void {
    this.endField();
    this.rows.push(this.row);
    this.row = [];
  }

  feed(chunk: string): void {
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];

      if (this.pendingCr) {
        this.pendingCr = false;
        if (ch === '\n') continue; // CRLF: the row already ended on '\r'
      }

      if (this.pendingQuote) {
        this.pendingQuote = false;
        if (ch === '"') {
          this.field += '"';
          continue;
        }
        this.inQuotes = false; // that quote closed the field; fall through to handle `ch`
      }

      if (this.inQuotes) {
        if (ch === '"') this.pendingQuote = true;
        else this.field += ch;
        continue;
      }

      if (ch === '"' && this.field === '' && !this.fieldWasQuoted) {
        this.inQuotes = true;
        this.fieldWasQuoted = true;
      } else if (ch === this.delimiter) {
        this.endField();
      } else if (ch === '\n') {
        this.endRow();
      } else if (ch === '\r') {
        this.endRow();
        this.pendingCr = true;
      } else {
        this.field += ch; // stray quotes in unquoted fields are kept literally
      }
    }
  }

  finish(): string[][] {
    if (this.pendingQuote) {
      this.pendingQuote = false;
      this.inQuotes = false;
    }
    // Flush the last row unless the text ended with a line break (empty trailing row).
    if (this.field !== '' || this.row.length > 0 || this.fieldWasQuoted) this.endRow();
    return this.rows;
  }
}

function assertLooksLikeText(text: string): void {
  if (text.includes('\u0000')) throw new ImportError('CORRUPT_FILE', 'File contains binary data');
}

/** Synchronous parse (small inputs and tests). */
export function parseCsv(input: string, delimiter?: CsvDelimiter): CsvParseResult {
  const text = stripBom(input);
  assertLooksLikeText(text);
  const used = delimiter ?? detectDelimiter(text);
  const parser = new CsvParser(used);
  parser.feed(text);
  return { rows: parser.finish(), delimiter: used };
}

const CHUNK_SIZE = 200_000;

/** Parses in slices, yielding to the event loop between slices so large files do not freeze the UI. */
export async function parseCsvAsync(
  input: string,
  delimiter?: CsvDelimiter,
): Promise<CsvParseResult> {
  const text = stripBom(input);
  assertLooksLikeText(text);
  const used = delimiter ?? detectDelimiter(text);
  const parser = new CsvParser(used);
  for (let offset = 0; offset < text.length; offset += CHUNK_SIZE) {
    parser.feed(text.slice(offset, offset + CHUNK_SIZE));
    if (offset + CHUNK_SIZE < text.length) await yieldToEventLoop();
  }
  return { rows: parser.finish(), delimiter: used };
}
