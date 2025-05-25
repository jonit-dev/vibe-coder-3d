import React from 'react';

export interface IToolbarGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolbarGroup: React.FC<IToolbarGroupProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`flex items-center space-x-0.5 bg-black/30 backdrop-blur-sm rounded border border-gray-700/50 p-0.5 ${className}`}
    >
      {children}
    </div>
  );
};
