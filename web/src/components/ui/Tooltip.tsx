import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { TooltipPosition, computeTooltipPosition } from './tooltipPosition';

interface TooltipProps {
  /** Text or markup shown inside the tooltip panel. */
  content: React.ReactNode;
  /** Accessible name of the trigger; required because the trigger is usually an icon. */
  label: string;
  /** Visual content of the trigger, typically a small icon. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Icon-sized trigger that reveals a small glass panel on hover, keyboard
 * focus or tap (a tap fires the emulated hover and focus events, and tapping
 * elsewhere dismisses it). The panel is rendered in a portal with fixed positioning so
 * it is never clipped by a scrolling ancestor such as a modal body.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  label,
  children,
  className = '',
}) => {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!isOpen || !trigger || !panel) {
      setPosition(null);
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    setPosition(
      computeTooltipPosition({
        trigger: trigger.getBoundingClientRect(),
        tooltip: { width: panelRect.width, height: panelRect.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }),
    );
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const close = () => setIsOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    const handleMouseDown = (event: MouseEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    // The panel is fixed to the viewport, so it would drift away from its
    // trigger if anything scrolled or the viewport resized.
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        aria-label={label}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`inline-flex items-center justify-center rounded-full text-gray-500 transition-colors hover:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-hidden dark:text-gray-400 dark:hover:text-primary-300 ${className}`}
      >
        {children}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            id={tooltipId}
            role='tooltip'
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            className='glass-panel-dropdown pointer-events-none fixed z-[60] max-w-[calc(100vw-1rem)] px-3 py-1.5 text-xs font-normal whitespace-nowrap text-gray-900 dark:text-gray-100'
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
};
