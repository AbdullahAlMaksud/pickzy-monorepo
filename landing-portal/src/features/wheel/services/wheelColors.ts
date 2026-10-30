/**
 * Color index for segment `i` of `n`, cycling through a palette of `paletteSize` colors. When the cycle
 * would put the same color on the LAST and FIRST segments (n % paletteSize === 1, n > 1), the last
 * segment takes a different color so neighbours are always distinguishable.
 */
export function segmentColorIndex(i: number, n: number, paletteSize: number): number {
  if (paletteSize <= 1 || n <= 1) return 0;
  const base = i % paletteSize;
  if (i === n - 1 && n > 1 && base === 0) return 1;
  return base;
}
