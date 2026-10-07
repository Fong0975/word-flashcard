import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/apiErrorMessage';
import { DetailPageLayout } from '../../../components/layout';
import { MarkdownEditorField } from '../../../components/ui/markdown-editor/MarkdownEditorField';
import { UnsavedChangesDialog } from '../../../components/ui/UnsavedChangesDialog';
import { useTemplateButtons } from '../../../hooks/shared';
import { useUnsavedChangesGuard } from '../../../hooks/ui/useUnsavedChangesGuard';
import { appendTemplateText } from '../../../utils/textTemplates';

export const NoteCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { templateButtonsConfig } = useTemplateButtons({
    configFileName: 'noteContentButtonsConfig.json',
  });

  const appendToContent = (textToAppend: string) => {
    setContent(prev => appendTemplateText(prev, textToAppend));
  };

  const unsavedChangesGuard = useUnsavedChangesGuard({
    isEditing: true,
    isDirty: title.trim() !== '' || content.trim() !== '',
    // Replaces the unsaved-changes guard entry, so it is not left in history.
    onLeave: () => navigate('/?tab=notes', { replace: true }),
  });

  const handleSave = async () => {
    /* istanbul ignore next -- unreachable: Save button is disabled when title is empty */
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
      // Replaces the unsaved-changes guard entry, so it is not left in history.
      navigate(`/note/${created.id}`, { replace: true });
    } catch (error) {
      setSaveError(getApiErrorMessage(error, 'Failed to create note.'));
      setIsSaving(false);
    }
  };

  const header = (
    <input
      type='text'
      value={title}
      onChange={e => setTitle(e.target.value)}
      placeholder='Note title'
      className='glass-input w-full px-3 py-1.5 text-lg font-semibold'
      autoFocus
    />
  );

  const body = (
    <div className='flex min-h-0 flex-1 flex-col gap-3'>
      <MarkdownEditorField
        value={content}
        onChange={setContent}
        placeholder='Write your note...'
        heightMode='flex'
        fontMono
        rows={20}
        templateButtons={templateButtonsConfig}
        onAppendTemplate={appendToContent}
      />
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className='glass-button-primary rounded-md px-4 py-1.5 text-sm font-medium'
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        {saveError && <p className='text-error text-xs'>{saveError}</p>}
      </div>
    </div>
  );

  return (
    <>
      <DetailPageLayout
        onBack={unsavedChangesGuard.requestLeave}
        header={header}
        body={body}
      />
      <UnsavedChangesDialog
        isOpen={unsavedChangesGuard.showConfirm}
        onConfirm={unsavedChangesGuard.confirmLeave}
        onCancel={unsavedChangesGuard.cancelLeave}
      />
    </>
  );
};
