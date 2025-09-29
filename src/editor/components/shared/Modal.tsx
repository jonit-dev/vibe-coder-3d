import React, { ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  backdropOpacity?: string;
  // When true, the modal body (between header/footer) scrolls; otherwise, delegate scroll to children
  scrollBody?: boolean;
  // Optional class names to customize container/body styling
  containerClassName?: string;
  bodyClassName?: string;
}

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'w-96',
  maxHeight = 'max-h-[80vh]',
  backdropOpacity = 'bg-black/40',
  scrollBody = false,
  containerClassName = '',
  bodyClassName = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${backdropOpacity} flex items-center justify-center z-[100]`}>
      <div
        className={`bg-gray-800 rounded-lg border border-gray-600 ${maxWidth} ${maxHeight} flex flex-col shadow-xl overflow-hidden ${containerClassName}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-3 border-b border-gray-600 flex-shrink-0">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <FiX />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 flex flex-col min-h-0 ${scrollBody ? 'overflow-y-auto' : 'overflow-hidden'} ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
};
