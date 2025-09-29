import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

export interface IMenuItemOption {
  type: string;
  label: string;
  icon: React.ReactNode;
}

export interface IMenuCategory {
  label: string;
  icon?: React.ReactNode;
  items: IMenuItemOption[];
}

export interface INestedDropdownMenuProps {
  anchorRef: React.RefObject<HTMLElement | HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  onItemSelect: (item: IMenuItemOption) => void;
  categories: IMenuCategory[];
}

interface IMenuContainerProps {
  $left: number;
  $top: number;
  $invisible?: boolean;
  $isSubmenu?: boolean;
  $maxHeight?: number;
}

const MenuContainer = React.forwardRef<
  HTMLDivElement,
  IMenuContainerProps & {
    children: React.ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }
>(
  (
    { $left, $top, $invisible, $isSubmenu, $maxHeight, children, onMouseEnter, onMouseLeave },
    ref,
  ) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${$left}px`,
      top: `${$top}px`,
      zIndex: $isSubmenu ? 1002 : 1001,
      padding: '0.5rem',
      width: '14rem',
      backgroundColor: 'hsl(var(--b2))',
      border: '1px solid hsl(var(--b3))',
      borderRadius: 'var(--rounded-box, 1rem)',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      overflow: 'hidden',
      maxHeight: $maxHeight ? `${$maxHeight}px` : 'auto',
      overflowY: $maxHeight ? 'auto' : 'visible',
    };

    if ($invisible) {
      style.opacity = 0;
      style.pointerEvents = 'none';
      style.left = '-9999px';
      style.top = '-9999px';
    }

    return (
      <div ref={ref} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {children}
      </div>
    );
  },
);

MenuContainer.displayName = 'MenuContainer';

export const NestedDropdownMenu: React.FC<INestedDropdownMenuProps> = ({
  anchorRef,
  open,
  onClose,
  onItemSelect,
  categories,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [ready, setReady] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<{
    category: IMenuCategory;
    position: { left: number; top: number };
  } | null>(null);

  // Single timeout for delayed closing only
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Calculate main menu position
  useEffect(() => {
    if (open && anchorRef.current && menuRef.current && !ready) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight || 300; // estimate
      const windowHeight = window.innerHeight;

      let top = rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;

      // Adjust position if menu would go off-screen
      if (top + menuHeight > windowHeight + window.scrollY) {
        top = rect.top + window.scrollY - menuHeight;
      }

      if (left + 224 > window.innerWidth) {
        // 14rem = 224px
        left = rect.right + window.scrollX - 224;
      }

      setPosition({ left, top });
      setReady(true);
    } else if (!open) {
      setReady(false);
      setActiveSubmenu(null);
      // Clear any pending timeout
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
      }
    }
  }, [anchorRef, open, ready]);

  // Handle submenu hover - immediate opening
  const handleSubmenuHover = (category: IMenuCategory, event: React.MouseEvent<HTMLLIElement>) => {
    // Clear any pending close timeout
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }

    // Calculate position immediately
    const rect = event.currentTarget.getBoundingClientRect();
    const submenuWidth = 224; // 14rem
    let left = rect.right + window.scrollX + 4;
    let top = rect.top + window.scrollY;

    // Check if submenu would go off right edge
    if (left + submenuWidth > window.innerWidth) {
      left = rect.left + window.scrollX - submenuWidth - 4;
    }

    // Check if submenu would go off bottom edge
    const submenuHeight = category.items.length * 40 + 16; // estimate
    if (top + submenuHeight > window.innerHeight + window.scrollY) {
      top = window.innerHeight + window.scrollY - submenuHeight;
    }

    setActiveSubmenu({ category, position: { left, top } });
  };

  // Handle submenu click - toggle
  const handleSubmenuClick = (category: IMenuCategory, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (activeSubmenu?.category === category) {
      // Close if already open
      setActiveSubmenu(null);
    } else {
      // Open submenu
      handleSubmenuHover(category, event as any);
    }
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 300); // 300ms delay
  };

  // Handle submenu area mouse enter - cancel close
  const handleSubmenuMouseEnter = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        (!submenuRef.current || !submenuRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
      }
    };
  }, []);

  if (!open) return null;

  // Phase 1: invisible, offscreen for measurement
  if (!ready) {
    return ReactDOM.createPortal(
      <MenuContainer ref={menuRef} $left={-9999} $top={-9999} $invisible>
        <ul className="menu bg-base-200 rounded-box w-full">
          {categories.map((category, index) => (
            <li key={index}>
              <div className="flex items-center gap-2 text-base-content text-sm font-medium px-2 py-2">
                <FiChevronRight className="w-4 h-4" />
                {category.icon && (
                  <span className="w-5 h-5 flex items-center justify-center">{category.icon}</span>
                )}
                <span>{category.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </MenuContainer>,
      document.body,
    );
  }

  // Phase 2: visible, correctly positioned
  return ReactDOM.createPortal(
    <div onMouseLeave={handleMouseLeave}>
      <MenuContainer ref={menuRef} $left={position.left} $top={position.top}>
        <ul className="menu bg-base-200 rounded-box w-full">
          {categories.map((category, index) => (
            <li key={index} onMouseEnter={(e) => handleSubmenuHover(category, e)}>
              <div
                className="flex items-center gap-2 text-base-content text-sm font-medium px-2 py-2 hover:bg-base-300 rounded-box transition-colors cursor-pointer"
                onClick={(e) => handleSubmenuClick(category, e)}
              >
                {activeSubmenu?.category === category ? (
                  <FiChevronDown className="w-4 h-4 transition-transform" />
                ) : (
                  <FiChevronRight className="w-4 h-4 transition-transform" />
                )}
                {category.icon && (
                  <span className="w-5 h-5 flex items-center justify-center">{category.icon}</span>
                )}
                <span>{category.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </MenuContainer>

      {/* Submenu */}
      {activeSubmenu && (
        <MenuContainer
          ref={submenuRef}
          $left={activeSubmenu.position.left}
          $top={activeSubmenu.position.top}
          $isSubmenu
          onMouseEnter={handleSubmenuMouseEnter}
        >
          <ul className="menu bg-base-200 rounded-box w-full">
            {activeSubmenu.category.items.map((item, index) => (
              <li key={index}>
                <button
                  className="flex items-center gap-2 text-base-content text-sm font-medium px-2 py-2 hover:bg-base-300 rounded-box transition-colors w-full text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemSelect(item);
                    onClose();
                  }}
                >
                  <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </MenuContainer>
      )}
    </div>,
    document.body,
  );
};
