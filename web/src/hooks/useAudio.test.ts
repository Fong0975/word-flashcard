import { renderHook, act } from '@testing-library/react';

import { useAudio } from './useAudio';

class MockAudioElement {
  static instances: MockAudioElement[] = [];
  currentTime = 0;
  src: string;
  play = jest.fn().mockResolvedValue(undefined);
  pause = jest.fn();
  private listeners: Record<string, Array<() => void>> = {};

  constructor(src: string) {
    this.src = src;
    MockAudioElement.instances.push(this);
  }

  addEventListener(event: string, cb: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(cb);
  }

  removeEventListener(event: string, cb: () => void) {
    this.listeners[event] = (this.listeners[event] || []).filter(l => l !== cb);
  }

  emit(event: string) {
    (this.listeners[event] || []).forEach(cb => cb());
  }
}

describe('useAudio', () => {
  beforeEach(() => {
    MockAudioElement.instances = [];
    (global as unknown as { Audio: typeof Audio }).Audio =
      MockAudioElement as unknown as typeof Audio;
  });

  it('plays a new url and marks isPlaying true', async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });

    expect(result.current.isPlaying).toBe(true);
    expect(MockAudioElement.instances[0].play).toHaveBeenCalledTimes(1);
  });

  it('clears isLoading once the audio reports it can play through', async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      MockAudioElement.instances[0].emit('canplaythrough');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('toggles pause when playing the same url again while playing', async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });
    await act(async () => {
      await result.current.play('a.mp3');
    });

    expect(MockAudioElement.instances[0].pause).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('resumes when playing the same url again while paused', async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });
    await act(async () => {
      await result.current.play('a.mp3'); // pause
    });
    await act(async () => {
      await result.current.play('a.mp3'); // resume
    });

    expect(MockAudioElement.instances[0].play).toHaveBeenCalledTimes(2);
    expect(result.current.isPlaying).toBe(true);
  });

  it('cleans up the previous audio when switching to a different url', async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });
    await act(async () => {
      await result.current.play('b.mp3');
    });

    expect(MockAudioElement.instances[0].pause).toHaveBeenCalledTimes(1);
    expect(MockAudioElement.instances).toHaveLength(2);
    expect(result.current.isPlaying).toBe(true);
  });

  it('resets isPlaying and currentTime when the audio ends', async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });
    const instance = MockAudioElement.instances[0];
    instance.currentTime = 42;

    act(() => {
      instance.emit('ended');
    });

    expect(result.current.isPlaying).toBe(false);
    expect(instance.currentTime).toBe(0);
  });

  it('sets an error message when the audio element reports an error', async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });

    act(() => {
      MockAudioElement.instances[0].emit('error');
    });

    expect(result.current.error).toBe('Failed to load or play audio');
    expect(result.current.isPlaying).toBe(false);
  });

  it('sets an error message when play() rejects', async () => {
    class RejectingAudio extends MockAudioElement {
      play = jest.fn().mockRejectedValue(new Error('blocked by browser'));
    }
    (global as unknown as { Audio: typeof Audio }).Audio =
      RejectingAudio as unknown as typeof Audio;

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('a.mp3');
    });

    expect(result.current.error).toBe('blocked by browser');
    expect(result.current.isPlaying).toBe(false);
  });

  it('pauses playback', async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => {
      await result.current.play('a.mp3');
    });

    act(() => {
      result.current.pause();
    });

    expect(MockAudioElement.instances[0].pause).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('pause is a no-op when nothing is playing', () => {
    const { result } = renderHook(() => useAudio());
    expect(() => act(() => result.current.pause())).not.toThrow();
  });

  it('stop cleans up and resets all state', async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => {
      await result.current.play('a.mp3');
    });

    act(() => {
      result.current.stop();
    });

    expect(MockAudioElement.instances[0].pause).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
