import { renderHook, act } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as unknown as { clipboard?: unknown }).clipboard;
    delete (document as unknown as { execCommand?: unknown }).execCommand;
  });

  describe('with Clipboard API support', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });
    });

    it('reports isSupported as true', () => {
      const { result } = renderHook(() => useCopyToClipboard());
      expect(result.current.isSupported).toBe(true);
    });

    it('copies text and sets copySuccess', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copyToClipboard('hello');
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
      expect(result.current.copySuccess).toBe(true);
    });

    it('auto-resets copySuccess after the delay', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useCopyToClipboard({ autoResetDelay: 1000 }),
      );

      await act(async () => {
        await result.current.copyToClipboard('hello');
      });
      expect(result.current.copySuccess).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.copySuccess).toBe(false);
      vi.useRealTimers();
    });

    it('sets copyError and calls onError when writeText rejects', async () => {
      (navigator.clipboard.writeText as Mock).mockRejectedValue(
        new Error('denied'),
      );
      const onError = vi.fn();
      const { result } = renderHook(() => useCopyToClipboard({ onError }));

      await act(async () => {
        await result.current.copyToClipboard('hello');
      });

      expect(result.current.copyError).toBe('denied');
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'denied' }),
        'denied',
      );
    });

    it('sets an error and skips the clipboard API when text is empty', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copyToClipboard('');
      });

      expect(result.current.copyError).toBe('No text provided to copy');
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('resetState clears success and error state', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copyToClipboard('hello');
      });
      expect(result.current.copySuccess).toBe(true);

      act(() => {
        result.current.resetState();
      });

      expect(result.current.copySuccess).toBe(false);
      expect(result.current.copyError).toBeNull();
    });
  });

  describe('without Clipboard API support', () => {
    beforeEach(() => {
      delete (navigator as unknown as { clipboard?: unknown }).clipboard;
    });

    it('reports isSupported as false', () => {
      const { result } = renderHook(() => useCopyToClipboard());
      expect(result.current.isSupported).toBe(false);
    });

    it('falls back to execCommand and reports success', async () => {
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copyToClipboard('hello');
      });

      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(result.current.copySuccess).toBe(true);
    });

    it('sets an error when execCommand reports failure', async () => {
      document.execCommand = vi.fn().mockReturnValue(false);
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copyToClipboard('hello');
      });

      expect(result.current.copyError).toBe('Copy command failed');
    });
  });
});
