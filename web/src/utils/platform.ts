/**
 * Detects iOS and iPadOS devices, including iPadOS in desktop-class mode,
 * which reports a Macintosh user agent but exposes multi-touch support.
 * @returns true if the current browser runs on an iPhone, iPad, or iPod.
 */
export const isAppleMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const { userAgent, maxTouchPoints } = navigator;
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return true;
  }

  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
};
