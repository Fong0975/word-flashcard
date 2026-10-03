import { ReactNode } from 'react';

import { Pagination } from '../../../components/ui/Pagination';
import { BaseEntity } from '../../../types';

import { TotalCountLabel } from './TotalCountLabel';

interface EntityListSectionProps<T extends BaseEntity> {
  entities: readonly T[];
  renderCard: (entity: T, index: number) => ReactNode;
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
  onTotalCountClick?: () => void;
  entityNamePlural: string;
  loading: boolean;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFirst: () => void;
  onLast: () => void;
}

export const EntityListSection = <T extends BaseEntity>({
  entities,
  renderCard,
  currentPage,
  itemsPerPage,
  totalCount,
  onTotalCountClick,
  entityNamePlural,
  loading,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
  onNext,
  onPrevious,
  onFirst,
  onLast,
}: EntityListSectionProps<T>) => (
  <div>
    <TotalCountLabel
      totalCount={totalCount}
      entityLabel={entityNamePlural.toLowerCase()}
      onClick={onTotalCountClick}
    />
    <div className='space-y-3'>
      {entities.map((entity, index) => (
        <div key={entity.id}>
          {renderCard(entity, (currentPage - 1) * itemsPerPage + index + 1)}
        </div>
      ))}
    </div>

    {loading && (
      <div className='flex items-center justify-center rounded-lg bg-white/80 py-4 dark:bg-gray-900/80'>
        <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500'></div>
        <span className='ml-2 text-sm text-gray-600 dark:text-gray-400'>
          Loading...
        </span>
      </div>
    )}

    {/* Pagination */}
    {totalPages > 1 && (
      <div className='mt-8 flex justify-center'>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={onPageChange}
          onNext={onNext}
          onPrevious={onPrevious}
          onFirst={onFirst}
          onLast={onLast}
        />
      </div>
    )}
  </div>
);
