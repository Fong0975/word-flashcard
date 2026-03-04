import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Word } from '../../types/api';
import { EntityCard } from '../shared/components/EntityCard';
import { getFamiliarityColor } from '../shared/constants/familiarity';

interface WordCardProps {
  index: number;
  word: Word;
  className?: string;
  onWordUpdated?: () => void;
}

export const WordCard: React.FC<WordCardProps> = ({
  index,
  word,
  className = '',
  onWordUpdated,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/word/${encodeURIComponent(word.word)}`);
  };

  return (
    <EntityCard
      index={index}
      entity={word}
      config={{
        showSequence: true,
        sequenceStyle: 'simple',
        showLeftIndicator: true,
        leftIndicatorType: 'color-band',
      }}
      actions={{
        onClick: handleCardClick,
        onEntityUpdated: onWordUpdated,
      }}
      renderContent={word => (
        <div>
          {/* Word */}
          <h3 className='mb-1 truncate text-lg font-semibold text-gray-900 dark:text-white'>
            {word.word}
          </h3>

          {/* Definition count hint */}
          {word.definitions && word.definitions.length > 0 && (
            <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
              {word.definitions.length} definition
              {word.definitions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      getLeftIndicatorColor={word =>
        getFamiliarityColor(word.familiarity || '')
      }
      className={className}
    />
  );
};
