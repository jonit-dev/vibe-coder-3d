import React, { useState } from 'react';

export interface ICollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  indentContent?: boolean;
}

export const Collapsible: React.FC<ICollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  indentContent = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`mb-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center text-left w-full py-0.5 px-1 bg-base-300/30 hover:bg-base-300/50 text-xs font-medium ${headerClassName}`}
      >
        <svg
          className={`h-2.5 w-2.5 mr-1 transform transition-transform duration-100 ${
            isOpen ? 'rotate-90' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6 6L14 10L6 14V6Z" />
        </svg>
        <span>{title}</span>
      </button>
      {isOpen && (
        <div className={`pt-0.5 pb-1 ${indentContent ? 'pl-3' : ''} ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};
