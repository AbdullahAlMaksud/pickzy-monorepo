import type { DuplicatePolicy, NameBatchResult } from '../types';

export const MAX_NAME_LENGTH = 80;

/**
 * Characters that are removed from names. Note: ZWJ (U+200D) and ZWNJ (U+200C) are intentionally
 * kept because Bengali (and other Indic scripts) rely on them for correct conjunct rendering.
 */
const STRIP_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B\u2060\uFEFF]/g;
const WHITESPACE_RE = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g;

/** Normalizes user text into a display name: NFC, no control chars, single spaces, trimmed. */
export function normalizeName(raw: string): string {
  if (!raw) return '';
  return raw.normalize('NFC').replace(STRIP_RE, '').replace(WHITESPACE_RE, ' ').trim();
}

export function clampName(name: string): { name: string; truncated: boolean } {
  const chars = Array.from(name);
  if (chars.length <= MAX_NAME_LENGTH) return { name, truncated: false };
  return { name: chars.slice(0, MAX_NAME_LENGTH).join('').trim(), truncated: true };
}

/** Key used to decide whether two names are "the same person". Case-insensitive, NFC-normalized. */
export function duplicateKey(name: string): string {
  return normalizeName(name).toLocaleLowerCase();
}

export type NameValidation = { ok: true; name: string } | { ok: false; code: 'EMPTY' };

export function validateParticipantName(raw: string): NameValidation {
  const name = clampName(normalizeName(raw)).name;
  if (!name) return { ok: false, code: 'EMPTY' };
  return { ok: true, name };
}

/** Splits free text (one name per line) into normalized names. Blank lines are counted, not lost silently. */
export function splitMultilineNames(text: string): { names: string[]; blankSkipped: number } {
  const names: string[] = [];
  let blankSkipped = 0;
  for (const line of text.split(/\r\n|\n|\r/)) {
    const name = normalizeName(line);
    if (name) names.push(name);
    else blankSkipped += 1;
  }
  // A trailing newline is not a "skipped blank row".
  if (blankSkipped > 0 && /(\r\n|\n|\r)$/.test(text)) blankSkipped -= 1;
  return { names, blankSkipped: Math.max(0, blankSkipped) };
}

/**
 * Applies the duplicate policy to a batch of incoming names, comparing against `existing` names and
 * earlier names of the same batch. Order is preserved.
 */
export function applyDuplicatePolicy(
  existing: readonly string[],
  incoming: readonly string[],
  policy: DuplicatePolicy,
): Pick<NameBatchResult, 'names' | 'duplicatesFound' | 'duplicatesSkipped' | 'truncated'> {
  const seen = new Set(existing.map(duplicateKey));
  const names: string[] = [];
  let duplicatesFound = 0;
  let duplicatesSkipped = 0;
  let truncated = 0;

  for (const raw of incoming) {
    const clamped = clampName(raw);
    if (!clamped.name) continue;
    if (clamped.truncated) truncated += 1;
    const key = duplicateKey(clamped.name);
    if (seen.has(key)) {
      duplicatesFound += 1;
      if (policy === 'skip') {
        duplicatesSkipped += 1;
        continue;
      }
    }
    seen.add(key);
    names.push(clamped.name);
  }
  return { names, duplicatesFound, duplicatesSkipped, truncated };
}

/** Convenience for pasted multi-line text. */
export function prepareNameBatch(
  text: string,
  existing: readonly string[],
  policy: DuplicatePolicy,
): NameBatchResult {
  const { names, blankSkipped } = splitMultilineNames(text);
  return { blankSkipped, ...applyDuplicatePolicy(existing, names, policy) };
}

export function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase() : '?';
}
