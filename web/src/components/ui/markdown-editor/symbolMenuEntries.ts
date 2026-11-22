import { SymbolButton, TemplateButton } from '../../../types/components';

export type SymbolMenuEntry =
  | { kind: 'item'; label: string; value: string }
  | { kind: 'group'; label: string; children: TemplateButton[] };

const isInsertable = (button: unknown): button is TemplateButton => {
  if (typeof button !== 'object' || button === null) {
    return false;
  }
  const { label, value } = button as Partial<TemplateButton>;
  return typeof label === 'string' && typeof value === 'string';
};

/**
 * Normalizes the raw Symbols config into menu entries. The config file is
 * user-provided, so malformed entries are dropped rather than rendered.
 *
 * An entry with a `children` array is a group and its own `value` is ignored;
 * only one nesting level exists, so children that are themselves groups are
 * dropped. A group left with no insertable children is dropped entirely.
 */
export const toSymbolMenuEntries = (
  buttons: readonly SymbolButton[],
): SymbolMenuEntry[] => {
  const entries: SymbolMenuEntry[] = [];

  buttons.forEach(button => {
    if (typeof button !== 'object' || button === null) {
      return;
    }
    if (typeof button.label !== 'string') {
      return;
    }

    if ('children' in button && Array.isArray(button.children)) {
      const children = button.children.filter(isInsertable);
      if (children.length > 0) {
        entries.push({ kind: 'group', label: button.label, children });
      }
      return;
    }

    if (isInsertable(button)) {
      entries.push({ kind: 'item', label: button.label, value: button.value });
    }
  });

  return entries;
};
