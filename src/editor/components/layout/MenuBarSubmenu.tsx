import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { IMenuAction } from './MenuBar';
import { MenuBarItem } from './MenuBarItem';

interface IMenuBarSubmenuProps {
  item: IMenuAction;
  position: { left: number; top: number };
  onItemClick: (action?: () => void) => void;
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

export const MenuBarSubmenu: React.FC<IMenuBarSubmenuProps> = ({ item, position, onItemClick }) => {
  const submenuRef = useRef<HTMLDivElement>(null);

  return ReactDOM.createPortal(
    <MenuContainer ref={submenuRef} $left={position.left} $top={position.top} $isSubmenu>
      <div className="py-1">
        {item.submenu?.map((subItem, idx) => (
          <MenuBarItem key={idx} item={subItem} index={idx} onItemClick={onItemClick} />
        ))}
      </div>
    </MenuContainer>,
    document.body,
  );
};

export { MenuContainer };
