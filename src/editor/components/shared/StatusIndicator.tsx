import React from 'react';

export interface IStatusIndicatorProps {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
  color?: 'cyan' | 'yellow' | 'purple' | 'green' | 'red' | 'blue';
  className?: string;
}

const colorClasses = {
  cyan: 'text-cyan-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  green: 'text-green-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
};

export const StatusIndicator: React.FC<IStatusIndicatorProps> = ({
  icon,
  value,
  label,
  color = 'cyan',
  className = '',
}) => {
  const colorClass = colorClasses[color];

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className={`w-3 h-3 ${colorClass}`}>{icon}</span>
      <span>
        {value}
        {label && ` ${label}`}
      </span>
    </div>
  );
};
