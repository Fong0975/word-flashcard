import { SymbolButton } from '../../../types/components';

import { toSymbolMenuEntries } from './symbolMenuEntries';

describe('toSymbolMenuEntries', () => {
  const malformed = (value: unknown) => value as SymbolButton;

  it.each([
    {
      name: 'keeps plain entries as items',
      input: [{ label: '→', value: '→' }],
      expected: [{ kind: 'item', label: '→', value: '→' }],
    },
    {
      name: 'turns an entry with children into a group',
      input: [
        {
          label: 'Alert',
          children: [
            { label: 'NOTE', value: '> [!NOTE]' },
            { label: 'TIP', value: '> [!TIP]' },
          ],
        },
      ],
      expected: [
        {
          kind: 'group',
          label: 'Alert',
          children: [
            { label: 'NOTE', value: '> [!NOTE]' },
            { label: 'TIP', value: '> [!TIP]' },
          ],
        },
      ],
    },
    {
      name: 'ignores the value of an entry that also has children',
      input: [
        {
          label: 'Alert',
          value: 'ignored',
          children: [{ label: 'NOTE', value: 'n' }],
        },
      ],
      expected: [
        {
          kind: 'group',
          label: 'Alert',
          children: [{ label: 'NOTE', value: 'n' }],
        },
      ],
    },
    {
      name: 'drops nested groups and malformed children',
      input: [
        {
          label: 'Alert',
          children: [
            { label: 'NOTE', value: 'n' },
            { label: 'Nested', children: [{ label: 'x', value: 'x' }] },
            { label: 'NoValue' },
            null,
          ],
        },
      ].map(malformed),
      expected: [
        {
          kind: 'group',
          label: 'Alert',
          children: [{ label: 'NOTE', value: 'n' }],
        },
      ],
    },
    {
      name: 'drops a group left without insertable children',
      input: [
        { label: 'Empty', children: [] },
        { label: 'AllBad', children: [{ label: 'x' }] },
      ].map(malformed),
      expected: [],
    },
    {
      name: 'drops entries without a label or a usable value',
      input: [
        null,
        { value: 'no label' },
        { label: 'no value' },
        { label: 1, value: 'bad label' },
      ].map(malformed),
      expected: [],
    },
    {
      name: 'preserves the order of mixed entries',
      input: [
        { label: 'a', value: 'a' },
        { label: 'G', children: [{ label: 'g', value: 'g' }] },
        { label: 'b', value: 'b' },
      ],
      expected: [
        { kind: 'item', label: 'a', value: 'a' },
        { kind: 'group', label: 'G', children: [{ label: 'g', value: 'g' }] },
        { kind: 'item', label: 'b', value: 'b' },
      ],
    },
  ])('$name', ({ input, expected }) => {
    expect(toSymbolMenuEntries(input)).toEqual(expected);
  });
});
