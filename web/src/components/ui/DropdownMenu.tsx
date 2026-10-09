import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

import {
  DetachedPanelPosition,
  computeDetachedPanelPosition,
} from './dropdownMenuPosition';

export interface DropdownMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Marks the item as the current selection (e.g. an active sort order), showing a checkmark. */
  isSelected?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  className?: string;
  disabled?: boolean;
  /** Tailwind width class for the menu panel, e.g. `w-24` for short labels. */
  menuWidthClassName?: string;
  /**
   * Positions the panel against the nearest positioned ancestor instead of
   * the trigger wrapper. Use when the trigger lives inside a scroll container,
   * which would otherwise clip the panel; the positioned ancestor must sit
   * outside that container. The menu closes when anything outside it scrolls.
   */
  detached?: boolean;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  className = '',
  disabled = false,
  menuWidthClassName = 'w-56',
  detached = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [detachedPosition, setDetachedPosition] =
    useState<DetachedPanelPosition | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Native <select> popups flip above the trigger when there isn't enough
  // room below; this custom panel has to replicate that manually since it's
  // just an absolutely-positioned div.
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // A detached panel no longer follows its trigger, so it has to be placed
  // from measurements once it has rendered.
  useLayoutEffect(() => {
    const wrapper = dropdownRef.current;
    const panel = panelRef.current;
    const container = panel?.offsetParent;
    if (!isOpen || !detached || !wrapper || !panel || !container) {
      setDetachedPosition(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    setDetachedPosition(
      computeDetachedPanelPosition({
        trigger: wrapper.getBoundingClientRect(),
        panelWidth: panel.getBoundingClientRect().width,
        container: {
          left: containerRect.left + container.clientLeft,
          top: containerRect.top + container.clientTop,
          width: container.clientWidth,
          height: container.clientHeight,
        },
        openUpward,
      }),
    );
  }, [isOpen, detached, openUpward]);

  // Scrolling moves the trigger away from a detached panel
  useEffect(() => {
    const handleScroll = (event: Event) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen && detached) {
      document.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, detached]);

  const toggleDropdown = () => {
    if (disabled) {
      return;
    }

    if (!isOpen && dropdownRef.current) {
      const triggerRect = dropdownRef.current.getBoundingClientRect();
      // Mirrors the panel's `max-h-64` (16rem) cap so the estimate matches
      // what will actually render, without needing a measure-then-flip pass.
      const estimatedMenuHeight = Math.min(items.length * 36 + 8, 264) + 8;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      setOpenUpward(spaceBelow < estimatedMenuHeight);
    }

    setIsOpen(prev => !prev);
  };

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const attachedPlacementClassName = `right-0 ${openUpward ? 'bottom-full' : 'top-full'}`;

  return (
    <div
      className={`${detached ? '' : 'relative'} inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      {/* Trigger button */}
      <div onClick={toggleDropdown}>{trigger}</div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={panelRef}
          style={detached ? (detachedPosition ?? undefined) : undefined}
          className={`glass-panel-dropdown absolute z-10 ${detached ? '' : attachedPlacementClassName} ${openUpward ? 'mb-2' : 'mt-2'} ${menuWidthClassName} focus:outline-none`}
        >
          <div className='max-h-64 overflow-y-auto py-1' role='menu'>
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`group flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                  item.disabled
                    ? 'cursor-not-allowed text-gray-400 dark:text-gray-500'
                    : item.isSelected
                      ? 'bg-primary-500/10 text-primary-700 dark:bg-primary-400/20 dark:text-primary-200'
                      : 'text-gray-700 hover:bg-primary-500/[15%] hover:text-primary-700 focus-visible:bg-primary-500/[15%] focus-visible:text-primary-700 focus-visible:outline-none dark:text-gray-200 dark:hover:bg-primary-400/20 dark:hover:text-primary-100 dark:focus-visible:bg-primary-400/20 dark:focus-visible:text-primary-100'
                } `}
                role='menuitem'
              >
                <span className='flex items-center'>
                  {item.icon && (
                    <span className='mr-3 flex-shrink-0'>{item.icon}</span>
                  )}
                  {item.label}
                </span>
                {item.isSelected && (
                  <svg
                    className='ml-2 h-4 w-4 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
