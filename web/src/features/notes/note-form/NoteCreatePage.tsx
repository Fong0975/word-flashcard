import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../../../lib/api';
import { DetailPageLayout } from '../../../components/layout';
import { ToastContainer } from '../../../components/ui';
import { useToast } from '../../../hooks/ui/useToast';
import { useTemplateButtons } from '../../../hooks/shared';
import { appendTemplateText } from '../../../utils/textTemplates';
import { MarkdownEditor } from '../components/MarkdownEditor';

export const NoteCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { toasts, showWarning, removeToast } = useToast();
  const { templateButtonsConfig } = useTemplateButtons({
    configFileName: 'noteContentButtonsConfig.json',
    onWarning: showWarning,
  });

  const appendToContent = (textToAppend: string) => {
    setContent(prev => appendTemplateText(prev, textToAppend));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      const created = await apiService.createNote({
        title: title.trim(),
        content,
      });
      navigate(`/note/${created.id}`);
    } catch {
      setSaveError('Failed to create note. Please try again.');
      setIsSaving(false);
    }
  };

  const header = (
    <input
      type='text'
      value={title}
      onChange={e => setTitle(e.target.value)}
      placeholder='Note title'
      className='w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-lg font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
      autoFocus
    />
  );

  const body = (
    <div className='flex min-h-0 flex-1 flex-col gap-3'>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder='Write your note in Markdown...'
        rows={20}
        templateButtons={templateButtonsConfig}
        onAppendTemplate={appendToContent}
      />
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className='rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        {saveError && (
          <p className='text-xs text-red-500 dark:text-red-400'>{saveError}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <DetailPageLayout
        onBack={() => navigate('/?tab=notes')}
        header={header}
        body={body}
      />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};
