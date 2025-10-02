import React from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { IMenuAction } from './MenuBar';

interface IMenuBarItemProps {
  item: IMenuAction;
  index: number;
  onItemClick: (action?: () => void) => void;
  onSubmenuHover?: (item: IMenuAction, event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: () => void;
}

export const MenuBarItem: React.FC<IMenuBarItemProps> = ({
  item,
  index,
  onItemClick,
  onSubmenuHover,
  onMouseEnter,
}) => {
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
      onClick={() => !item.disabled && !hasSubmenu && onItemClick(item.action)}
      onMouseEnter={(e) => {
        if (hasSubmenu && onSubmenuHover) {
          onSubmenuHover(item, e);
        } else if (onMouseEnter) {
          onMouseEnter();
        }
      }}
    >
      <div className="flex items-center gap-2">
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span>{item.label}</span>
      </div>
      <div className="flex items-center gap-2">
        {item.shortcut && <span className="text-xs text-gray-500 font-mono">{item.shortcut}</span>}
        {hasSubmenu && <FiChevronRight className="w-3 h-3" />}
      </div>
    </div>
  );
};
