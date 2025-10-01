import React, { useCallback, useEffect, useRef, useState } from 'react';

import { SoundManager } from '@/core/components/SoundManager';
import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ToastContainer } from '@core/components/ui/Toast';
import { RightSidebarChat } from './components/chat/RightSidebarChat';
import { StackedLeftPanel } from './components/layout/StackedLeftPanel';
import { StatusBar } from './components/layout/StatusBar';
import { TopBar } from './components/layout/TopBar';
import { EnhancedAddObjectMenu } from './components/menus/EnhancedAddObjectMenu';
import { HierarchyPanelContent } from './components/panels/HierarchyPanel/HierarchyPanelContent';
import { LazyInspectorPanelContent } from './components/panels/InspectorPanel/InspectorPanelContent/LazyInspectorPanelContent';
import { MaterialsPanel } from './components/panels/MaterialsPanel/MaterialsPanel';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';
import { EditorPhysicsIntegration } from './components/physics/EditorPhysicsIntegration';
import { AssetLoaderModal } from './components/shared/AssetLoaderModal';
import { ScenePersistenceModal } from './components/shared/ScenePersistenceModal';
import { PreferencesModal } from './components/shared/PreferencesModal';
import { usePrefabs } from './components/prefabs/hooks/usePrefabs';
import { PrefabCreateModal } from './components/prefabs/PrefabCreateModal';
import { PrefabBrowserModal } from './components/prefabs/PrefabBrowserModal';
import { usePrefabsStore } from './store/prefabsStore';
import { useAutoSelection } from './hooks/useAutoSelection';
import { useEditorHandlers } from './hooks/useEditorHandlers';
import { GizmoMode, useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useAppState, useEntityState, usePhysicsState, useUIState } from './hooks/useEditorState';
import { useEditorStats } from './hooks/useEditorStats';
import { useEntitySynchronization } from './hooks/useEntitySynchronization';
import { useStreamingSceneActions } from './hooks/useStreamingSceneActions';
import { useSceneInitialization } from './hooks/useSceneInitialization';
import { Logger } from '@core/lib/logger';

// Import types from centralized types file
export type { ISceneObject, ITransform, ShapeType } from './types/shapes';

// Create logger for editor timing
const editorLogger = Logger.create('Editor:Main');

const Editor: React.FC = () => {
  // Track editor initialization
  useEffect(() => {
    editorLogger.milestone('Editor Component Mounted');

    return () => {
      editorLogger.milestone('Editor Component Unmounted');
    };
  }, []);

  // Component registry hook for entity validation
  const { hasComponent } = useComponentRegistry();

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
  const { isMaterialsExpanded, setIsMaterialsExpanded } = useUIState();

  // Gizmo mode state for viewport
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate');

  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Track left panel state before play mode for restoration
  const leftPanelStateBeforePlay = useRef<boolean>(isLeftPanelCollapsed);

  // Asset loader modal state
  const [showAssetLoader, setShowAssetLoader] = useState(false);

  // Scene persistence modal state
  const [scenePersistenceModal, setScenePersistenceModal] = useState<{
    isOpen: boolean;
    mode: 'save' | 'load';
  }>({ isOpen: false, mode: 'save' });

  // Preferences modal state
  const [showPreferences, setShowPreferences] = useState(false);

  // Prefabs hook
  const { openCreate, closeCreate, openBrowser, closeBrowser, instantiate } = usePrefabs();
  const { isCreateOpen, isBrowserOpen } = usePrefabsStore();

  // Entity synchronization with ECS system
  useEntitySynchronization({ entityIds, setEntityIds });

  // Streaming scene actions with progress feedback
  const {
    fileInputRef,
    handleSave,
    handleLoad,
    handleClear,
    // handleDownloadJSON,
    // triggerFileLoad,
    currentSceneName,
    handleSaveAs,
    progress,
    // cancelOperation,
    scenePersistence,
    loadLastScene,
    // Legacy compatibility
    savedScene,
    importScene,
  } = useStreamingSceneActions({
    onRequestSaveAs: () => setScenePersistenceModal({ isOpen: true, mode: 'save' }),
    onProgressUpdate: (streamingProgress) => {
      // Update status message with streaming progress
      if (streamingProgress.phase === 'processing') {
        const { current, total, entitiesPerSecond, currentEntityName } = streamingProgress;
        const epsText = entitiesPerSecond ? ` (${Math.round(entitiesPerSecond)} entities/sec)` : '';
        setStatusMessage(
          `${streamingProgress.phase}: ${current}/${total} - ${currentEntityName}${epsText}`,
        );
      } else if (streamingProgress.phase === 'complete') {
        setStatusMessage(`Operation completed: ${streamingProgress.total} entities processed`);
      }
    },
  });

  // All action handlers encapsulated in custom hook
  const {
    handleAddObject,
    // handleSaveWithStatus,
    // handleLoadWithStatus,
    // handleClearWithStatus,
    handlePlayWithStatus,
    handlePauseWithStatus,
    handleStopWithStatus,
    toggleAddMenu,
    toggleChat,
    toggleLeftPanel,
    toggleMaterials,
  } = useEditorHandlers({
    setSelectedId,
    setStatusMessage,
    setShowAddMenu,
    setIsPlaying,
    setIsChatExpanded,
    setIsLeftPanelCollapsed,
    setIsMaterialsExpanded,
    showAddMenu,
    isChatExpanded,
    isLeftPanelCollapsed,
    isMaterialsExpanded,
  });

  // Memoized refresh function to prevent excessive API calls
  const handleRefreshScenes = useCallback(async () => {
    await scenePersistence.listTsxScenes();
  }, [scenePersistence.listTsxScenes]);

  // Project Initialization

  // Scene Initialization
  useSceneInitialization({
    savedScene,
    importScene,
    onStatusMessage: setStatusMessage,
    loadLastScene,
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
      // Check if this is a newly created entity that exists in the registry but not yet in the entityIds array
      // This prevents clearing selection of newly created entities during the sync delay
      const entityActuallyExists = hasComponent(selectedId, KnownComponentTypes.TRANSFORM);

      if (entityActuallyExists) {
        return; // Don't clear selection for newly created entities
      }
      setSelectedId(null);
    }
  }, [selectedId, entityIds, setSelectedId, hasComponent]);

  // Auto-collapse/expand left panel based on play mode
  useEffect(() => {
    if (isPlaying) {
      // Save current state before collapsing for play mode
      leftPanelStateBeforePlay.current = isLeftPanelCollapsed;
      if (!isLeftPanelCollapsed) {
        setIsLeftPanelCollapsed(true);
      }
    } else {
      // Restore previous state when exiting play mode
      setIsLeftPanelCollapsed(leftPanelStateBeforePlay.current);
    }
  }, [isPlaying, setIsLeftPanelCollapsed]);

  // Performance stats calculation
  const stats = useEditorStats({
    entityCount: entityIds.length,
    averageFPS: performanceMetrics.averageFPS,
  });

  return (
    <div
      className="w-full h-screen flex flex-col bg-gradient-to-br from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] text-white overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Physics Integration - handles play/pause physics state */}
      <EditorPhysicsIntegration />

      {/* Sound Manager - handles spatial audio integration */}
      <SoundManager />

      {/* Toast Container - shows project operation notifications */}
      <ToastContainer />

      <TopBar
        entityCount={entityIds.length}
        onSave={handleSave}
        onSaveAs={() => setScenePersistenceModal({ isOpen: true, mode: 'save' })}
        onLoad={() => setScenePersistenceModal({ isOpen: true, mode: 'load' })}
        onClear={handleClear}
        onAddObject={toggleAddMenu}
        addButtonRef={addButtonRef}
        isPlaying={isPlaying}
        onPlay={handlePlayWithStatus}
        onPause={handlePauseWithStatus}
        onStop={handleStopWithStatus}
        onToggleChat={toggleChat}
        isChatOpen={isChatExpanded}
        onToggleMaterials={toggleMaterials}
        isMaterialsOpen={isMaterialsExpanded}
        currentSceneName={currentSceneName}
        onOpenPreferences={() => setShowPreferences(true)}
        onCreatePrefab={openCreate}
        onBrowsePrefabs={openBrowser}
      />

      <PreferencesModal isOpen={showPreferences} onClose={() => setShowPreferences(false)} />

      <PrefabCreateModal isOpen={isCreateOpen} onClose={closeCreate} />

      <PrefabBrowserModal
        isOpen={isBrowserOpen}
        onClose={closeBrowser}
        onSelect={(prefabId) => {
          instantiate(prefabId);
          closeBrowser();
        }}
        onCreateNew={openCreate}
      />

      <EnhancedAddObjectMenu
        anchorRef={addButtonRef as React.RefObject<HTMLElement>}
        onAdd={handleAddObject}
        onCustomModel={() => setShowAssetLoader(true)}
      />

      <AssetLoaderModal
        isOpen={showAssetLoader}
        onClose={() => setShowAssetLoader(false)}
        onSelect={(assetPath) => {
          handleAddObject('CustomModel', assetPath);
          setShowAssetLoader(false);
        }}
        title="Select Custom Model"
        basePath="/assets/models"
        allowedExtensions={['glb', 'gltf', 'fbx', 'obj']}
      />

      <ScenePersistenceModal
        isOpen={scenePersistenceModal.isOpen}
        onClose={() => setScenePersistenceModal({ isOpen: false, mode: 'save' })}
        mode={scenePersistenceModal.mode}
        availableScenes={scenePersistence.availableScenes}
        isLoading={scenePersistence.isLoading}
        error={scenePersistence.error}
        onSave={handleSaveAs}
        onLoad={handleLoad}
        onRefresh={handleRefreshScenes}
      />

      {/* Hidden file input for streaming scene loading */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleLoad}
      />

      <main className="flex-1 flex overflow-hidden">
        <StackedLeftPanel
          hierarchyContent={<HierarchyPanelContent />}
          inspectorContent={<LazyInspectorPanelContent />}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={toggleLeftPanel}
        />

        {/* Always render ViewportPanel to prevent Canvas unmounting */}
        <ViewportPanel entityId={selectedId} gizmoMode={gizmoMode} setGizmoMode={setGizmoMode} />

        <RightSidebarChat isExpanded={isChatExpanded} onToggle={toggleChat} />

        <MaterialsPanel isExpanded={isMaterialsExpanded} onToggle={toggleMaterials} />
      </main>

      <StatusBar
        statusMessage={statusMessage}
        stats={stats}
        streamingProgress={progress.isActive ? progress : undefined}
      />
    </div>
  );
};

export default Editor;
