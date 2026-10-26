// Bundled font assets grouped by family using ES6 barrel import from @/assets/fonts.
import type { FontSource } from 'expo-font';
import { fontAssets } from '@/assets/fonts';

export const FONT_FILES: Record<string, Record<string, FontSource>> = fontAssets;
