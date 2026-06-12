/**
 * Clipboard utility that works on non-HTTPS (HTTP) sites.
 * Falls back to execCommand('copy') when Clipboard API unavailable.
 */
export function copyToClipboard(text: string): Promise<void> {
  // Try modern Clipboard API first (only works on HTTPS/localhost)
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback: textarea + execCommand
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    try {
      const ok = document.execCommand('copy');
      if (!ok) reject(new Error('execCommand copy returned false'));
      else resolve();
    } catch (e) {
      reject(e);
    } finally {
      document.body.removeChild(ta);
    }
  });
}
