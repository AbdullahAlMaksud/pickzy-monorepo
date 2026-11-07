// Bundled font assets grouped by family using ES6 barrel import from @public/fonts.
import type { FontSource } from 'expo-font';
import { fontAssets } from '@public/fonts';

export const FONT_FILES: Record<string, Record<string, FontSource>> = fontAssets;
