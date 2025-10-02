import React from 'react';

interface IUseMenuBarClickOutsideProps {
  activeMenu: number | null;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  submenuRef: React.RefObject<HTMLDivElement | null>;
  menuRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  onClose: () => void;
}

export const useMenuBarClickOutside = ({
  activeMenu,
  dropdownRef,
  submenuRef,
  menuRefs,
  onClose,
}: IUseMenuBarClickOutsideProps) => {
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (activeMenu === null) return;

    const handleClick = (e: MouseEvent) => {
      const isClickInDropdown = dropdownRef.current?.contains(e.target as Node);
      const isClickInSubmenu = submenuRef.current?.contains(e.target as Node);
      const isClickInMenuButton = menuRefs.current.some((ref) => ref?.contains(e.target as Node));

      if (!isClickInDropdown && !isClickInSubmenu && !isClickInMenuButton) {
        onCloseRef.current();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeMenu, dropdownRef, submenuRef, menuRefs]);
};
