/**
 * Saves a blob to the user's device under the given file name.
 *
 * Goes through a temporary object URL and anchor, since that is the only way
 * to name a download whose bytes are already in memory.
 *
 * @param blob - The file contents.
 * @param filename - The name the browser saves the file as.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Formats the current time for use inside a file name.
 *
 * @returns The ISO-8601 UTC timestamp with `:` and `.` replaced by `-`, as
 * those are not safe in file names on every platform.
 */
export const timestampForFilename = (): string =>
  new Date().toISOString().replace(/[:.]/g, '-');
