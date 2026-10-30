import { strFromU8 } from 'fflate';
import { ImportError } from '../types';

/** Share of U+FFFD replacement characters above which we assume the encoding is wrong. */
const REPLACEMENT_LIMIT = 0.02;

function decodeUtf16(bytes: Uint8Array, littleEndian: boolean, start: number): string {
  const units: string[] = [];
  const CHUNK = 4096;
  let buffer: number[] = [];
  for (let i = start; i + 1 < bytes.length; i += 2) {
    const lo = bytes[littleEndian ? i : i + 1];
    const hi = bytes[littleEndian ? i + 1 : i];
    buffer.push((hi << 8) | lo);
    if (buffer.length >= CHUNK) {
      units.push(String.fromCharCode(...buffer));
      buffer = [];
    }
  }
  if (buffer.length) units.push(String.fromCharCode(...buffer));
  return units.join('');
}

/**
 * Decodes the bytes of a text file. Handles UTF-8 (with or without BOM) and UTF-16 (BOM required).
 * Throws `BAD_ENCODING` if the content does not look like valid text, and `CORRUPT_FILE` for binary data.
 */
export function decodeTextBytes(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  let text: string;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    text = decodeUtf16(bytes, true, 2);
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    text = decodeUtf16(bytes, false, 2);
  } else {
    const start = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
    text = strFromU8(start ? bytes.subarray(start) : bytes);
  }

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  if (text.includes('\u0000')) {
    throw new ImportError('CORRUPT_FILE', 'File contains binary data');
  }

  let replacements = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 0xfffd) replacements += 1;
  }
  if (text.length > 0 && replacements / text.length > REPLACEMENT_LIMIT) {
    throw new ImportError('BAD_ENCODING', 'File is not valid UTF-8 text');
  }
  return text;
}

export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
