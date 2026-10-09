interface DetachedPanelPositionInput {
  /** Viewport rect of the trigger. */
  trigger: Pick<DOMRect, 'right' | 'top' | 'bottom'>;
  panelWidth: number;
  /** Viewport padding box of the panel's offset parent (what absolute offsets resolve against). */
  container: { left: number; top: number; width: number; height: number };
  openUpward: boolean;
}

export type DetachedPanelPosition =
  | { left: number; top: number }
  | { left: number; bottom: number };

/**
 * Computes absolute offsets, relative to the panel's offset parent, that place
 * a dropdown panel directly below (or above) its trigger with their right
 * edges aligned. The horizontal offset is clamped so the panel stays inside
 * the container even when the trigger sits near one of its edges.
 */
export const computeDetachedPanelPosition = ({
  trigger,
  panelWidth,
  container,
  openUpward,
}: DetachedPanelPositionInput): DetachedPanelPosition => {
  const maxLeft = Math.max(container.width - panelWidth, 0);
  const rightAlignedLeft = trigger.right - panelWidth - container.left;
  const left = Math.min(Math.max(rightAlignedLeft, 0), maxLeft);

  return openUpward
    ? { left, bottom: container.top + container.height - trigger.top }
    : { left, top: trigger.bottom - container.top };
};
