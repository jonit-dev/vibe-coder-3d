import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { MenuBarItem } from './MenuBarItem';
import { MenuBarSubmenu, MenuContainer } from './MenuBarSubmenu';
import { useMenuBarClickOutside } from './hooks/useMenuBarClickOutside';
import { useSubmenuPosition } from './hooks/useSubmenuPosition';

export interface IMenuAction {
  label?: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  submenu?: IMenuAction[];
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface IMenuItem {
  label: string;
  items: IMenuAction[];
}

export interface IMenuBarProps {
  items: IMenuItem[];
}

export const MenuBar: React.FC<IMenuBarProps> = ({ items }) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<{
    item: IMenuAction;
    position: { left: number; top: number };
  } | null>(null);

  const menuRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
    const position = useSubmenuPosition(rect, item.submenu.length);

    setActiveSubmenu({ item, position });
  };

  useMenuBarClickOutside({
    activeMenu,
    dropdownRef,
    menuRefs,
    onClose: () => {
      setActiveMenu(null);
      setActiveSubmenu(null);
    },
  });

  return (
    <div className="h-7 bg-[#1a1a1a] border-b border-gray-800 flex items-center px-2 text-sm">
      {items.map((menu, index) => (
        <button
          key={index}
          ref={(el) => {
            menuRefs.current[index] = el;
          }}
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
              {items[activeMenu].items.map((item, idx) => (
                <MenuBarItem
                  key={idx}
                  item={item}
                  index={idx}
                  onItemClick={handleItemClick}
                  onSubmenuHover={handleSubmenuHover}
                  onMouseEnter={() => setActiveSubmenu(null)}
                />
              ))}
            </div>
          </MenuContainer>,
          document.body,
        )}

      {/* Submenu */}
      {activeSubmenu && (
        <MenuBarSubmenu
          item={activeSubmenu.item}
          position={activeSubmenu.position}
          onItemClick={handleItemClick}
        />
      )}
    </div>
  );
};
