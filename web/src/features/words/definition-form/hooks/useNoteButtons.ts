import { useState, useEffect } from 'react';
import { NoteButton } from '../types';

export const useNoteButtons = () => {
  const [noteButtonsConfig, setNoteButtonsConfig] = useState<NoteButton[]>([]);

  // Load note buttons configuration on component mount
  useEffect(() => {
    const loadNoteButtonsConfig = async () => {
      try {
        // Try to dynamically import the config file
        const configModule = await import('../../../../config/definitionFormModalNoteButtonsConfig.json');
        setNoteButtonsConfig((configModule as any).default || []);
      } catch (error) {
        // Config file doesn't exist or failed to load, use empty array
        console.warn('Note buttons config file not found, template buttons will be hidden');
        setNoteButtonsConfig([]);
      }
    };

    loadNoteButtonsConfig();
  }, []);

  return {
    noteButtonsConfig
  };
};