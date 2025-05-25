import React from 'react';

console.log('🔥🔥🔥 INSPECTOR PANEL CONTENT IS LOADING - THIS IS A TEST 🔥🔥🔥');

import { ComponentList } from '@/editor/components/inspector/sections/ComponentList';
import { DebugSection } from '@/editor/components/inspector/sections/DebugSection';
import { EmptyState } from '@/editor/components/inspector/sections/EmptyState';
import { useInspectorData } from '@/editor/hooks/useInspectorData';

export const InspectorPanelContent: React.FC = () => {
  const {
    selectedEntity,
    isPlaying,
    components,
    hasTransform,
    hasMeshRenderer,
    hasRigidBody,
    hasMeshCollider,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
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
        getTransform={getTransform}
        getMeshRenderer={getMeshRenderer}
        getRigidBody={getRigidBody}
        getMeshCollider={getMeshCollider}
        addComponent={addComponent}
        updateComponent={updateComponent}
        removeComponent={removeComponent}
      />

      {/* Debug Info */}
      <DebugSection selectedEntity={selectedEntity} components={components} />
    </div>
  );
};
