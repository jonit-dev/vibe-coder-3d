import React from 'react';

export interface IHierarchyVisualizationProps {
  entityIds: number[];
  showConnections?: boolean;
}

export const HierarchyVisualization: React.FC<IHierarchyVisualizationProps> = ({
  entityIds: _entityIds,
  showConnections: _showConnections = true,
}) => {
  // Component disabled - no hierarchy visualization
  return null;
};
