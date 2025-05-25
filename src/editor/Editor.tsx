import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { EnhancedAddObjectMenu } from './EnhancedAddObjectMenu';
import { RightSidebarChat } from './components/chat/RightSidebarChat';
import { StackedLeftPanel } from './components/layout/StackedLeftPanel';
import { StatusBar } from './components/layout/StatusBar';
import { TopBar } from './components/layout/TopBar';
import { HierarchyPanelContent } from './components/panels/HierarchyPanel/HierarchyPanelContent';
import { InspectorPanelContent } from './components/panels/InspectorPanel/InspectorPanelContent/InspectorPanelContent';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';
import { EditorPhysicsIntegration } from './components/physics/EditorPhysicsIntegration';
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
  // New ECS system - get all entities with reactive updates
  const entityManager = useEntityManager();

  // Zustand store selectors - grouped by concern
  const entityIds = useEditorStore((state) => state.entityIds);
  const setEntityIds = useEditorStore((state) => state.setEntityIds);
  const selectedId = useEditorStore((state) => state.selectedId);
  const setSelectedId = useEditorStore((state) => state.setSelectedId);
  const statusMessage = useEditorStore((state) => state.statusMessage);
  const setStatusMessage = useEditorStore((state) => state.setStatusMessage);
  const isChatExpanded = useEditorStore((state) => state.isChatExpanded);
  const setIsChatExpanded = useEditorStore((state) => state.setIsChatExpanded);
  const isLeftPanelCollapsed = useEditorStore((state) => state.isLeftPanelCollapsed);
  const setIsLeftPanelCollapsed = useEditorStore((state) => state.setIsLeftPanelCollapsed);
  const showAddMenu = useEditorStore((state) => state.showAddMenu);
  const setShowAddMenu = useEditorStore((state) => state.setShowAddMenu);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const setIsPlaying = useEditorStore((state) => state.setIsPlaying);
  const performanceMetrics = useEditorStore((state) => state.performanceMetrics);

  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Subscribe to ECS system for entity changes with reactive updates
  useEffect(() => {
    const updateEntities = () => {
      const entities = entityManager.getAllEntities();
      const newIds = entities.map((entity) => entity.id);

      // Only update if the entity list actually changed
      if (
        entityIds.length !== newIds.length ||
        !entityIds.every((id, index) => id === newIds[index])
      ) {
        console.log(`[Editor] Entity list updated:`, newIds);
        setEntityIds(newIds);
      }
    };

    // Initial load
    updateEntities();

    // Listen for entity events for real-time reactive updates
    const removeEventListener = entityManager.addEventListener((event) => {
      console.log(`[Editor] Entity event: ${event.type}`, event.entityId);
      updateEntities();
    });

    return removeEventListener;
  }, [entityManager, entityIds, setEntityIds]);

  // Custom Hooks
  const {
    createEntity,
    createCube,
    createSphere,
    createCylinder,
    createCone,
    createTorus,
    createPlane,
  } = useEntityCreation();
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

  // Memoized Entity Creation Handler
  const handleAddObject = useCallback(
    async (type: ShapeType) => {
      try {
        let entity;
        switch (type) {
          case 'Cube':
            entity = createCube();
            break;
          case 'Sphere':
            entity = createSphere();
            break;
          case 'Cylinder':
            entity = createCylinder();
            break;
          case 'Cone':
            entity = createCone();
            break;
          case 'Torus':
            entity = createTorus();
            break;
          case 'Plane':
            entity = createPlane();
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
    },
    [
      createEntity,
      createCube,
      createSphere,
      createCylinder,
      createCone,
      createTorus,
      createPlane,
      setSelectedId,
      setStatusMessage,
      setShowAddMenu,
    ],
  );

  // Memoized wrapped handlers for status updates
  const handleSaveWithStatus = useCallback(() => {
    const message = handleSave();
    setStatusMessage(message);
  }, [handleSave]);

  const handleLoadWithStatus = useCallback(
    async (e?: React.ChangeEvent<HTMLInputElement>) => {
      const message = await handleLoad(e);
      setStatusMessage(message);
    },
    [handleLoad],
  );

  const handleClearWithStatus = useCallback(() => {
    const message = handleClear();
    setStatusMessage(message);
  }, [handleClear]);

  const handlePlayWithStatus = useCallback(() => {
    setIsPlaying(true);
    handlePlay();
  }, [setIsPlaying, handlePlay]);

  const handlePauseWithStatus = useCallback(() => {
    setIsPlaying(false);
    handlePause();
  }, [setIsPlaying, handlePause]);

  const handleStopWithStatus = useCallback(() => {
    setIsPlaying(false);
    handleStop();
  }, [setIsPlaying, handleStop]);

  // Simplified toggle handlers using store
  const toggleAddMenu = useCallback(
    () => setShowAddMenu(!showAddMenu),
    [showAddMenu, setShowAddMenu],
  );
  const toggleChat = useCallback(
    () => setIsChatExpanded(!isChatExpanded),
    [isChatExpanded, setIsChatExpanded],
  );
  const toggleLeftPanel = useCallback(
    () => setIsLeftPanelCollapsed(!isLeftPanelCollapsed),
    [isLeftPanelCollapsed, setIsLeftPanelCollapsed],
  );

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

  // Auto-select first entity when available (memoized)
  useEffect(() => {
    if ((selectedId === null || !entityIds.includes(selectedId)) && entityIds.length > 0) {
      setSelectedId(entityIds[0]);
    }
  }, [selectedId, entityIds, setSelectedId]);

  // Memoized stats object to prevent StatusBar re-renders
  const stats = useMemo(
    () => ({
      entities: entityIds.length,
      fps: Math.round(performanceMetrics.averageFPS || 0),
      memory: '128MB', // placeholder - no memory tracking yet
    }),
    [entityIds.length, performanceMetrics.averageFPS],
  );

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
        onAddObject={toggleAddMenu}
        addButtonRef={addButtonRef}
        isPlaying={isPlaying}
        onPlay={handlePlayWithStatus}
        onPause={handlePauseWithStatus}
        onStop={handleStopWithStatus}
        onToggleChat={toggleChat}
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
          hierarchyContent={<HierarchyPanelContent />}
          inspectorContent={<InspectorPanelContent />}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={toggleLeftPanel}
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

        <RightSidebarChat isExpanded={isChatExpanded} onToggle={toggleChat} />
      </main>

      <StatusBar statusMessage={statusMessage} stats={stats} />
    </div>
  );
};

export default Editor;
