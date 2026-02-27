import React from 'react';

import { DefinitionForm, NoteButton } from '../types';

interface FormFieldsProps {
  formData: DefinitionForm;
  isFormValid: boolean;
  partOfSpeechOptions: string[];
  noteButtonsConfig: NoteButton[];
  handlers: {
    handlePartOfSpeechChange: (pos: string, checked: boolean) => void;
    handleDefinitionChange: (definition: string) => void;
    handleNotesChange: (notes: string) => void;
    appendToNotes: (textToAppend: string) => void;
    handleExamplesChange: (index: number, value: string) => void;
    addExampleInput: () => void;
    removeExampleInput: (index: number) => void;
    handlePhoneticsChange: (type: 'uk' | 'us', value: string) => void;
  };
}

export const FormFields: React.FC<FormFieldsProps> = ({
  formData,
  isFormValid,
  partOfSpeechOptions,
  noteButtonsConfig,
  handlers,
}) => {
  return (
    <div className='space-y-6'>
      {/* Part of Speech - Required */}
      <div>
        <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
          Part of Speech <span className='text-red-500'>*</span>
        </label>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          {partOfSpeechOptions.map(pos => (
            <label
              key={pos}
              className='flex cursor-pointer items-center space-x-2'
            >
              <input
                type='checkbox'
                checked={formData.part_of_speech.includes(pos)}
                onChange={e =>
                  handlers.handlePartOfSpeechChange(pos, e.target.checked)
                }
                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-400'
              />
              <span className='text-sm capitalize text-gray-700 dark:text-gray-300'>
                {pos}
              </span>
            </label>
          ))}
        </div>
        {formData.part_of_speech.length === 0 && (
          <p className='mt-2 text-sm text-red-500'>
            Please select at least one part of speech
          </p>
        )}
      </div>

      {/* Definition - Required */}
      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
          Definition <span className='text-red-500'>*</span>
        </label>
        <textarea
          value={formData.definition}
          onChange={e => handlers.handleDefinitionChange(e.target.value)}
          rows={4}
          className='w-full resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          placeholder='Enter the definition...'
          required
        />
        {!formData.definition.trim() && (
          <p className='mt-1 text-sm text-red-500'>Definition is required</p>
        )}
      </div>

      {/* Examples - Optional */}
      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
          Examples (Optional)
        </label>
        <div className='space-y-3'>
          {formData.examples.map((example, index) => (
            <div key={index} className='flex items-start space-x-2'>
              <div className='flex-1'>
                <textarea
                  value={example}
                  onChange={e =>
                    handlers.handleExamplesChange(index, e.target.value)
                  }
                  rows={2}
                  className='w-full resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  placeholder={`Example ${index + 1}...`}
                />
              </div>
              {formData.examples.length > 1 && (
                <button
                  type='button'
                  onClick={() => handlers.removeExampleInput(index)}
                  className='mt-1 p-2 text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='2'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type='button'
          onClick={handlers.addExampleInput}
          className='mt-3 inline-flex items-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
        >
          <svg
            className='mr-2 h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 4.5v15m7.5-7.5h-15'
            />
          </svg>
          Add Another Example
        </button>
      </div>

      {/* Notes - Optional */}
      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
          Notes (Optional)
        </label>

        {/* Quick note templates buttons - only show if config is available */}
        {noteButtonsConfig.length > 0 && (
          <div className='mb-3'>
            <div className='flex flex-wrap gap-2'>
              {noteButtonsConfig.map((button, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => handlers.appendToNotes(button.value)}
                  className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                >
                  {button.label}
                </button>
              ))}
            </div>
            <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
              Click buttons above to quickly add note templates
            </p>
          </div>
        )}

        <textarea
          value={formData.notes}
          onChange={e => handlers.handleNotesChange(e.target.value)}
          rows={4}
          className='w-full resize-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          placeholder='Additional notes in Markdown format&#10;&#10;Example:&#10;# Heading&#10;**Bold text**&#10;- List item&#10;&#10;Use actual line breaks for new lines.'
        />
        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
          Supports Markdown formatting. Use actual line breaks for new lines.
        </p>
      </div>

      {/* Phonetics - Optional */}
      <div>
        <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
          Pronunciation URLs (Optional)
        </label>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
              UK Pronunciation
            </label>
            <input
              type='url'
              value={formData.phonetics.uk || ''}
              onChange={e =>
                handlers.handlePhoneticsChange('uk', e.target.value)
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              placeholder='https://example.com/audio-uk.mp3'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
              US Pronunciation
            </label>
            <input
              type='url'
              value={formData.phonetics.us || ''}
              onChange={e =>
                handlers.handlePhoneticsChange('us', e.target.value)
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              placeholder='https://example.com/audio-us.mp3'
            />
          </div>
        </div>
      </div>
    </div>
  );
};
