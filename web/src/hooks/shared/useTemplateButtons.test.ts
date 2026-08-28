import { renderHook, waitFor } from '@testing-library/react';

import { useTemplateButtons } from './useTemplateButtons';

describe('useTemplateButtons', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves to the fetched config on success', async () => {
    const config = [{ label: 'Divider', value: '---' }];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(config), { status: 200 }),
    );

    const { result } = renderHook(() =>
      useTemplateButtons({ configFileName: 'notesButtonsConfig.json' }),
    );

    await waitFor(() =>
      expect(result.current.templateButtonsConfig).toEqual(config),
    );
    expect(fetch).toHaveBeenCalledWith('/config/notesButtonsConfig.json');
  });

  it('resolves to an empty config and warns when the config file does not exist (404)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 }),
    );
    const onWarning = vi.fn();

    const { result } = renderHook(() =>
      useTemplateButtons({
        configFileName: 'doesNotExist.json',
        onWarning,
      }),
    );

    await waitFor(() =>
      expect(onWarning).toHaveBeenCalledWith(
        'Template buttons config file (doesNotExist.json) not found, template buttons will be hidden',
      ),
    );
    expect(result.current.templateButtonsConfig).toEqual([]);
  });

  it('resolves to an empty config and warns when the fetch itself fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'));
    const onWarning = vi.fn();

    const { result } = renderHook(() =>
      useTemplateButtons({
        configFileName: 'doesNotExist.json',
        onWarning,
      }),
    );

    await waitFor(() =>
      expect(onWarning).toHaveBeenCalledWith(
        'Template buttons config file (doesNotExist.json) not found, template buttons will be hidden',
      ),
    );
    expect(result.current.templateButtonsConfig).toEqual([]);
  });

  it('does not throw when no onWarning callback is provided and the config file is missing', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    const { result } = renderHook(() =>
      useTemplateButtons({ configFileName: 'doesNotExist.json' }),
    );

    await waitFor(() =>
      expect(result.current.templateButtonsConfig).toEqual([]),
    );
  });
});
