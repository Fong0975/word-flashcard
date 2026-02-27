import { useState, useEffect } from 'react';

import { TemplateButton } from '../types/question-form';

// Type for dynamically imported JSON config module
interface ConfigModule {
  default?: TemplateButton[];
}

interface UseTemplateButtonsProps {
  configFileName: string;
  onWarning?: (message: string) => void;
}

export const useTemplateButtons = (props: UseTemplateButtonsProps) => {
  const { configFileName, onWarning } = props;
  const [templateButtonsConfig, setTemplateButtonsConfig] = useState<
    TemplateButton[]
  >([]);

  // Load template buttons configuration on component mount
  useEffect(() => {
    const loadTemplateButtonsConfig = async () => {
      try {
        // Try to dynamically import the config file
        const configModule = await import(
          `../../../../config/${configFileName}`
        );
        setTemplateButtonsConfig((configModule as ConfigModule).default || []);
      } catch (error) {
        // Config file doesn't exist or failed to load, use empty array
        if (onWarning) {
          onWarning(
            `Template buttons config file (${configFileName}) not found, template buttons will be hidden`,
          );
        }
        setTemplateButtonsConfig([]);
      }
    };

    loadTemplateButtonsConfig();
  }, [configFileName, onWarning]);

  return {
    templateButtonsConfig,
  };
};
