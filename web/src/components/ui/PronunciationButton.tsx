import React from 'react';

import { useAudio } from '../../hooks/useAudio';

interface PronunciationButtonProps {
  audioUrl: string;
  accent: 'uk' | 'us';
  className?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const PronunciationButton: React.FC<PronunciationButtonProps> = ({
  audioUrl,
  accent,
  className = '',
  size = 'sm',
  disabled = false,
}) => {
  const { isPlaying, isLoading, error, play } = useAudio();

  const handleClick = async () => {
    if (!disabled && audioUrl) {
      await play(audioUrl);
    }
  };

  const getAccentInfo = () => {
    switch (accent) {
      case 'uk':
        return {
          label: 'UK',
          flag: '🇬🇧',
          title: 'British pronunciation',
        };
      case 'us':
        return {
          label: 'US',
          flag: '🇺🇸',
          title: 'American pronunciation',
        };
    }
  };

  const accentInfo = getAccentInfo();

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !audioUrl || isLoading}
      title={accentInfo.title}
      className={`
        inline-flex items-center space-x-1 rounded-md font-medium transition-colors duration-200
        ${sizeClasses[size]}
        ${
          disabled || !audioUrl
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:bg-blue-200 dark:active:bg-blue-900/70'
        }
        ${error ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
        ${className}
      `}
    >
      {/* Accent flag */}
      <span className="text-xs" role="img" aria-label={`${accent.toUpperCase()} accent`}>
        {accentInfo.flag}
      </span>

      {/* Play/Loading icon */}
      <span className="flex items-center">
        {isLoading ? (
          <svg
            className={`animate-spin ${iconSizeClasses[size]}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ) : isPlaying ? (
          <svg
            className={iconSizeClasses[size]}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : error ? (
          <svg
            className={iconSizeClasses[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        ) : (
          <svg
            className={iconSizeClasses[size]}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </span>

      {/* Accent label */}
      <span>{accentInfo.label}</span>
    </button>
  );
};