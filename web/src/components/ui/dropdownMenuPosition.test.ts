import { computeDetachedPanelPosition } from './dropdownMenuPosition';

describe('computeDetachedPanelPosition', () => {
  const container = { left: 100, top: 200, width: 300, height: 40 };

  it.each([
    {
      name: 'right-aligns the panel to the trigger and opens below it',
      trigger: { right: 250, top: 206, bottom: 234 },
      panelWidth: 96,
      openUpward: false,
      expected: { left: 54, top: 34 },
    },
    {
      name: 'opens above the trigger when asked to',
      trigger: { right: 250, top: 206, bottom: 234 },
      panelWidth: 96,
      openUpward: true,
      expected: { left: 54, bottom: 34 },
    },
    {
      name: 'clamps to the left edge when the trigger is near it',
      trigger: { right: 130, top: 206, bottom: 234 },
      panelWidth: 96,
      openUpward: false,
      expected: { left: 0, top: 34 },
    },
    {
      name: 'clamps to the right edge when the trigger extends past it',
      trigger: { right: 450, top: 206, bottom: 234 },
      panelWidth: 96,
      openUpward: false,
      expected: { left: 204, top: 34 },
    },
    {
      name: 'pins to the left edge when the panel is wider than the container',
      trigger: { right: 250, top: 206, bottom: 234 },
      panelWidth: 400,
      openUpward: false,
      expected: { left: 0, top: 34 },
    },
  ])('$name', ({ trigger, panelWidth, openUpward, expected }) => {
    expect(
      computeDetachedPanelPosition({
        trigger,
        panelWidth,
        container,
        openUpward,
      }),
    ).toEqual(expected);
  });
});
