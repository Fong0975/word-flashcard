import React, { ReactNode } from 'react';

import { BaseEntity } from '../../../types/base';

export interface EntityCardConfig {
  // Index display configuration
  showSequence: boolean;
  sequenceStyle: 'simple' | 'detailed'; // simple: just number, detailed: "No." + number

  // Left indicator configuration
  showLeftIndicator: boolean;
  leftIndicatorType?: 'color-band' | 'custom'; // color-band for familiarity, custom for render prop

  // Right arrow configuration
  showRightArrow?: boolean; // default true for backward compatibility
}

export interface EntityCardActions {
  onClick?: () => void;
  onEntityUpdated?: () => void;
}

interface EntityCardProps<T extends BaseEntity> {
  index: number;
  entity: T;
  config: EntityCardConfig;
  actions: EntityCardActions;
  renderContent: (entity: T) => ReactNode;
  renderLeftIndicator?: (entity: T) => ReactNode; // For custom left indicator
  getLeftIndicatorColor?: (entity: T) => string; // For color band indicator
  className?: string;
  additionalModals?: ReactNode; // For entity-specific modals
}

/**
 * Generic EntityCard component
 *
 * Provides a standardized card layout for different entity types.
 * Supports configurable sequence display, left indicators, and custom content rendering.
 *
 * @example
 * ```tsx
 * // For Word Card with familiarity color band
 * <EntityCard
 *   index={1}
 *   entity={word}
 *   config={{
 *     showSequence: true,
 *     sequenceStyle: 'simple',
 *     showLeftIndicator: true,
 *     leftIndicatorType: 'color-band'
 *   }}
 *   actions={{
 *     onClick: handleCardClick,
 *     onEntityUpdated: handleWordUpdated
 *   }}
 *   renderContent={(word) => (
 *     <div>
 *       <h3>{word.word}</h3>
 *       <p>{word.definitions?.length} definitions</p>
 *     </div>
 *   )}
 *   getLeftIndicatorColor={(word) => getFamiliarityColor(word.familiarity)}
 *   additionalModals={<>Word specific modals here</>}
 * />
 *
 * // For Question Card with detailed sequence
 * <EntityCard
 *   index={1}
 *   entity={question}
 *   config={{
 *     showSequence: true,
 *     sequenceStyle: 'detailed',
 *     showLeftIndicator: false
 *   }}
 *   actions={{
 *     onClick: handleQuestionClick,
 *     onEntityUpdated: handleQuestionUpdated
 *   }}
 *   renderContent={(question) => (
 *     <div>
 *       <h3>{question.question}</h3>
 *       <div>Options and statistics here</div>
 *     </div>
 *   )}
 * />
 * ```
 */
export const EntityCard = <T extends BaseEntity>({
  index,
  entity,
  config,
  actions,
  renderContent,
  renderLeftIndicator,
  getLeftIndicatorColor,
  className = '',
  additionalModals,
}: EntityCardProps<T>) => {
  const handleCardClick = () => {
    if (actions.onClick) {
      actions.onClick();
    }
  };

  const renderSequenceSection = () => {
    if (!config.showSequence) {
      return null;
    }

    if (config.sequenceStyle === 'detailed') {
      // Question card style - with "No." label
      return (
        <div className='mr-2 w-12 flex-shrink-0 border-r border-gray-100 pt-1 dark:border-gray-700/50'>
          <div className='flex flex-col items-center justify-center'>
            <span className='text-xs font-bold uppercase tracking-tighter text-primary-500 opacity-70 dark:text-primary-400'>
              No.
            </span>
            <span className='font-mono text-base font-bold tabular-nums text-gray-800 transition-colors group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-400'>
              {index}
            </span>
          </div>
        </div>
      );
    }

    // Simple style - just number
    return (
      <div className='mr-3 flex w-10 flex-shrink-0 items-center justify-center'>
        <span className='text-sm font-medium tabular-nums text-gray-400 transition-colors group-hover:text-primary-500 dark:text-gray-500'>
          {index}
        </span>
      </div>
    );
  };

  const renderLeftIndicatorSection = () => {
    if (!config.showLeftIndicator) {
      return null;
    }

    if (config.leftIndicatorType === 'color-band' && getLeftIndicatorColor) {
      return (
        <div
          className={`mr-4 h-12 w-1 flex-shrink-0 rounded-full ${getLeftIndicatorColor(entity)} `}
        />
      );
    }

    if (config.leftIndicatorType === 'custom' && renderLeftIndicator) {
      return renderLeftIndicator(entity);
    }

    return null;
  };

  return (
    <>
      <div
        className={`group flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600 ${config.sequenceStyle === 'detailed' ? 'items-start' : 'items-center'} ${className} `}
        onClick={handleCardClick}
      >
        {/* Left color indicator */}
        {renderLeftIndicatorSection()}

        {/* Sequence Number Section */}
        {renderSequenceSection()}

        {/* Content area */}
        <div className='min-w-0 flex-1'>{renderContent(entity)}</div>

        {/* Right chevron icon */}
        {config.showRightArrow !== false && (
          <div className='ml-4 flex-shrink-0'>
            <svg
              className='h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 5l7 7-7 7'
              />
            </svg>
          </div>
        )}
      </div>

      {/* Entity-specific modals */}
      {additionalModals}
    </>
  );
};
