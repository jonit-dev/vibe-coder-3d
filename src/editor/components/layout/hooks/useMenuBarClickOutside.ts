import React from 'react';

interface IUseMenuBarClickOutsideProps {
  activeMenu: number | null;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  menuRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  onClose: () => void;
}

export const useMenuBarClickOutside = ({
  activeMenu,
  dropdownRef,
  menuRefs,
  onClose,
}: IUseMenuBarClickOutsideProps) => {
  React.useEffect(() => {
    if (activeMenu === null) return;

    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !menuRefs.current.some((ref) => ref?.contains(e.target as Node))
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeMenu, dropdownRef, menuRefs, onClose]);
};
