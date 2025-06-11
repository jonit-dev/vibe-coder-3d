import React, { useEffect, useRef, useState } from 'react';

import { ToastContainer } from '@core/components/ui/Toast';
import { RightSidebarChat } from './components/chat/RightSidebarChat';
import { StackedLeftPanel } from './components/layout/StackedLeftPanel';
import { StatusBar } from './components/layout/StatusBar';
import { TopBar } from './components/layout/TopBar';
import { EnhancedAddObjectMenu } from './components/menus/EnhancedAddObjectMenu';
import { HierarchyPanelContent } from './components/panels/HierarchyPanel/HierarchyPanelContent';
import { InspectorPanelContent } from './components/panels/InspectorPanel/InspectorPanelContent/InspectorPanelContent';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';
import { EditorPhysicsIntegration } from './components/physics/EditorPhysicsIntegration';
import { useAutoSelection } from './hooks/useAutoSelection';
import { useEditorHandlers } from './hooks/useEditorHandlers';
import { GizmoMode, useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useAppState, useEntityState, usePhysicsState, useUIState } from './hooks/useEditorState';
import { useEditorStats } from './hooks/useEditorStats';
import { useEntitySynchronization } from './hooks/useEntitySynchronization';
import { useSceneActions } from './hooks/useSceneActions';
import { useSceneInitialization } from './hooks/useSceneInitialization';

// Import types from centralized types file
export type { ISceneObject, ITransform, ShapeType } from './types/shapes';

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

  // Gizmo mode state for viewport
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate');

  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Entity synchronization with ECS system
  useEntitySynchronization({ entityIds, setEntityIds });

  // Scene actions and file input ref - use new toast-enabled methods
  const { fileInputRef, savedScene, importScene, handleSave, handleLoad, handleClear } =
    useSceneActions();

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

  // Keyboard Shortcuts - use new toast methods
  useEditorKeyboard({
    selectedId,
    setSelectedId,
    isChatExpanded,
    setIsChatExpanded,
    onAddObject: handleAddObject,
    onSave: handleSave, // Use new toast-enabled method
    onStatusMessage: setStatusMessage,
    gizmoMode,
    setGizmoMode,
  });

  // Auto-selection logic
  useAutoSelection({ selectedId, entityIds, setSelectedId });

  // Validation: Clear selectedId if selected entity no longer exists
  useEffect(() => {
    if (selectedId !== null && !entityIds.includes(selectedId)) {
      console.log(`[Editor] Selected entity ${selectedId} no longer exists, clearing selection`);
      setSelectedId(null);
    }
  }, [selectedId, entityIds, setSelectedId]);

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

      {/* Toast Container - shows project operation notifications */}
      <ToastContainer />

      <TopBar
        entityCount={entityIds.length}
        onSave={handleSave} // Use new toast-enabled method
        onLoad={triggerFileLoad}
        onClear={handleClear} // Use new toast-enabled method
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
        onChange={handleLoad} // Use new toast-enabled method
      />

      <main className="flex-1 flex overflow-hidden">
        <StackedLeftPanel
          hierarchyContent={<HierarchyPanelContent />}
          inspectorContent={<InspectorPanelContent />}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={toggleLeftPanel}
        />

        {/* Always render ViewportPanel to prevent Canvas unmounting */}
        <ViewportPanel entityId={selectedId} gizmoMode={gizmoMode} setGizmoMode={setGizmoMode} />

        <RightSidebarChat isExpanded={isChatExpanded} onToggle={toggleChat} />
      </main>

      <StatusBar statusMessage={statusMessage} stats={stats} />
    </div>
  );
};

export default Editor;
