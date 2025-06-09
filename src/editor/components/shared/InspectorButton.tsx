import React, { ReactNode } from 'react';

interface IInspectorButtonProps {
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'xs';
  active?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export const InspectorButton: React.FC<IInspectorButtonProps> = ({
  onClick,
  children,
  icon,
  variant = 'secondary',
  size = 'xs',
  active = false,
  disabled = false,
  title,
  className = '',
}) => {
  const getVariantClasses = () => {
    if (active) {
      return variant === 'primary'
        ? 'bg-cyan-600/80 text-cyan-100 border border-cyan-500/50'
        : 'bg-blue-600/80 text-blue-100 border border-blue-500/50';
    }

    return variant === 'primary'
      ? 'bg-cyan-700/80 hover:bg-cyan-600/80 text-cyan-300 border border-cyan-600/50 hover:border-cyan-500/50'
      : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 border border-gray-600/50 hover:border-gray-500/50';
  };

  const getSizeClasses = () => {
    return size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-1.5 py-1 text-[10px]';
  };

  const getIconClasses = () => {
    if (active) {
      return variant === 'primary' ? 'text-cyan-200' : 'text-blue-200';
    }
    return variant === 'primary' ? 'text-cyan-400' : 'text-blue-400';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center gap-1 font-medium transition-all duration-200 rounded flex-shrink-0
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `.trim()}
    >
      {icon && <div className={`w-3 h-3 ${getIconClasses()}`}>{icon}</div>}
      <span>{children}</span>
    </button>
  );
};
