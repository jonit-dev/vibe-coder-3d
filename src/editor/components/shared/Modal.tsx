import React, { ReactNode, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  maxHeight?: string;
  backdropOpacity?: string;
  scrollBody?: boolean;
  containerClassName?: string;
  bodyClassName?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export const useModal = (isOpen: boolean, onClose: () => void, closeOnEscape = true) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleFocusTrap);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEscape]);

  return { modalRef };
};

const getModalSizeClasses = (size: IModalProps['size']) => {
  const sizeClasses = {
    sm: 'w-full max-w-sm mx-4',
    md: 'w-full max-w-md mx-4',
    lg: 'w-full max-w-lg mx-4',
    xl: 'w-full max-w-2xl mx-4',
    full: 'w-full max-w-[calc(100vw-2rem)] mx-4 sm:max-w-[calc(100vw-4rem)] sm:mx-8'
  };
  return sizeClasses[size || 'md'];
};

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  // Use dynamic viewport units to avoid mobile browser chrome causing cutoff
  maxHeight = 'max-h-[90dvh] sm:max-h-[85dvh]',
  backdropOpacity = 'bg-black/40',
  // Default to scrollable body to prevent Y cut off
  scrollBody = true,
  containerClassName = '',
  bodyClassName = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
}) => {
  const { modalRef } = useModal(isOpen, onClose, closeOnEscape);

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 ${backdropOpacity} flex items-center justify-center z-[100] p-4`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`
          bg-gray-800 rounded-lg border border-gray-600
          ${getModalSizeClasses(size)}
          ${maxHeight}
          flex flex-col shadow-xl overflow-hidden
          ${containerClassName}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-600 flex-shrink-0">
            <h3 id="modal-title" className="text-sm sm:text-base font-semibold text-white flex items-center gap-2 truncate pr-2">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white flex-shrink-0 transition-colors"
              aria-label="Close modal"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`
          flex-1 flex flex-col min-h-0
          ${scrollBody ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}
          ${bodyClassName}
        `}>
          {children}
        </div>
      </div>
    </div>
  );
};
