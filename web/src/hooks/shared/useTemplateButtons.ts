import { useState, useEffect } from 'react';

import { TemplateButton } from '../../types/components';

interface UseTemplateButtonsProps {
  configFileName: string;
}

/**
 * Loads a `TemplateButton[]` config from `/config/{configFileName}`, fetched
 * at runtime from the static assets under `web/public/config/`. Fetching
 * (rather than a build-time import) lets the file be swapped via a Docker
 * volume (see docker-compose.yml's `TEMPLATE_CONFIG_HOST_DIR`) without
 * rebuilding the image.
 *
 * The config file is optional (gitignored, developer-provided) — if it's
 * missing or fails to load, `templateButtonsConfig` silently resolves to `[]`
 * and no template buttons are shown.
 */
export const useTemplateButtons = (props: UseTemplateButtonsProps) => {
  const { configFileName } = props;
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
        setTemplateButtonsConfig([]);
      }
    };

    loadTemplateButtonsConfig();

    return () => {
      cancelled = true;
    };
  }, [configFileName]);

  return {
    templateButtonsConfig,
  };
};
