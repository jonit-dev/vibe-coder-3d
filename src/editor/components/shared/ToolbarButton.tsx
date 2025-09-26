import React from 'react';

export interface IToolbarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300',
  primary: 'text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300',
  success: 'text-green-400 hover:bg-green-900/30 hover:text-green-300',
  warning: 'text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300',
  danger: 'text-red-400 hover:bg-red-900/30 hover:text-red-300',
  info: 'text-blue-400 hover:bg-blue-900/30 hover:text-blue-300',
};

const sizeClasses = {
  sm: 'p-1.5',
  md: 'px-2 py-1.5',
};

export const ToolbarButton: React.FC<IToolbarButtonProps> = ({
  onClick,
  disabled = false,
  title,
  variant = 'default',
  size = 'sm',
  active = false,
  children,
  className = '',
}) => {
  const baseClasses = 'rounded transition-all duration-200 flex items-center space-x-1';
  const variantClass = disabled ? 'text-gray-500 cursor-not-allowed' : variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const activeClass = active ? 'bg-opacity-30 border border-current border-opacity-30' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${activeClass} ${className}`}
    >
      {children}
    </button>
  );
};
