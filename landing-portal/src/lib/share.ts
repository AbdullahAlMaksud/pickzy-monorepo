export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unsupported';

/**
 * Shares text with the device's share sheet when there is one, otherwise copies it to the clipboard.
 * Never throws: the caller only needs to know what happened so it can show the right message.
 */
export async function shareText(text: string, title?: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title, text });
      return 'shared';
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    // any other failure: fall through to the clipboard
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'unsupported';
  }
}
