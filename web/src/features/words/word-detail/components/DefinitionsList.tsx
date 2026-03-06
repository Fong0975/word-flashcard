import React from 'react';

import {
  extractPronunciationUrls,
  isValidAudioUrl,
} from '../../../shared/phonetics';
import { DefinitionsListProps } from '../types/word-detail';

import { DefinitionCard } from './DefinitionCard';
import { AddDefinitionButton } from './AddDefinitionButton';
import { EmptyState } from './EmptyState';

export const DefinitionsList: React.FC<DefinitionsListProps> = ({
  definitions,
  wordText,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const anyHasUk = definitions.some(def => {
    const urls = extractPronunciationUrls(def.phonetics);
    return !!urls.uk && isValidAudioUrl(urls.uk);
  });
  const anyHasUs = definitions.some(def => {
    const urls = extractPronunciationUrls(def.phonetics);
    return !!urls.us && isValidAudioUrl(urls.us);
  });
  const firstCardSpeechFallback =
    !anyHasUk || !anyHasUs
      ? { wordText, uk: !anyHasUk, us: !anyHasUs }
      : undefined;

  return (
    <div className='space-y-4'>
      {definitions && definitions.length > 0 ? (
        <>
          <div>
            <h2 className='mb-0 text-xl font-semibold text-gray-900 dark:text-white'>
              Definitions ({definitions.length})
            </h2>
            <AddDefinitionButton onClick={onAddNew} />
          </div>

          {definitions.map((definition, index) => (
            <DefinitionCard
              key={definition.id}
              definition={definition}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              speechFallback={index === 0 ? firstCardSpeechFallback : undefined}
            />
          ))}
        </>
      ) : (
        <>
          <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
            Definitions (0)
          </h2>
          <AddDefinitionButton onClick={onAddNew} />
          <EmptyState />
        </>
      )}
    </div>
  );
};
