import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SymbolButton, TemplateButton } from '../../../types/components';
import {
  DetachedPanelPosition,
  computeDetachedPanelPosition,
} from '../dropdownMenuPosition';

import { toSymbolMenuEntries } from './symbolMenuEntries';
import { ACTIVE_GROUP_CLASS_NAME, ITEM_CLASS_NAME } from './symbolsMenuStyles';
import { SymbolsMenuChevron } from './SymbolsMenuChevron';

const NARROW_VIEWPORT_QUERY = '(max-width: 639px)';
const SUBMENU_WIDTH_PX = 128;
const SUBMENU_CLOSE_DELAY_MS = 150;
const MENU_ITEM_ESTIMATED_HEIGHT_PX = 36;
const MENU_MAX_HEIGHT_PX = 264;

interface SubmenuLayout {
  top: number;
  side: 'left' | 'right';
}

interface SymbolsMenuProps {
  trigger: React.ReactNode;
  items: readonly SymbolButton[];
  onInsert: (value: string) => void;
  disabled?: boolean;
}

/**
 * The toolbar's Symbols dropdown. Plain entries insert their value on click;
 * group entries (`children` in the config) open a second-level submenu and
 * never insert or close the menu themselves.
 *
 * The submenu flies out beside the panel on wide viewports (opened by mouse
 * hover, click or ArrowRight) and expands in place below the group on phone
 * widths, where there is no hover and no room beside the panel. The panel is
 * always placed against the nearest positioned ancestor so the toolbar's
 * scroll area cannot clip it.
 */
export const SymbolsMenu: React.FC<SymbolsMenuProps> = ({
  trigger,
  items,
  onInsert,
  disabled = false,
}) => {
  const entries = useMemo(() => toSymbolMenuEntries(items), [items]);
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [position, setPosition] = useState<DetachedPanelPosition | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [submenuLayout, setSubmenuLayout] = useState<SubmenuLayout>({
    top: 0,
    side: 'right',
  });

  // The inline phone layout indents children under their group, which needs
  // more room than the collapsed list of short symbols does.
  const isInlineExpanded = isNarrow && activeGroupIndex !== null;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerTypeRef = useRef('');
  const focusSubmenuOnOpenRef = useRef(false);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setActiveGroupIndex(null);
  }, []);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleSubmenuClose = () => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      setActiveGroupIndex(null);
      closeTimerRef.current = null;
    }, SUBMENU_CLOSE_DELAY_MS);
  };

  useEffect(() => cancelScheduledClose, [cancelScheduledClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };
    // Scrolling moves the trigger away from the detached panel.
    const handleScroll = (event: Event) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, closeMenu]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const container = panel?.offsetParent;
    if (!isOpen || !wrapper || !panel || !container) {
      setPosition(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    setPosition(
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
  }, [isOpen, openUpward, isInlineExpanded]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const row =
      activeGroupIndex === null ? null : rowRefs.current[activeGroupIndex];
    if (isNarrow || !panel || !row) {
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    setSubmenuLayout({
      top: rowRect.top - panelRect.top - panel.clientTop,
      side:
        panelRect.right + SUBMENU_WIDTH_PX > window.innerWidth
          ? 'left'
          : 'right',
    });
  }, [activeGroupIndex, isNarrow, position]);

  useEffect(() => {
    if (activeGroupIndex !== null && focusSubmenuOnOpenRef.current) {
      focusSubmenuOnOpenRef.current = false;
      submenuRef.current?.querySelector('button')?.focus();
    }
  }, [activeGroupIndex]);

  const toggleMenu = () => {
    if (disabled) {
      return;
    }

    if (!isOpen && wrapperRef.current) {
      const triggerRect = wrapperRef.current.getBoundingClientRect();
      const estimatedMenuHeight =
        Math.min(
          entries.length * MENU_ITEM_ESTIMATED_HEIGHT_PX + 8,
          MENU_MAX_HEIGHT_PX,
        ) + 8;
      setOpenUpward(
        window.innerHeight - triggerRect.bottom < estimatedMenuHeight,
      );
      setIsNarrow(
        typeof window.matchMedia === 'function' &&
          window.matchMedia(NARROW_VIEWPORT_QUERY).matches,
      );
    }

    setActiveGroupIndex(null);
    setIsOpen(prev => !prev);
  };

  const handleInsert = (value: string) => {
    onInsert(value);
    closeMenu();
  };

  const handleRowPointerEnter = (
    event: React.PointerEvent,
    groupIndex: number | null,
  ) => {
    lastPointerTypeRef.current = event.pointerType;
    const isHoverCapable =
      event.pointerType !== 'touch' && event.pointerType !== 'pen';
    if (isNarrow || !isHoverCapable) {
      return;
    }
    cancelScheduledClose();
    setActiveGroupIndex(groupIndex);
  };

  const handleGroupClick = (index: number) => {
    // A mouse user on a wide viewport has already opened the group by
    // hovering, so a click must not collapse it again; touch, keyboard and the
    // inline phone layout have no hover and toggle.
    const keepOpen = !isNarrow && lastPointerTypeRef.current === 'mouse';
    setActiveGroupIndex(prev => (prev === index && !keepOpen ? null : index));
  };

  const handleGroupKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    if (activeGroupIndex === index) {
      submenuRef.current?.querySelector('button')?.focus();
      return;
    }
    focusSubmenuOnOpenRef.current = true;
    setActiveGroupIndex(index);
  };

  const handleSubmenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' || activeGroupIndex === null) {
      return;
    }
    event.preventDefault();
    rowRefs.current[activeGroupIndex]?.focus();
    setActiveGroupIndex(null);
  };

  const renderChildButtons = (
    children: readonly TemplateButton[],
    extraClassName = '',
  ) =>
    children.map((child, childIndex) => (
      <button
        key={`${child.label}-${childIndex}`}
        type='button'
        role='menuitem'
        onClick={() => handleInsert(child.value)}
        className={`${ITEM_CLASS_NAME} ${extraClassName}`}
      >
        <span className='truncate'>{child.label}</span>
      </button>
    ));

  const activeEntry =
    activeGroupIndex === null ? undefined : entries[activeGroupIndex];
  const activeGroup = activeEntry?.kind === 'group' ? activeEntry : undefined;

  return (
    <div className='inline-block shrink-0 text-left' ref={wrapperRef}>
      <div onClick={toggleMenu}>{trigger}</div>

      {isOpen && (
        <div
          ref={panelRef}
          style={position ?? undefined}
          className={`glass-panel-dropdown absolute z-10 focus:outline-hidden ${isInlineExpanded ? 'w-40' : 'w-24'} ${openUpward ? 'mb-2' : 'mt-2'}`}
        >
          <div
            className='max-h-64 overflow-x-hidden overflow-y-auto py-1'
            role='menu'
          >
            {entries.map((entry, index) => {
              if (entry.kind === 'item') {
                return (
                  <button
                    key={`${entry.label}-${index}`}
                    type='button'
                    role='menuitem'
                    onPointerEnter={event => handleRowPointerEnter(event, null)}
                    onClick={() => handleInsert(entry.value)}
                    className={ITEM_CLASS_NAME}
                  >
                    <span className='truncate'>{entry.label}</span>
                  </button>
                );
              }

              const isExpanded = activeGroupIndex === index;
              return (
                <React.Fragment key={`${entry.label}-${index}`}>
                  <button
                    ref={element => {
                      rowRefs.current[index] = element;
                    }}
                    type='button'
                    role='menuitem'
                    aria-haspopup='menu'
                    aria-expanded={isExpanded}
                    onPointerEnter={event =>
                      handleRowPointerEnter(event, index)
                    }
                    onPointerLeave={() => !isNarrow && scheduleSubmenuClose()}
                    onClick={() => handleGroupClick(index)}
                    onKeyDown={event => handleGroupKeyDown(event, index)}
                    className={`${ITEM_CLASS_NAME} ${isExpanded ? ACTIVE_GROUP_CLASS_NAME : ''}`}
                  >
                    <span className='truncate'>{entry.label}</span>
                    <SymbolsMenuChevron
                      isExpanded={isExpanded}
                      isInline={isNarrow}
                    />
                  </button>
                  {isNarrow && isExpanded && (
                    <div
                      ref={submenuRef}
                      role='menu'
                      aria-label={entry.label}
                      onKeyDown={handleSubmenuKeyDown}
                    >
                      {renderChildButtons(entry.children, 'pl-6')}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {!isNarrow && activeGroup && (
            <div
              ref={submenuRef}
              role='menu'
              aria-label={activeGroup.label}
              style={{ top: submenuLayout.top }}
              onPointerEnter={cancelScheduledClose}
              onPointerLeave={scheduleSubmenuClose}
              onKeyDown={handleSubmenuKeyDown}
              className={`glass-panel-dropdown absolute w-32 py-1 ${
                submenuLayout.side === 'right' ? 'left-full' : 'right-full'
              }`}
            >
              {renderChildButtons(activeGroup.children)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
