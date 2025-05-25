import { useCallback } from 'react';

import type { ShapeType } from '../types/shapes';

import { useEntityCreation } from './useEntityCreation';
import { usePhysicsControls } from './usePhysicsControls';
import { useSceneActions } from './useSceneActions';

interface IUseEditorHandlersProps {
  setSelectedId: (id: number | null) => void;
  setStatusMessage: (message: string) => void;
  setShowAddMenu: (show: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsChatExpanded: (expanded: boolean) => void;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;
  showAddMenu: boolean;
  isChatExpanded: boolean;
  isLeftPanelCollapsed: boolean;
}

export const useEditorHandlers = ({
  setSelectedId,
  setStatusMessage,
  setShowAddMenu,
  setIsPlaying,
  setIsChatExpanded,
  setIsLeftPanelCollapsed,
  showAddMenu,
  isChatExpanded,
  isLeftPanelCollapsed,
}: IUseEditorHandlersProps) => {
  // Entity creation hooks
  const {
    createEntity,
    createCube,
    createSphere,
    createCylinder,
    createCone,
    createTorus,
    createPlane,
  } = useEntityCreation();

  // Scene action hooks
  const { handleSave, handleLoad, handleClear, triggerFileLoad } = useSceneActions();

  // Physics control hooks
  const { handlePlay, handlePause, handleStop } = usePhysicsControls({
    onStatusMessage: setStatusMessage,
  });

  // Entity creation handler
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

  // Scene action handlers with status updates
  const handleSaveWithStatus = useCallback(() => {
    const message = handleSave();
    setStatusMessage(message);
  }, [handleSave, setStatusMessage]);

  const handleLoadWithStatus = useCallback(
    async (e?: React.ChangeEvent<HTMLInputElement>) => {
      const message = await handleLoad(e);
      setStatusMessage(message);
    },
    [handleLoad, setStatusMessage],
  );

  const handleClearWithStatus = useCallback(() => {
    const message = handleClear();
    setStatusMessage(message);
  }, [handleClear, setStatusMessage]);

  // Physics control handlers with status updates
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

  // UI toggle handlers
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

  return {
    // Entity creation
    handleAddObject,

    // Scene actions
    handleSaveWithStatus,
    handleLoadWithStatus,
    handleClearWithStatus,
    triggerFileLoad,

    // Physics controls
    handlePlayWithStatus,
    handlePauseWithStatus,
    handleStopWithStatus,

    // UI toggles
    toggleAddMenu,
    toggleChat,
    toggleLeftPanel,
  };
};
