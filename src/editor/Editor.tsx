import React, { useEffect, useRef, useState } from 'react';

import { EnhancedAddObjectMenu } from './EnhancedAddObjectMenu';
import { HierarchyPanelContent } from './components/panels/HierarchyPanel/HierarchyPanelContent';
import { InspectorPanelContent } from './components/panels/InspectorPanel/InspectorPanelContent';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';
import { EditorPhysicsIntegration } from './components/physics/EditorPhysicsIntegration';
import { RightSidebarChat } from './components/ui/RightSidebarChat';
import { StackedLeftPanel } from './components/ui/StackedLeftPanel';
import { StatusBar } from './components/ui/StatusBar';
import { TopBar } from './components/ui/TopBar';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useEntityCreation } from './hooks/useEntityCreation';
import { useEntityManager } from './hooks/useEntityManager';
import { usePhysicsControls } from './hooks/usePhysicsControls';
import { useSceneActions } from './hooks/useSceneActions';
import { useSceneInitialization } from './hooks/useSceneInitialization';
import { useEditorStore } from './store/editorStore';

// Shape types that can be created in the editor
export type ShapeType = 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane';

// Legacy interfaces kept for compatibility
export interface ITransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface ISceneObject {
  id: string;
  name: string;
  shape: ShapeType;
  components: {
    Transform: ITransform;
    Mesh: string;
    Material: string;
  };
}

const Editor: React.FC = () => {
  // New ECS system - get all entities
  const entityManager = useEntityManager();
  const [entityIds, setEntityIds] = useState<number[]>([]);

  // Subscribe to ECS system for entity changes
  useEffect(() => {
    const updateEntities = () => {
      const entities = entityManager.getAllEntities();
      const ids = entities.map((entity) => entity.id);
      setEntityIds(ids);
      console.log(`[Editor] Entity list updated:`, ids);
    };

    // Initial load
    updateEntities();

    // TODO: Add event listener system to ECS managers for real-time updates
    // For now, we'll use periodic updates
    const interval = setInterval(updateEntities, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [entityManager]);

  const selectedId = useEditorStore((s) => s.selectedId);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const showAddMenu = useEditorStore((s) => s.showAddMenu);
  const setShowAddMenu = useEditorStore((s) => s.setShowAddMenu);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);

  // Local UI State
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Custom Hooks
  const { createEntity, createCube, createSphere } = useEntityCreation();
  const {
    fileInputRef,
    savedScene,
    handleSave,
    handleLoad,
    handleClear,
    triggerFileLoad,
    importScene,
  } = useSceneActions();
  const { handlePlay, handlePause, handleStop } = usePhysicsControls({
    onStatusMessage: setStatusMessage,
  });

  // Scene Initialization
  useSceneInitialization({
    savedScene,
    importScene,
    onStatusMessage: setStatusMessage,
  });

  // Entity Creation Handler
  const handleAddObject = async (type: ShapeType) => {
    try {
      let entity;
      switch (type) {
        case 'Cube':
          entity = createCube();
          break;
        case 'Sphere':
          entity = createSphere();
          break;
        default:
          entity = createEntity(type);
          break;
      }

      setSelectedId(entity.id);
      setStatusMessage(`Created ${type} (Entity ${entity.id})`);
      setShowAddMenu(false);
      console.log('[AddObject] Created entity:', entity);
    } catch (error) {
      console.error('[AddObject] Failed to create entity:', error);
      setStatusMessage(
        `Failed to create ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  // Wrapped handlers for status updates
  const handleSaveWithStatus = () => {
    const message = handleSave();
    setStatusMessage(message);
  };

  const handleLoadWithStatus = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const message = await handleLoad(e);
    setStatusMessage(message);
  };

  const handleClearWithStatus = () => {
    const message = handleClear();
    setStatusMessage(message);
  };

  const handlePlayWithStatus = () => {
    setIsPlaying(true);
    handlePlay();
  };

  const handlePauseWithStatus = () => {
    setIsPlaying(false);
    handlePause();
  };

  const handleStopWithStatus = () => {
    setIsPlaying(false);
    handleStop();
  };

  // Keyboard Shortcuts
  useEditorKeyboard({
    selectedId,
    setSelectedId,
    isChatExpanded,
    setIsChatExpanded,
    onAddObject: handleAddObject,
    onSave: handleSaveWithStatus,
    onStatusMessage: setStatusMessage,
  });

  // Auto-select first entity when available
  useEffect(() => {
    if ((selectedId === null || !entityIds.includes(selectedId)) && entityIds.length > 0) {
      setSelectedId(entityIds[0]);
    }
  }, [selectedId, entityIds, setSelectedId]);

  return (
    <div
      className="w-full h-screen flex flex-col bg-gradient-to-br from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Physics Integration - handles play/pause physics state */}
      <EditorPhysicsIntegration />

      <TopBar
        entityCount={entityIds.length}
        onSave={handleSaveWithStatus}
        onLoad={triggerFileLoad}
        onClear={handleClearWithStatus}
        onAddObject={() => setShowAddMenu(!showAddMenu)}
        addButtonRef={addButtonRef}
        isPlaying={isPlaying}
        onPlay={handlePlayWithStatus}
        onPause={handlePauseWithStatus}
        onStop={handleStopWithStatus}
        onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
        isChatOpen={isChatExpanded}
      />

      <EnhancedAddObjectMenu
        anchorRef={addButtonRef as React.RefObject<HTMLElement>}
        onAdd={handleAddObject}
      />

      {/* Hidden file input for loading scenes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleLoadWithStatus}
      />

      <main className="flex-1 flex overflow-hidden">
        <StackedLeftPanel
          hierarchyContent={<HierarchyPanelContent entityIds={entityIds} />}
          inspectorContent={<InspectorPanelContent />}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
        />

        {selectedId != null ? (
          <ViewportPanel entityId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            <div className="max-w-md text-center px-4">
              <div className="mb-2">No entity selected or scene is empty.</div>
              <button
                className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-sm mt-2 disabled:opacity-50"
                onClick={() => handleAddObject('Cube')}
              >
                Add Object
              </button>
            </div>
          </div>
        )}

        <RightSidebarChat
          isExpanded={isChatExpanded}
          onToggle={() => setIsChatExpanded(!isChatExpanded)}
        />
      </main>

      <StatusBar
        statusMessage={statusMessage}
        stats={{
          entities: entityIds.length,
          fps: 60, // placeholder
          memory: '128MB', // placeholder
        }}
      />
    </div>
  );
};

export default Editor;
