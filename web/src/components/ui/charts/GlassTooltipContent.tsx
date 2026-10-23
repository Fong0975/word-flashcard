import React from 'react';
import type { TooltipPayloadEntry } from 'recharts';

import { GLASS_TOOLTIP_CLASSNAME } from './chartGlassStyles';

interface GlassTooltipContentProps {
  active?: boolean;
  payload?: readonly TooltipPayloadEntry[];
  label?: string | number;
  /** Formats the tooltip heading, e.g. a date key into a short date. */
  labelFormatter?: (label: string) => string;
}

/**
 * Frosted-dark tooltip body for multi-series charts. recharts' default content
 * paints each item's text in its series color, which is unreadable for dark
 * series (e.g. indigo bars) on the dark glass; here the text stays light and
 * the series color moves to a swatch instead. recharts injects `active`,
 * `payload` and `label` when it clones the element passed to `content`.
 *
 * @returns The tooltip, or `null` while inactive or without any items
 */
export const GlassTooltipContent: React.FC<GlassTooltipContentProps> = ({
  active,
  payload,
  label,
  labelFormatter,
}) => {
  // Series marked `tooltipType='none'` (e.g. line halos) are skipped, matching
  // recharts' default tooltip content.
  const items = payload?.filter(entry => entry.type !== 'none') ?? [];
  if (!active || items.length === 0) {
    return null;
  }
  const heading = label === undefined ? '' : String(label);

  return (
    <div className={GLASS_TOOLTIP_CLASSNAME}>
      {heading && (
        <div className='mb-1 font-medium'>
          {labelFormatter ? labelFormatter(heading) : heading}
        </div>
      )}
      <ul className='space-y-0.5'>
        {items.map(entry => (
          <li
            key={String(entry.dataKey ?? entry.name)}
            className='flex items-center gap-1.5'
          >
            <span
              aria-hidden='true'
              className='inline-block h-2.5 w-2.5 shrink-0 rounded-xs border border-white/50'
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}</span>
            <span className='ml-auto pl-3 font-medium tabular-nums'>
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
