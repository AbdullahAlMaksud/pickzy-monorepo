export interface Participant {
  id: number;
  projectId: number;
  displayName: string;
  position: number;
  createdAt: number;
  updatedAt: number;
}

/** A participant that exists only in memory (new-project draft, import preview). */
export interface DraftParticipant {
  /** Stable local key for list rendering and editing. */
  key: string;
  name: string;
}

/**
 * Duplicate-name policy (documented in README):
 * - `keep` (default): every row is kept. Nothing is dropped, duplicates are only reported.
 * - `skip`: later rows whose normalized name matches an earlier/existing one are filtered out,
 *   and the number of filtered rows is always shown to the user.
 */
export type DuplicatePolicy = 'keep' | 'skip';

export interface NameBatchResult {
  /** Names that will be added (after the duplicate policy). */
  names: string[];
  blankSkipped: number;
  /** Rows that matched an existing/earlier name (whether kept or skipped). */
  duplicatesFound: number;
  /** Rows actually removed because of the `skip` policy. */
  duplicatesSkipped: number;
  /** Names that were longer than the maximum and got shortened. */
  truncated: number;
}
