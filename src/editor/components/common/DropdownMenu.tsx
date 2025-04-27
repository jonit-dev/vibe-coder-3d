import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export interface IDropdownMenuProps {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<IDropdownMenuProps> = ({
  anchorRef,
  open,
  onClose,
  children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({
    visibility: 'hidden',
    pointerEvents: 'none',
  });

  useEffect(() => {
    if (open && anchorRef.current && menuRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: 'absolute',
        left: `${rect.left}px`,
        top: `${rect.bottom + window.scrollY}px`,
        zIndex: 1000,
        visibility: 'visible',
        pointerEvents: 'auto',
      });
      // Debug

      console.log('[DropdownMenu] Opened and positioned', rect);
    }
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    // Debug

    console.log('[DropdownMenu] Mounted and click outside handler attached');
    return () => {
      document.removeEventListener('mousedown', handleClick);
      // Debug

      console.log('[DropdownMenu] Unmounted and click outside handler removed');
    };
  }, [open, onClose]);

  if (!open) return null;

  // Debug

  console.log('[DropdownMenu] Rendering menu');

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={style}
      className="dropdown-content menu p-2 shadow-xl bg-base-200 border border-base-300 rounded-box w-52 z-[1000] overflow-hidden"
    >
      {children}
    </div>,
    document.body,
  );
};
