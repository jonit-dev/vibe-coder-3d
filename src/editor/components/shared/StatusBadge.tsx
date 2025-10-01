import React from 'react';
import { IconType } from 'react-icons';

export interface IStatusBadgeProps {
  icon: IconType;
  label: string;
  variant?: 'cyan' | 'green' | 'purple' | 'yellow' | 'red';
  className?: string;
}

const variantStyles = {
  cyan: 'bg-cyan-950/30 border-cyan-800/30 text-cyan-300',
  green: 'bg-green-950/30 border-green-800/30 text-green-300',
  purple: 'bg-purple-950/30 border-purple-800/30 text-purple-300',
  yellow: 'bg-yellow-950/30 border-yellow-800/30 text-yellow-300',
  red: 'bg-red-950/30 border-red-800/30 text-red-300',
};

export const StatusBadge: React.FC<IStatusBadgeProps> = React.memo(
  ({ icon: Icon, label, variant = 'cyan', className = '' }) => {
    return (
      <div
        className={`px-2 py-1 border rounded text-xs flex items-center space-x-1 ${variantStyles[variant]} ${className}`}
      >
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
    );
  },
);

StatusBadge.displayName = 'StatusBadge';
