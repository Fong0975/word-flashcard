import { useState, useEffect } from 'react';

export interface NoteTemplateButton {
  label: string;
  value: string;
}

// Type for dynamically imported JSON config module
interface ConfigModule {
  default?: NoteTemplateButton[];
}

interface UseNoteTemplateButtonsProps {
  onWarning?: (message: string) => void;
}

export const useNoteTemplateButtons = (
  props: UseNoteTemplateButtonsProps = {},
) => {
  const { onWarning } = props;
  const [templateButtonsConfig, setTemplateButtonsConfig] = useState<
    NoteTemplateButton[]
  >([]);

  // Load template buttons configuration on component mount
  useEffect(() => {
    const loadTemplateButtonsConfig = async () => {
      try {
        // Try to dynamically import the config file
        const configModule =
          await import('../../../config/noteContentButtonsConfig.json');
        setTemplateButtonsConfig((configModule as ConfigModule).default || []);
      } catch (error) {
        // Config file doesn't exist or failed to load, use empty array
        if (onWarning) {
          onWarning(
            'Note template buttons config file not found, template buttons will be hidden',
          );
        }
        setTemplateButtonsConfig([]);
      }
    };

    loadTemplateButtonsConfig();
  }, [onWarning]);

  return {
    templateButtonsConfig,
  };
};
