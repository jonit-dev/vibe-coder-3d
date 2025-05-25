import React from 'react';

import { ComponentList } from '@/editor/components/inspector/sections/ComponentList';
import { DebugSection } from '@/editor/components/inspector/sections/DebugSection';
import { EmptyState } from '@/editor/components/inspector/sections/EmptyState';
import { useInspectorData } from '@/editor/hooks/useInspectorData';

export const InspectorPanelContent: React.FC = React.memo(() => {
  const {
    selectedEntity,
    isPlaying,
    components,
    hasTransform,
    hasMeshRenderer,
    hasRigidBody,
    hasMeshCollider,
    hasCamera,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
    getCamera,
    addComponent,
    updateComponent,
    removeComponent,
  } = useInspectorData();

  if (selectedEntity == null) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2 p-2 pb-4">
      <ComponentList
        selectedEntity={selectedEntity}
        isPlaying={isPlaying}
        hasTransform={hasTransform}
        hasMeshRenderer={hasMeshRenderer}
        hasRigidBody={hasRigidBody}
        hasMeshCollider={hasMeshCollider}
        hasCamera={hasCamera}
        getTransform={getTransform}
        getMeshRenderer={getMeshRenderer}
        getRigidBody={getRigidBody}
        getMeshCollider={getMeshCollider}
        getCamera={getCamera}
        addComponent={addComponent}
        updateComponent={updateComponent}
        removeComponent={removeComponent}
      />

      {/* Debug Info */}
      <DebugSection selectedEntity={selectedEntity} components={components} />
    </div>
  );
});
