import { useState, useEffect } from 'react';

import { NoteButton } from '../types';

// Type for dynamically imported JSON config module
interface ConfigModule {
  default?: NoteButton[];
}

interface UseNoteButtonsProps {
  onWarning?: (message: string) => void;
}

export const useNoteButtons = (props: UseNoteButtonsProps = {}) => {
  const { onWarning } = props;
  const [noteButtonsConfig, setNoteButtonsConfig] = useState<NoteButton[]>([]);

  // Load note buttons configuration on component mount
  useEffect(() => {
    const loadNoteButtonsConfig = async () => {
      try {
        // Try to dynamically import the config file
        const configModule =
          await import('../../../../config/definitionFormModalNoteButtonsConfig.json');
        setNoteButtonsConfig((configModule as ConfigModule).default || []);
      } catch (error) {
        // Config file doesn't exist or failed to load, use empty array
        if (onWarning) {
          onWarning(
            'Note buttons config file not found, template buttons will be hidden',
          );
        }
        setNoteButtonsConfig([]);
      }
    };

    loadNoteButtonsConfig();
  }, [onWarning]);

  return {
    noteButtonsConfig,
  };
};
