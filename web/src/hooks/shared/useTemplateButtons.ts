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

// Statically scanned at build time; only config files that actually exist on
// disk appear as keys here, regardless of git tracking state.
const configModules = import.meta.glob<ConfigModule>('../../config/*.json');

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
      const loader = configModules[`../../config/${configFileName}`];

      if (!loader) {
        if (onWarning) {
          onWarning(
            `Template buttons config file (${configFileName}) not found, template buttons will be hidden`,
          );
        }
        setTemplateButtonsConfig([]);
        return;
      }

      try {
        const configModule = await loader();
        setTemplateButtonsConfig(configModule.default || []);
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
