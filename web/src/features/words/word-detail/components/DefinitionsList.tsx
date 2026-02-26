import React from 'react';

import { DefinitionsListProps } from '../types/word-detail';

import { DefinitionCard } from './DefinitionCard';
import { AddDefinitionButton } from './AddDefinitionButton';
import { EmptyState } from './EmptyState';

export const DefinitionsList: React.FC<DefinitionsListProps> = ({
  definitions,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  return (
    <div className="space-y-4">
      {definitions && definitions.length > 0 ? (
        <>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-0">
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
            />
          ))}
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Definitions (0)
          </h2>
          <AddDefinitionButton onClick={onAddNew} />
          <EmptyState />
        </>
      )}
    </div>
  );
};