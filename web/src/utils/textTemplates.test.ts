import { appendTemplateText } from './textTemplates';

describe('appendTemplateText', () => {
  it('appends directly when current is empty', () => {
    expect(appendTemplateText('', 'Hello')).toBe('Hello');
  });

  it('inserts a newline separator when current does not end with one', () => {
    expect(appendTemplateText('Line 1', 'Line 2')).toBe('Line 1\nLine 2');
  });

  it('does not insert an extra newline when current already ends with one', () => {
    expect(appendTemplateText('Line 1\n', 'Line 2')).toBe('Line 1\nLine 2');
  });

  it('appends an empty string without altering current', () => {
    expect(appendTemplateText('Line 1', '')).toBe('Line 1\n');
  });
});
