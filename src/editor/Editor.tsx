import React, { useRef } from 'react';

import { EnhancedAddObjectMenu } from './EnhancedAddObjectMenu';
import { RightSidebarChat } from './components/chat/RightSidebarChat';
import { StackedLeftPanel } from './components/layout/StackedLeftPanel';
import { StatusBar } from './components/layout/StatusBar';
import { TopBar } from './components/layout/TopBar';
import { HierarchyPanelContent } from './components/panels/HierarchyPanel/HierarchyPanelContent';
import { InspectorPanelContent } from './components/panels/InspectorPanel/InspectorPanelContent/InspectorPanelContent';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';
import { EditorPhysicsIntegration } from './components/physics/EditorPhysicsIntegration';
import { useAutoSelection } from './hooks/useAutoSelection';
import { useEditorHandlers } from './hooks/useEditorHandlers';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useAppState, useEntityState, usePhysicsState, useUIState } from './hooks/useEditorState';
import { useEditorStats } from './hooks/useEditorStats';
import { useEntitySynchronization } from './hooks/useEntitySynchronization';
import { useSceneActions } from './hooks/useSceneActions';
import { useSceneInitialization } from './hooks/useSceneInitialization';

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
  // Grouped state management hooks - prevents unnecessary re-renders
  const { entityIds, selectedId, setEntityIds, setSelectedId } = useEntityState();
  const {
    isChatExpanded,
    setIsChatExpanded,
    isLeftPanelCollapsed,
    setIsLeftPanelCollapsed,
    showAddMenu,
    setShowAddMenu,
  } = useUIState();
  const { isPlaying, setIsPlaying } = usePhysicsState();
  const { statusMessage, setStatusMessage, performanceMetrics } = useAppState();

  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Entity synchronization with ECS system
  const { entityManager } = useEntitySynchronization({ entityIds, setEntityIds });

  // Scene actions and file input ref
  const { fileInputRef, savedScene, importScene } = useSceneActions();

  // All action handlers encapsulated in custom hook
  const {
    handleAddObject,
    handleSaveWithStatus,
    handleLoadWithStatus,
    handleClearWithStatus,
    triggerFileLoad,
    handlePlayWithStatus,
    handlePauseWithStatus,
    handleStopWithStatus,
    toggleAddMenu,
    toggleChat,
    toggleLeftPanel,
  } = useEditorHandlers({
    setSelectedId,
    setStatusMessage,
    setShowAddMenu,
    setIsPlaying,
    setIsChatExpanded,
    setIsLeftPanelCollapsed,
    showAddMenu,
    isChatExpanded,
    isLeftPanelCollapsed,
  });

  // Scene Initialization
  useSceneInitialization({
    savedScene,
    importScene,
    onStatusMessage: setStatusMessage,
  });

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

  // Auto-selection logic
  useAutoSelection({ selectedId, entityIds, setSelectedId });

  // Performance stats calculation
  const stats = useEditorStats({
    entityCount: entityIds.length,
    averageFPS: performanceMetrics.averageFPS,
  });

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
