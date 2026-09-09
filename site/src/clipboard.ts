/**
 * Copies `text`, resolving to whether it worked.
 *
 * `navigator.clipboard` only exists in a secure context, so it is `undefined` when the
 * site is served over plain http (an IP-address preview, say), so reaching straight for
 * `.writeText` throws there. Even where it exists the promise can reject (denied
 * permission, an unfocused document), so callers get a boolean and only show "Copied!"
 * when the text really landed on the clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
