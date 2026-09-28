import React from 'react';

import { DefinitionCardProps } from '../types/word-detail';

import { PartOfSpeechTags } from './PartOfSpeechTags';
import { PronunciationGroup } from './PronunciationGroup';
import { DefinitionContent } from './DefinitionContent';
import { DefinitionActions } from './DefinitionActions';

export const DefinitionCard: React.FC<DefinitionCardProps> = ({
  definition,
  // Part of the public prop contract (callers pass the list index) but not
  // yet used in this component's own rendering.
  index: _index,
  onEdit,
  onDelete,
  speechFallback,
}) => {
  return (
    <div className='glass-panel-card space-y-3 rounded-lg px-4 pb-2 pt-4'>
      <div className='flex items-start justify-between'>
        <PartOfSpeechTags partOfSpeech={definition.part_of_speech} />
        <PronunciationGroup
          phonetics={definition.phonetics}
          speechFallback={speechFallback}
        />
      </div>

      <DefinitionContent definition={definition} />

      <DefinitionActions
        definition={definition}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};
