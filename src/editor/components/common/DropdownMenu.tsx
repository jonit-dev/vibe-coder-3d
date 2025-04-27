import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

export interface IDropdownMenuProps {
  anchorRef: React.RefObject<HTMLElement | HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MenuContainer = styled.div<{ $left: number; $top: number; $invisible?: boolean }>`
  position: absolute;
  left: ${(props) => `${props.$left}px`};
  top: ${(props) => `${props.$top}px`};
  z-index: 1000;
  padding: 0.5rem;
  width: 13rem;
  background-color: hsl(var(--b2));
  border: 1px solid hsl(var(--b3));
  border-radius: var(--rounded-box, 1rem);
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
  overflow: hidden;
  ${(props) => (props.$invisible ? 'opacity:0;pointer-events:none;left:-9999px;top:-9999px;' : '')}
`;

export const DropdownMenu: React.FC<IDropdownMenuProps> = ({
  anchorRef,
  open,
  onClose,
  children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [ready, setReady] = useState(false);

  // Phase 1: Render offscreen, then measure and position
  useEffect(() => {
    if (open && anchorRef.current && menuRef.current && !ready) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        left: rect.left,
        top: rect.bottom + window.scrollY,
      });
      setReady(true);
    } else if (!open) {
      setReady(false);
    }
  }, [anchorRef, open, ready]);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  // Phase 1: invisible, offscreen for measurement
  if (!ready) {
    return ReactDOM.createPortal(
      <MenuContainer ref={menuRef} $left={-9999} $top={-9999} $invisible>
        {children}
      </MenuContainer>,
      document.body,
    );
  }

  // Phase 2: visible, correctly positioned
  return ReactDOM.createPortal(
    <MenuContainer ref={menuRef} $left={position.left} $top={position.top}>
      {children}
    </MenuContainer>,
    document.body,
  );
};
