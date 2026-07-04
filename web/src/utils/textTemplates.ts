/**
 * Appends `textToAppend` to `current`, inserting a newline separator only
 * when `current` is non-empty and doesn't already end with one. Used to
 * insert a template snippet without producing a run of blank lines.
 */
export const appendTemplateText = (
  current: string,
  textToAppend: string,
): string => {
  const separator = current && !current.endsWith('\n') ? '\n' : '';
  return current + separator + textToAppend;
};
