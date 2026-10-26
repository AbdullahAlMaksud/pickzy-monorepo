import * as Font from 'expo-font';
import { FONT_FILES } from './fontAssets';
import { BENGALI_DISPLAY_FONT_PREFIX, BENGALI_FONT_PREFIX, FONT_OPTIONS, type FontKey } from './typography';

const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();

/** Loads every weight of a bundled font family (idempotent). */
export function loadFontFamily(prefix: string): Promise<void> {
  if (loaded.has(prefix)) return Promise.resolve();
  const existing = inflight.get(prefix);
  if (existing) return existing;
  const files = FONT_FILES[prefix];
  if (!files) return Promise.resolve();
  const task = Font.loadAsync(files)
    .then(() => {
      loaded.add(prefix);
    })
    .finally(() => {
      inflight.delete(prefix);
    });
  inflight.set(prefix, task);
  return task;
}

/** Bengali is always needed (language switch, Bengali participant names); the selected Latin font next. */
export async function loadFontsForKey(fontKey: FontKey): Promise<void> {
  const prefix = FONT_OPTIONS.find((f) => f.key === fontKey)?.prefix ?? 'Inter';
  await Promise.all([
    loadFontFamily(BENGALI_FONT_PREFIX),
    loadFontFamily(BENGALI_DISPLAY_FONT_PREFIX),
    loadFontFamily(prefix),
  ]);
}

/** Preloads the remaining families in the background so the font picker previews are instant. */
export function preloadRemainingFonts(): void {
  for (const option of FONT_OPTIONS) {
    void loadFontFamily(option.prefix).catch(() => undefined);
  }
}
