/** Wheel segment colors (also used for avatars next to winners). Cycled by segment index. */
export const wheelPalette = [
  '#8B6CF6', // violet
  '#F7B93E', // amber
  '#3FCB8B', // green
  '#F2557A', // rose
  '#3C9DFF', // blue
  '#FF8D5C', // orange
  '#2FBFC0', // teal
  '#C264E6', // orchid
] as const;

/** Animation timings in milliseconds. */
export const durations = {
  spin: 5600,
  spinReduced: 600,
} as const;
