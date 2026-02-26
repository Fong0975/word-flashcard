import React from 'react';
import { DefinitionCardProps } from '../types/word-detail';
import { PartOfSpeechTags } from './PartOfSpeechTags';
import { PronunciationGroup } from './PronunciationGroup';
import { DefinitionContent } from './DefinitionContent';
import { DefinitionActions } from './DefinitionActions';

export const DefinitionCard: React.FC<DefinitionCardProps> = ({
  definition,
  index,
  onEdit,
  onDelete
}) => {
  return (
    <div className="space-y-3 pt-4 pb-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <PartOfSpeechTags partOfSpeech={definition.part_of_speech} />
        <PronunciationGroup phonetics={definition.phonetics} />
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