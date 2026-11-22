interface TooltipPositionInput {
  /** Viewport rect of the element the tooltip describes. */
  trigger: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>;
  tooltip: { width: number; height: number };
  viewport: { width: number; height: number };
  /** Distance between the trigger and the tooltip. */
  gap?: number;
  /** Minimum distance kept between the tooltip and the viewport edges. */
  margin?: number;
}

export interface TooltipPosition {
  /** Viewport coordinates for a `position: fixed` tooltip. */
  left: number;
  top: number;
  placement: 'top' | 'bottom';
}

/**
 * Places a tooltip centered above its trigger, flipping below it when there
 * is not enough room above, and clamps the horizontal offset so the tooltip
 * never leaves the viewport (e.g. when the trigger sits near a screen edge on
 * a phone).
 */
export const computeTooltipPosition = ({
  trigger,
  tooltip,
  viewport,
  gap = 8,
  margin = 8,
}: TooltipPositionInput): TooltipPosition => {
  const triggerCenter = (trigger.left + trigger.right) / 2;
  const maxLeft = Math.max(viewport.width - tooltip.width - margin, margin);
  const left = Math.min(
    Math.max(triggerCenter - tooltip.width / 2, margin),
    maxLeft,
  );

  const fitsAbove = trigger.top - gap - tooltip.height >= margin;
  return fitsAbove
    ? { left, top: trigger.top - gap - tooltip.height, placement: 'top' }
    : { left, top: trigger.bottom + gap, placement: 'bottom' };
};
