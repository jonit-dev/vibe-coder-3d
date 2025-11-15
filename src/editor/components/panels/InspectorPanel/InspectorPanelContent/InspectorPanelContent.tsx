import React from 'react';

import { IComponent } from '@/core/lib/ecs/IComponent';
import { AnimationAdapter } from '@/editor/components/inspector/adapters/AnimationAdapter';
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
    hasCharacterController,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
    getCamera,
    getLight,
    getCharacterController,
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
        hasCharacterController={hasCharacterController}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getTransform={getTransform as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getMeshRenderer={getMeshRenderer as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getRigidBody={getRigidBody as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getMeshCollider={getMeshCollider as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getCamera={getCamera as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getLight={getLight as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getCharacterController={getCharacterController as any}
        addComponent={addComponent}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateComponent={updateComponent as any}
        removeComponent={removeComponent}
      />

      {/* Other adapters - cast through unknown since we filter by type */}
      {components.filter(c => c.type === 'Script').map(scriptComp => (
        <ScriptAdapter
          key={scriptComp.entityId}
          scriptComponent={scriptComp as unknown as IComponent<never>}
          updateComponent={(type, data) => updateComponent(type, data as never)}
          removeComponent={removeComponent}
        />
      ))}

      {components.filter(c => c.type === 'Sound').map(soundComp => (
        <SoundAdapter
          key={soundComp.entityId}
          soundComponent={soundComp as unknown as IComponent<never>}
          updateComponent={(type, data) => updateComponent(type, data as never)}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
        />
      ))}

      {components.filter(c => c.type === 'Terrain').map(terrainComp => (
        <TerrainAdapter
          key={terrainComp.entityId}
          terrainComponent={terrainComp as unknown as IComponent<never>}
          updateComponent={(type, data) => updateComponent(type, data as never)}
          removeComponent={removeComponent}
        />
      ))}

      {components.filter(c => c.type === 'Animation').map(animationComp => (
        <AnimationAdapter
          key={animationComp.entityId}
          animationComponent={animationComp as unknown as IComponent<never>}
          updateComponent={(type, data) => updateComponent(type, data as never)}
          removeComponent={removeComponent}
          entityId={selectedEntity}
        />
      ))}

      {/* Debug Info */}
      <DebugSection selectedEntity={selectedEntity} components={components} />
    </div>
  );
});
