import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  useCopyToClipboard,
  UseCopyToClipboardReturn,
} from '../../hooks/ui/useCopyToClipboard';

import { CopyButton } from './CopyButton';

jest.mock('../../hooks/ui/useCopyToClipboard');

const mockedUseCopyToClipboard = useCopyToClipboard as jest.Mock;

const buildHookReturn = (
  overrides: Partial<UseCopyToClipboardReturn> = {},
): UseCopyToClipboardReturn => ({
  copySuccess: false,
  copyError: null,
  isSupported: true,
  copyToClipboard: jest.fn().mockResolvedValue(undefined),
  resetState: jest.fn(),
  ...overrides,
});

describe('CopyButton', () => {
  beforeEach(() => {
    mockedUseCopyToClipboard.mockReturnValue(buildHookReturn());
  });

  it('renders with the default title', () => {
    render(<CopyButton text='hello' />);
    expect(
      screen.getByRole('button', { name: 'Copy to clipboard' }),
    ).toBeInTheDocument();
  });

  it('calls copyToClipboard with the given text when clicked', async () => {
    const copyToClipboard = jest.fn().mockResolvedValue(undefined);
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copyToClipboard }),
    );
    const user = userEvent.setup();
    render(<CopyButton text='hello' />);

    await user.click(screen.getByRole('button'));

    expect(copyToClipboard).toHaveBeenCalledWith('hello');
  });

  it('is disabled when there is no text', () => {
    render(<CopyButton text='' />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<CopyButton text='hello' disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call copyToClipboard when disabled', async () => {
    const copyToClipboard = jest.fn();
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copyToClipboard }),
    );
    const user = userEvent.setup();
    render(<CopyButton text='hello' disabled />);

    await user.click(screen.getByRole('button'));
    expect(copyToClipboard).not.toHaveBeenCalled();
  });

  it('shows the success title once copied', () => {
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copySuccess: true }),
    );
    render(<CopyButton text='hello' successText='Copied!' />);
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('shows the error title when copying failed', () => {
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copyError: 'oops' }),
    );
    render(<CopyButton text='hello' errorText='Failed!' />);
    expect(screen.getByRole('button', { name: 'Failed!' })).toBeInTheDocument();
  });

  it('prefers an explicit title over the derived one', () => {
    render(<CopyButton text='hello' title='Copy the word' />);
    expect(
      screen.getByRole('button', { name: 'Copy the word' }),
    ).toBeInTheDocument();
  });

  it('calls onCopySuccess when copy succeeds', async () => {
    const onCopySuccess = jest.fn();
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copySuccess: true }),
    );
    const user = userEvent.setup();
    render(<CopyButton text='hello' onCopySuccess={onCopySuccess} />);

    await user.click(screen.getByRole('button'));

    expect(onCopySuccess).toHaveBeenCalled();
  });

  it('calls onCopyError with the error when copy fails', async () => {
    const onCopyError = jest.fn();
    mockedUseCopyToClipboard.mockReturnValue(
      buildHookReturn({ copyError: 'oops' }),
    );
    const user = userEvent.setup();
    render(<CopyButton text='hello' onCopyError={onCopyError} />);

    await user.click(screen.getByRole('button'));

    expect(onCopyError).toHaveBeenCalledWith('oops');
  });

  it.each([
    { size: 'sm' as const, expectedClass: 'p-1' },
    { size: 'lg' as const, expectedClass: 'p-3' },
  ])('applies $expectedClass for $size size', testCase => {
    render(<CopyButton text='hello' size={testCase.size} />);
    expect(screen.getByRole('button')).toHaveClass(testCase.expectedClass);
  });

  it.each([
    { variant: 'ghost' as const, expectedClass: 'text-gray-500' },
    { variant: 'outline' as const, expectedClass: 'border' },
  ])('applies $expectedClass for $variant variant', testCase => {
    render(<CopyButton text='hello' variant={testCase.variant} />);
    expect(screen.getByRole('button')).toHaveClass(testCase.expectedClass);
  });
});
