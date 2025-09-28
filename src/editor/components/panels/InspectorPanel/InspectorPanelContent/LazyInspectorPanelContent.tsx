import React, { Suspense, lazy } from 'react';

const InspectorPanelContent = lazy(() =>
  import('./InspectorPanelContent').then((module) => ({
    default: module.InspectorPanelContent,
  })),
);

export const LazyInspectorPanelContent: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Loading Inspector...
        </div>
      }
    >
      <InspectorPanelContent />
    </Suspense>
  );
};
