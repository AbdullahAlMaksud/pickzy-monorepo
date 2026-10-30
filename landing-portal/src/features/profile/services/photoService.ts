export type PhotoResult =
  | { status: 'ok'; dataUrl: string }
  | { status: 'invalid' }
  | { status: 'error' };

export const AVATAR_SIZE = 256;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/** True for files we are willing to read as a profile picture. */
export function isAcceptablePhoto(file: Pick<File, 'type' | 'size'>): boolean {
  return file.type.startsWith('image/') && file.size > 0 && file.size <= MAX_PHOTO_BYTES;
}

/**
 * Crops the picture to a centered square and shrinks it to 256px, so the data URL kept in IndexedDB
 * stays small (usually under 30 KB) however large the original is.
 */
export async function fileToAvatarDataUrl(file: File): Promise<PhotoResult> {
  if (!isAcceptablePhoto(file)) return { status: 'invalid' };
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const side = Math.min(bitmap.width, bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { status: 'error' };
      ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      return { status: 'ok', dataUrl: canvas.toDataURL('image/jpeg', 0.8) };
    } finally {
      bitmap.close();
    }
  } catch {
    return { status: 'error' };
  }
}
