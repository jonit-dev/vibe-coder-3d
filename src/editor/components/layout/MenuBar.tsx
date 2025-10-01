import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FiChevronRight } from 'react-icons/fi';

export interface IMenuAction {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  submenu?: IMenuAction[];
  disabled?: boolean;
}

export interface IMenuItem {
  label: string;
  items: IMenuAction[];
}

export interface IMenuBarProps {
  items: IMenuItem[];
}

interface IMenuContainerProps {
  $left: number;
  $top: number;
  $isSubmenu?: boolean;
}

const MenuContainer = React.forwardRef<
  HTMLDivElement,
  IMenuContainerProps & { children: React.ReactNode }
>(({ $left, $top, $isSubmenu, children }, ref) => {
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${$left}px`,
    top: `${$top}px`,
    zIndex: $isSubmenu ? 9999 : 9998,
    minWidth: '200px',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '0.25rem',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    overflow: 'hidden',
  };

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
});

MenuContainer.displayName = 'MenuContainer';

export const MenuBar: React.FC<IMenuBarProps> = ({ items }) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<{
    item: IMenuAction;
    position: { left: number; top: number };
  } | null>(null);

  const menuRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (index: number) => {
    if (activeMenu === index) {
      setActiveMenu(null);
      setActiveSubmenu(null);
      return;
    }

    const buttonEl = menuRefs.current[index];
    if (buttonEl) {
      const rect = buttonEl.getBoundingClientRect();
      setMenuPosition({
        left: rect.left,
        top: rect.bottom,
      });
      setActiveMenu(index);
      setActiveSubmenu(null);
    }
  };

  const handleMenuHover = (index: number) => {
    if (activeMenu !== null) {
      handleMenuClick(index);
    }
  };

  const handleItemClick = (action?: () => void) => {
    if (action) {
      action();
    }
    setActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleSubmenuHover = (item: IMenuAction, event: React.MouseEvent<HTMLDivElement>) => {
    if (!item.submenu) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const submenuWidth = 200;
    let left = rect.right + 4;
    let top = rect.top;

    // Check if submenu would go off right edge
    if (left + submenuWidth > window.innerWidth) {
      left = rect.left - submenuWidth - 4;
    }

    // Check if submenu would go off bottom edge
    const submenuHeight = item.submenu.length * 32 + 16;
    if (top + submenuHeight > window.innerHeight) {
      top = window.innerHeight - submenuHeight;
    }

    setActiveSubmenu({ item, position: { left, top } });
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    if (activeMenu === null) return;

    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        (!submenuRef.current || !submenuRef.current.contains(e.target as Node)) &&
        !menuRefs.current.some((ref) => ref?.contains(e.target as Node))
      ) {
        setActiveMenu(null);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeMenu]);

  const renderMenuItem = (item: IMenuAction, index: number) => {
    if (item.divider) {
      return <div key={index} className="h-px bg-gray-700 my-1" />;
    }

    const hasSubmenu = item.submenu && item.submenu.length > 0;

    return (
      <div
        key={index}
        className={`px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer flex items-center justify-between ${
          item.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => !item.disabled && !hasSubmenu && handleItemClick(item.action)}
        onMouseEnter={(e) => {
          setHoveredItem(index);
          if (hasSubmenu) {
            handleSubmenuHover(item, e);
          } else {
            setActiveSubmenu(null);
          }
        }}
      >
        <span>{item.label}</span>
        <div className="flex items-center gap-2">
          {item.shortcut && (
            <span className="text-xs text-gray-500 font-mono">{item.shortcut}</span>
          )}
          {hasSubmenu && <FiChevronRight className="w-3 h-3" />}
        </div>
      </div>
    );
  };

  return (
    <div className="h-7 bg-[#1a1a1a] border-b border-gray-800 flex items-center px-2 text-sm">
      {items.map((menu, index) => (
        <button
          key={index}
          ref={(el) => (menuRefs.current[index] = el)}
          className={`px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors ${
            activeMenu === index ? 'bg-gray-700' : ''
          }`}
          onClick={() => handleMenuClick(index)}
          onMouseEnter={() => handleMenuHover(index)}
        >
          {menu.label}
        </button>
      ))}

      {/* Dropdown menu */}
      {activeMenu !== null &&
        ReactDOM.createPortal(
          <MenuContainer ref={dropdownRef} $left={menuPosition.left} $top={menuPosition.top}>
            <div className="py-1">
              {items[activeMenu].items.map((item, idx) => renderMenuItem(item, idx))}
            </div>
          </MenuContainer>,
          document.body,
        )}

      {/* Submenu */}
      {activeSubmenu &&
        ReactDOM.createPortal(
          <MenuContainer
            ref={submenuRef}
            $left={activeSubmenu.position.left}
            $top={activeSubmenu.position.top}
            $isSubmenu
          >
            <div className="py-1">
              {activeSubmenu.item.submenu?.map((subItem, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer flex items-center justify-between ${
                    subItem.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !subItem.disabled && handleItemClick(subItem.action)}
                >
                  <span>{subItem.label}</span>
                  {subItem.shortcut && (
                    <span className="text-xs text-gray-500 font-mono">{subItem.shortcut}</span>
                  )}
                </div>
              ))}
            </div>
          </MenuContainer>,
          document.body,
        )}
    </div>
  );
};
