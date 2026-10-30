import { yieldToEventLoop } from './textDecoding';

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Plain text: one participant per line. Commas are kept as part of the name
 * ("Smith, John" is one person). Returns single-column rows so TXT shares the CSV preview pipeline.
 */
export function parseTxt(input: string): string[][] {
  const text = stripBom(input);
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.map((line) => [line]);
}

export async function parseTxtAsync(input: string): Promise<string[][]> {
  const text = stripBom(input);
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  const rows: string[][] = new Array(lines.length);
  for (let i = 0; i < lines.length; i++) {
    rows[i] = [lines[i]];
    if (i % 20000 === 19999) await yieldToEventLoop();
  }
  return rows;
}
