import type { TFunction } from 'i18next';
import type { NameBatchResult } from '../types';

/**
 * Builds the "what just happened" line after adding names. Everything that was skipped, kept as a
 * duplicate or shortened is reported, so data is never discarded silently.
 */
export function describeBatch(t: TFunction, added: number, result: Omit<NameBatchResult, 'names'>): string {
  const parts: string[] = [];
  if (added === 0) parts.push(t('projects:summary.nothingAdded'));
  else parts.push(added === 1 ? t('projects:summary.addedOne') : t('projects:summary.added', { count: added }));
  if (result.duplicatesSkipped > 0) parts.push(t('projects:summary.skipped', { count: result.duplicatesSkipped }));
  else if (result.duplicatesFound > 0) parts.push(t('projects:summary.keptDuplicates', { count: result.duplicatesFound }));
  if (result.blankSkipped > 0) parts.push(t('projects:summary.blank', { count: result.blankSkipped }));
  if (result.truncated > 0) parts.push(t('projects:summary.shortened', { count: result.truncated }));
  return parts.join(' · ');
}
