import React from 'react';

import { ScriptAdapter } from '@/editor/components/inspector/adapters/ScriptAdapter';
import { SoundAdapter } from '@/editor/components/inspector/adapters/SoundAdapter';
import { TerrainAdapter } from '@/editor/components/inspector/adapters/TerrainAdapter';
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
    hasLight,
    hasSound,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
    getCamera,
    getLight,
    getSound,
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
        hasLight={hasLight}
        hasSound={hasSound}
        getTransform={getTransform}
        getMeshRenderer={getMeshRenderer}
        getRigidBody={getRigidBody}
        getMeshCollider={getMeshCollider}
        getCamera={getCamera}
        getLight={getLight}
        getSound={getSound}
        addComponent={addComponent}
        updateComponent={updateComponent}
        removeComponent={removeComponent}
      />

      {/* Script (rendered outside ComponentList to minimize type churn) */}
      {(() => {
        const scriptComp = components.find((c) => c.type === 'Script') as any;
        return scriptComp ? (
          <ScriptAdapter
            scriptComponent={scriptComp as any}
            updateComponent={updateComponent as any}
            removeComponent={removeComponent}
          />
        ) : null;
      })()}

      {/* Sound (rendered outside ComponentList to minimize type churn) */}
      {(() => {
        const soundComp = components.find((c) => c.type === 'Sound') as any;
        return soundComp ? (
          <SoundAdapter
            soundComponent={soundComp as any}
            updateComponent={updateComponent as any}
            removeComponent={removeComponent}
            isPlaying={isPlaying}
          />
        ) : null;
      })()}

      {/* Terrain (rendered outside ComponentList to minimize type churn) */}
      {(() => {
        const terrainComp = components.find((c) => c.type === 'Terrain') as any;
        return terrainComp ? (
          <TerrainAdapter
            terrainComponent={terrainComp as any}
            updateComponent={updateComponent as any}
            removeComponent={removeComponent}
          />
        ) : null;
      })()}

      {/* Debug Info */}
      <DebugSection selectedEntity={selectedEntity} components={components} />
    </div>
  );
});
