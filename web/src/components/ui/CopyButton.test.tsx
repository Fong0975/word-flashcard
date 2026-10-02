import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import {
  useCopyToClipboard,
  UseCopyToClipboardOptions,
  UseCopyToClipboardReturn,
} from '../../hooks/ui/useCopyToClipboard';

import { CopyButton, COPY_FEEDBACK_DURATION_MS } from './CopyButton';

vi.mock('../../hooks/ui/useCopyToClipboard');

const mockedUseCopyToClipboard = useCopyToClipboard as Mock;

const buildHookReturn = (
  overrides: Partial<UseCopyToClipboardReturn> = {},
): UseCopyToClipboardReturn => ({
  copySuccess: false,
  copyError: null,
  isSupported: true,
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
  resetState: vi.fn(),
  ...overrides,
});

describe('CopyButton', () => {
  beforeEach(() => {
    mockedUseCopyToClipboard.mockReset();
    mockedUseCopyToClipboard.mockReturnValue(buildHookReturn());
  });

  it('renders with the default title', () => {
    render(<CopyButton text='hello' />);
    expect(
      screen.getByRole('button', { name: 'Copy to clipboard' }),
    ).toBeInTheDocument();
  });

  it('prefers an explicit title over the derived one', () => {
    render(<CopyButton text='hello' title='Copy the word' />);
    expect(
      screen.getByRole('button', { name: 'Copy the word' }),
    ).toBeInTheDocument();
  });

  it('calls copyToClipboard with the given text when clicked', async () => {
    const copyToClipboard = vi.fn().mockResolvedValue(undefined);
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copyToClipboard }),
    );
    const user = userEvent.setup();
    render(<CopyButton text='hello' />);

    await user.click(screen.getByRole('button'));

    expect(copyToClipboard).toHaveBeenCalledWith('hello');
  });

  it.each([
    { name: 'there is no text', props: { text: '' } },
    {
      name: 'the disabled prop is set',
      props: { text: 'hello', disabled: true },
    },
  ])('is disabled and does not copy when $name', async ({ props }) => {
    const copyToClipboard = vi.fn();
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copyToClipboard }),
    );
    const user = userEvent.setup();
    render(<CopyButton {...props} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(button).toBeDisabled();
    expect(copyToClipboard).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'idle',
      state: {},
      expectedName: 'Copy to clipboard',
      hasBlueTint: false,
      iconClass: undefined,
    },
    {
      name: 'success',
      state: { copySuccess: true },
      expectedName: 'Copied!',
      hasBlueTint: true,
      iconClass: undefined,
    },
    {
      name: 'error',
      state: { copyError: 'oops' },
      expectedName: 'Copy failed',
      hasBlueTint: false,
      iconClass: 'text-error',
    },
  ])(
    'renders the $name state',
    ({ state, expectedName, hasBlueTint, iconClass }) => {
      mockedUseCopyToClipboard.mockReturnValue(buildHookReturn(state));
      render(<CopyButton text='hello' />);

      const button = screen.getByRole('button', { name: expectedName });
      if (hasBlueTint) {
        expect(button).toHaveClass('bg-primary-50');
      } else {
        expect(button).not.toHaveClass('bg-primary-50');
      }
      if (iconClass) {
        expect(button.querySelector('svg')).toHaveClass(iconClass);
      }
    },
  );

  it('uses custom success and error labels', () => {
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copySuccess: true }),
    );
    const { unmount } = render(
      <CopyButton text='hello' successText='Word copied!' />,
    );
    expect(
      screen.getByRole('button', { name: 'Word copied!' }),
    ).toBeInTheDocument();
    unmount();

    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copyError: 'oops' }),
    );
    render(<CopyButton text='hello' errorText='Failed!' />);
    expect(screen.getByRole('button', { name: 'Failed!' })).toBeInTheDocument();
  });

  it('reverts the feedback icon after the configured duration', () => {
    render(<CopyButton text='hello' />);
    const options: UseCopyToClipboardOptions =
      mockedUseCopyToClipboard.mock.calls[0][0];

    expect(options.autoResetDelay).toBe(COPY_FEEDBACK_DURATION_MS);
    expect(COPY_FEEDBACK_DURATION_MS).toBe(1000);
  });

  it('shows an error toast in the document body when the copy fails', () => {
    render(<CopyButton text='hello' />);
    const options: UseCopyToClipboardOptions =
      mockedUseCopyToClipboard.mock.calls[0][0];

    act(() => {
      options.onError?.(new Error('Copy denied'), 'Copy denied');
    });

    const toast = screen.getByRole('alert');
    expect(toast).toHaveTextContent('Copy denied');
    expect(document.body).toContainElement(toast);
    expect(toast.parentElement?.parentElement).toBe(document.body);
  });

  it.each([
    { size: 'sm' as const, expectedClass: 'p-1' },
    { size: 'md' as const, expectedClass: 'p-2' },
    { size: 'lg' as const, expectedClass: 'p-3' },
  ])('applies $expectedClass for $size size', ({ size, expectedClass }) => {
    render(<CopyButton text='hello' size={size} />);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });
});
