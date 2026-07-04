import { useState, useEffect } from 'react';

import { TemplateButton } from '../../types/components';

// Type for dynamically imported JSON config module
interface ConfigModule {
  default?: TemplateButton[];
}

interface UseTemplateButtonsProps {
  configFileName: string;
  onWarning?: (message: string) => void;
}

/**
 * Loads a `TemplateButton[]` config from `web/src/config/{configFileName}`.
 * The config file is optional (gitignored, developer-provided) — if it's
 * missing or fails to load, `templateButtonsConfig` resolves to `[]` and
 * `onWarning` (if provided) is called so the caller can surface a toast.
 */
export const useTemplateButtons = (props: UseTemplateButtonsProps) => {
  const { configFileName, onWarning } = props;
  const [templateButtonsConfig, setTemplateButtonsConfig] = useState<
    TemplateButton[]
  >([]);

  useEffect(() => {
    const loadTemplateButtonsConfig = async () => {
      try {
        const configModule = await import(`../../config/${configFileName}`);
        setTemplateButtonsConfig((configModule as ConfigModule).default || []);
      } catch (error) {
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
