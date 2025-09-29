import React from 'react';

export interface IHierarchyVisualizationProps {
  entityIds: number[];
  showConnections?: boolean;
}

export const HierarchyVisualization: React.FC<IHierarchyVisualizationProps> = React.memo(() => {
  // Component disabled - no hierarchy visualization
  return null;
});
