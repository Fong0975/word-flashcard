// Generates the full list of page numbers, used for the mobile page-select dropdown.
export const generatePageOptions = (totalPages: number): number[] => {
  const options = [];
  for (let i = 1; i <= totalPages; i++) {
    options.push(i);
  }
  return options;
};

// Generates a sliding window of up to 5 page numbers centered on the current page,
// used for the desktop page-number buttons.
export const getPageNumbers = (
  currentPage: number,
  totalPages: number,
): number[] => {
  const maxVisiblePages = 5;
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, currentPage + halfVisible);

  // Adjust if we're near the beginning
  if (currentPage <= halfVisible) {
    endPage = Math.min(totalPages, maxVisiblePages);
  }

  // Adjust if we're near the end
  if (currentPage > totalPages - halfVisible) {
    startPage = Math.max(1, totalPages - maxVisiblePages + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
};
