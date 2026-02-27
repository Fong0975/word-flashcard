import { useState, useRef, useCallback } from 'react';

export interface UseAudioReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  play: (url: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
}

export const useAudio = (): UseAudioReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError('Failed to load or play audio');
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleEnded);
      audioRef.current.removeEventListener('error', handleError);
      audioRef.current.removeEventListener('loadstart', handleLoadStart);
      audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
      audioRef.current = null;
    }
    currentUrlRef.current = null;
  }, [handleEnded, handleError, handleLoadStart, handleCanPlay]);

  const play = useCallback(
    async (url: string) => {
      try {
        setError(null);

        // If we're already playing the same URL, just pause/resume
        if (currentUrlRef.current === url && audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
          } else {
            audioRef.current.play();
            setIsPlaying(true);
            return;
          }
        }

        // Stop current audio if playing
        if (audioRef.current) {
          cleanup();
        }

        // Create new audio instance
        const audio = new Audio(url);
        audioRef.current = audio;
        currentUrlRef.current = url;

        // Add event listeners
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplaythrough', handleCanPlay);

        // Set loading state
        setIsLoading(true);

        // Start playing
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to play audio');
        setIsPlaying(false);
        setIsLoading(false);
      }
    },
    [
      isPlaying,
      cleanup,
      handleEnded,
      handleError,
      handleLoadStart,
      handleCanPlay,
    ],
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, [cleanup]);

  return {
    isPlaying,
    isLoading,
    error,
    play,
    pause,
    stop,
  };
};
