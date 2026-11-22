import { computeTooltipPosition } from './tooltipPosition';

describe('computeTooltipPosition', () => {
  const viewport = { width: 400, height: 800 };
  const tooltip = { width: 100, height: 30 };

  it.each([
    {
      name: 'centers the tooltip above the trigger',
      trigger: { left: 190, right: 210, top: 300, bottom: 320 },
      expected: { left: 150, top: 262, placement: 'top' },
    },
    {
      name: 'flips below the trigger when there is no room above',
      trigger: { left: 190, right: 210, top: 20, bottom: 40 },
      expected: { left: 150, top: 48, placement: 'bottom' },
    },
    {
      name: 'stays above when it fits exactly against the margin',
      trigger: { left: 190, right: 210, top: 46, bottom: 66 },
      expected: { left: 150, top: 8, placement: 'top' },
    },
    {
      name: 'clamps to the left viewport margin near the left edge',
      trigger: { left: 0, right: 20, top: 300, bottom: 320 },
      expected: { left: 8, top: 262, placement: 'top' },
    },
    {
      name: 'clamps to the right viewport margin near the right edge',
      trigger: { left: 380, right: 400, top: 300, bottom: 320 },
      expected: { left: 292, top: 262, placement: 'top' },
    },
  ])('$name', ({ trigger, expected }) => {
    expect(computeTooltipPosition({ trigger, tooltip, viewport })).toEqual(
      expected,
    );
  });

  it('falls back to the left margin when the tooltip is wider than the viewport', () => {
    expect(
      computeTooltipPosition({
        trigger: { left: 190, right: 210, top: 300, bottom: 320 },
        tooltip: { width: 500, height: 30 },
        viewport,
      }),
    ).toEqual({ left: 8, top: 262, placement: 'top' });
  });

  it('honours custom gap and margin', () => {
    expect(
      computeTooltipPosition({
        trigger: { left: 190, right: 210, top: 300, bottom: 320 },
        tooltip,
        viewport,
        gap: 4,
        margin: 16,
      }),
    ).toEqual({ left: 150, top: 266, placement: 'top' });
  });
});
