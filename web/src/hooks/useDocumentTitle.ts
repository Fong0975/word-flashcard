import { useEffect } from 'react';

import { PageTitleOptions, formatPageTitle } from '../utils/pageTitle';

/**
 * Keeps the browser tab title in sync with the current page.
 *
 * The title is intentionally not restored on unmount: every routed page sets
 * its own, and restoring would briefly flash the previous page's title.
 *
 * @param pageType - Kind of page (e.g. `Word`, `Questions (Page 2)`).
 * @param detail - Most specific content of the page (e.g. the word itself).
 * @param options - Detail prefix and width budget.
 */
export const useDocumentTitle = (
  pageType?: string | null,
  detail?: string | null,
  options?: PageTitleOptions,
): void => {
  const title = formatPageTitle(pageType, detail, options);

  useEffect(() => {
    document.title = title;
  }, [title]);
};
