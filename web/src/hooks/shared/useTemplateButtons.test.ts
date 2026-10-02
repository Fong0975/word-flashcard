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

  it.each([
    [
      'the config file does not exist (404)',
      () =>
        vi
          .spyOn(global, 'fetch')
          .mockResolvedValue(new Response(null, { status: 404 })),
    ],
    [
      'the fetch itself fails',
      () =>
        vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error')),
    ],
    [
      'the response is not valid JSON',
      () =>
        vi
          .spyOn(global, 'fetch')
          .mockResolvedValue(new Response('<html></html>', { status: 200 })),
    ],
  ])('silently resolves to an empty config when %s', async (_name, mock) => {
    mock();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useTemplateButtons({ configFileName: 'doesNotExist.json' }),
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await waitFor(() =>
      expect(result.current.templateButtonsConfig).toEqual([]),
    );
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
