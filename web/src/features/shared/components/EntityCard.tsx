import React, { ReactNode } from 'react';
import { BaseEntity } from '../../../hooks/useEntityList';

export interface EntityCardConfig {
  // Index display configuration
  showSequence: boolean;
  sequenceStyle: 'simple' | 'detailed'; // simple: just number, detailed: "No." + number

  // Left indicator configuration
  showLeftIndicator: boolean;
  leftIndicatorType?: 'color-band' | 'custom'; // color-band for familiarity, custom for render prop
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
    if (!config.showSequence) return null;

    if (config.sequenceStyle === 'detailed') {
      // Question card style - with "No." label
      return (
        <div className="flex-shrink-0 w-12 pt-1 mr-2 border-r border-gray-100 dark:border-gray-700/50">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-tighter opacity-70">
              No.
            </span>
            <span className="text-base font-mono font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tabular-nums">
              {index}
            </span>
          </div>
        </div>
      );
    }

    // Simple style - just number
    return (
      <div className="flex-shrink-0 w-10 mr-3 flex justify-center items-center">
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors tabular-nums">
          {index}
        </span>
      </div>
    );
  };

  const renderLeftIndicatorSection = () => {
    if (!config.showLeftIndicator) return null;

    if (config.leftIndicatorType === 'color-band' && getLeftIndicatorColor) {
      return (
        <div
          className={`
            w-1 h-12 rounded-full mr-4 flex-shrink-0
            ${getLeftIndicatorColor(entity)}
          `}
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
        className={`
          group cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
          hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600
          transition-all duration-200 ease-in-out
          flex items-center p-4
          ${config.sequenceStyle === 'detailed' ? 'items-start' : 'items-center'}
          ${className}
        `}
        onClick={handleCardClick}
      >
        {/* Left color indicator */}
        {renderLeftIndicatorSection()}

        {/* Sequence Number Section */}
        {renderSequenceSection()}

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {renderContent(entity)}
        </div>

        {/* Right chevron icon */}
        <div className="flex-shrink-0 ml-4">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Entity-specific modals */}
      {additionalModals}
    </>
  );
};