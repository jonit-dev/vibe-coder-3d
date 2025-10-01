import React from 'react';
import { BiCube } from 'react-icons/bi';
import { FiActivity, FiFolder } from 'react-icons/fi';
import { StatusBadge } from '../shared/StatusBadge';

export interface ITopBarStatusSectionProps {
  entityCount: number;
  currentSceneName?: string | null;
}

export const TopBarStatusSection: React.FC<ITopBarStatusSectionProps> = React.memo(
  ({ entityCount, currentSceneName }) => {
    return (
      <div className="flex items-center space-x-3">
        <StatusBadge icon={BiCube} label={`${entityCount} Objects`} variant="cyan" />
        <StatusBadge icon={FiActivity} label="Ready" variant="green" />
        <div className="h-4 w-px bg-gray-700"></div>
        <StatusBadge
          icon={FiFolder}
          label={`Scene: ${currentSceneName || 'None'}`}
          variant="purple"
        />
      </div>
    );
  },
);

TopBarStatusSection.displayName = 'TopBarStatusSection';
