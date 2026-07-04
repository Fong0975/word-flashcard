import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Note } from '../../../types/api';
import { apiService } from '../../../lib/api';
import { DetailPageLayout } from '../../../components/layout';
import { MarkdownContent } from '../../../components/ui';
import { MarkdownEditor } from '../components/MarkdownEditor';

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) {
    return '-';
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNote = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);
      const fetched = await apiService.getNote(Number(id));
      setNote(fetched);
    } catch {
      setFetchError('Failed to load note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const handleEdit = () => {
    if (!note) {
      return;
    }
    setEditTitle(note.title);
    setEditContent(note.content ?? '');
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!note || !editTitle.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      const updated = await apiService.updateNote(note.id, {
        title: editTitle.trim(),
        content: editContent,
      });
      setNote(updated);
      setIsEditing(false);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiService.deleteNote(note.id);
      navigate('/?tab=notes');
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <DetailPageLayout
        onBack={() => navigate('/?tab=notes')}
        body={
          <div className='flex flex-1 items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500'></div>
          </div>
        }
      />
    );
  }

  if (fetchError || !note) {
    return (
      <DetailPageLayout
        onBack={() => navigate('/?tab=notes')}
        body={
          <div className='flex flex-1 flex-col items-center justify-center'>
            <p className='mb-4 text-gray-500 dark:text-gray-400'>
              {fetchError || 'Note not found'}
            </p>
            <button
              type='button'
              onClick={() => navigate('/?tab=notes')}
              className='rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700'
            >
              Back to Notes
            </button>
          </div>
        }
      />
    );
  }

  const viewHeader = (
    <div>
      <div className='flex items-start justify-between gap-4'>
        <h1 className='break-words text-xl font-bold text-gray-900 dark:text-white'>
          {note.title}
        </h1>
        <div className='flex flex-shrink-0 gap-2'>
          <button
            type='button'
            onClick={handleEdit}
            className='rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            Edit
          </button>
          <button
            type='button'
            onClick={() => setShowDeleteConfirm(true)}
            className='rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
          >
            Delete
          </button>
        </div>
      </div>
      <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
        Updated: {formatDate(note.updated_at)}
      </p>
    </div>
  );

  const editHeader = (
    <input
      type='text'
      value={editTitle}
      onChange={e => setEditTitle(e.target.value)}
      placeholder='Note title'
      className='w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-lg font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
    />
  );

  const viewBody = (
    <>
      {showDeleteConfirm && (
        <div className='mb-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
          <p className='mb-3 text-sm text-red-700 dark:text-red-300'>
            Delete "<strong>{note.title}</strong>"? This cannot be undone.
          </p>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={handleDelete}
              disabled={isDeleting}
              className='rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type='button'
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className='rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {note.content ? (
        <MarkdownContent content={note.content} />
      ) : (
        <p className='text-sm text-gray-400 dark:text-gray-500'>
          No content yet. Click Edit to add content.
        </p>
      )}
    </>
  );

  const editBody = (
    <div className='flex min-h-0 flex-1 flex-col gap-3'>
      <MarkdownEditor
        value={editContent}
        onChange={setEditContent}
        placeholder='Write your note in Markdown...'
        rows={20}
      />
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={handleSave}
          disabled={isSaving || !editTitle.trim()}
          className='rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type='button'
          onClick={handleCancel}
          disabled={isSaving}
          className='rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          Cancel
        </button>
        {saveError && (
          <p className='text-xs text-red-500 dark:text-red-400'>{saveError}</p>
        )}
      </div>
    </div>
  );

  return (
    <DetailPageLayout
      onBack={() => navigate('/?tab=notes')}
      header={isEditing ? editHeader : viewHeader}
      body={isEditing ? editBody : viewBody}
    />
  );
};
