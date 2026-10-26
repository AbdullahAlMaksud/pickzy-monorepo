import { File, Directory, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export type PhotoPickResult =
  | { status: 'picked'; uri: string }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'error' };

const AVATAR_DIR = 'profile';

function avatarDirectory(): Directory {
  const dir = new Directory(Paths.document, AVATAR_DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** Deletes a previously stored avatar (never throws: a missing file is fine). */
export function deleteStoredPhoto(uri: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // ignore: nothing useful to do if the file is already gone
  }
}

export function photoExists(uri: string | null): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/**
 * Lets the user choose a photo and copies it into the app's own document directory, so the reference we
 * keep in SQLite stays valid even if the picked file lives in a temporary cache. The image itself is
 * never stored in the database.
 */
export async function pickAndStoreProfilePhoto(previousUri: string | null): Promise<PhotoPickResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return { status: 'cancelled' };

    const source = new File(result.assets[0].uri);
    const target = new File(avatarDirectory(), `avatar-${Date.now()}.jpg`);
    await source.copy(target);
    deleteStoredPhoto(previousUri);
    return { status: 'picked', uri: target.uri };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('permission')) return { status: 'denied' };
    return { status: 'error' };
  }
}
