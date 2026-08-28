import { useState, useEffect } from 'react';

import { TemplateButton } from '../../types/components';

interface UseTemplateButtonsProps {
  configFileName: string;
  onWarning?: (message: string) => void;
}

/**
 * Loads a `TemplateButton[]` config from `/config/{configFileName}`, fetched
 * at runtime from the static assets under `web/public/config/`. Fetching
 * (rather than a build-time import) lets the file be swapped via a Docker
 * volume (see docker-compose.yml's `TEMPLATE_CONFIG_HOST_DIR`) without
 * rebuilding the image.
 *
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
    let cancelled = false;

    const loadTemplateButtonsConfig = async () => {
      try {
        const response = await fetch(`/config/${configFileName}`);
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }
        const config: TemplateButton[] = await response.json();
        if (!cancelled) {
          setTemplateButtonsConfig(config);
        }
      } catch {
        if (cancelled) {
          return;
        }
        if (onWarning) {
          onWarning(
            `Template buttons config file (${configFileName}) not found, template buttons will be hidden`,
          );
        }
        setTemplateButtonsConfig([]);
      }
    };

    loadTemplateButtonsConfig();

    return () => {
      cancelled = true;
    };
  }, [configFileName, onWarning]);

  return {
    templateButtonsConfig,
  };
};
