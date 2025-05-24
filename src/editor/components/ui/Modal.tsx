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
}

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'w-96',
  maxHeight = 'max-h-[80vh]',
  backdropOpacity = 'bg-black/40',
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${backdropOpacity} flex items-center justify-center z-[100]`}>
      <div
        className={`bg-gray-800 rounded-lg border border-gray-600 ${maxWidth} ${maxHeight} flex flex-col shadow-xl`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-3 border-b border-gray-600">
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
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
};
