import { renderHook, waitFor } from '@testing-library/react';

import { useTemplateButtons } from './useTemplateButtons';

describe('useTemplateButtons', () => {
  it('resolves to an empty config and warns when the config file does not exist', async () => {
    const onWarning = jest.fn();
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
    const { result } = renderHook(() =>
      useTemplateButtons({ configFileName: 'doesNotExist.json' }),
    );

    await waitFor(() =>
      expect(result.current.templateButtonsConfig).toEqual([]),
    );
  });
});
