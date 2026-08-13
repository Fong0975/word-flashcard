import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the Service Worker (production builds only) so the last
 * successfully built app shell — HTML, JS, CSS, and icons — stays available
 * for offline navigation. New versions are swapped in automatically in the
 * background; API requests are never intercepted since they go to a
 * different origin/port.
 */
export const registerServiceWorker = (): void => {
  if (import.meta.env.PROD) {
    registerSW({ immediate: true });
  }
};
