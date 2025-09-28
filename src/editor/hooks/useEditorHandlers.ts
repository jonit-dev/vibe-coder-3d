import { useCallback } from 'react';

import { ShapeType } from '../types/shapes';

import { useEntityCreation } from './useEntityCreation';
import { usePhysicsControls } from './usePhysicsControls';
import { useStreamingSceneActions } from './useStreamingSceneActions';

interface IUseEditorHandlersProps {
  setSelectedId: (id: number | null) => void;
  setStatusMessage: (message: string) => void;
  setShowAddMenu: (show: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsChatExpanded: (expanded: boolean) => void;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;
  setIsMaterialsExpanded: (expanded: boolean) => void;
  showAddMenu: boolean;
  isChatExpanded: boolean;
  isLeftPanelCollapsed: boolean;
  isMaterialsExpanded: boolean;
}

export const useEditorHandlers = ({
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
    createTerrain,
    createTree,
    createRock,
    createBush,
    createGrass,
    createWall,
    createCamera,
    createTrapezoid,
    createOctahedron,
    createPrism,
    createPyramid,
    createCapsule,
    createHelix,
    createMobiusStrip,
    createDodecahedron,
    createIcosahedron,
    createTetrahedron,
    createTorusKnot,
    createRamp,
    createStairs,
    createSpiralStairs,
    createStar,
    createHeart,
    createDiamond,
    createTube,
    createCross,
    createCustomModel,
    createDirectionalLight,
    createPointLight,
    createSpotLight,
    createAmbientLight,
  } = useEntityCreation();

  // Scene action hooks
  const { handleSave, handleLoad, handleClear } = useStreamingSceneActions();

  // Physics control hooks
  const { handlePlay, handlePause, handleStop } = usePhysicsControls({
    onStatusMessage: setStatusMessage,
  });

  // Entity creation handler
  const handleAddObject = useCallback(
    async (type: ShapeType | string, modelPath?: string) => {
      try {
        let entity;
        switch (type) {
          case ShapeType.Cube:
            entity = createCube();
            break;
          case ShapeType.Sphere:
            entity = createSphere();
            break;
          case ShapeType.Cylinder:
            entity = createCylinder();
            break;
          case ShapeType.Cone:
            entity = createCone();
            break;
          case ShapeType.Torus:
            entity = createTorus();
            break;
          case ShapeType.Plane:
            entity = createPlane();
            break;
          case ShapeType.Terrain:
            entity = createTerrain();
            break;
          case ShapeType.Tree:
            entity = createTree();
            break;
          case ShapeType.Rock:
            entity = createRock();
            break;
          case ShapeType.Bush:
            entity = createBush();
            break;
          case ShapeType.Grass:
            entity = createGrass();
            break;
          case ShapeType.Wall:
            entity = createWall();
            break;
          case ShapeType.Trapezoid:
            entity = createTrapezoid();
            break;
          case ShapeType.Octahedron:
            entity = createOctahedron();
            break;
          case ShapeType.Prism:
            entity = createPrism();
            break;
          case ShapeType.Pyramid:
            entity = createPyramid();
            break;
          case ShapeType.Capsule:
            entity = createCapsule();
            break;
          case ShapeType.Helix:
            entity = createHelix();
            break;
          case ShapeType.MobiusStrip:
            entity = createMobiusStrip();
            break;
          case ShapeType.Dodecahedron:
            entity = createDodecahedron();
            break;
          case ShapeType.Icosahedron:
            entity = createIcosahedron();
            break;
          case ShapeType.Tetrahedron:
            entity = createTetrahedron();
            break;
          case ShapeType.TorusKnot:
            entity = createTorusKnot();
            break;
          case ShapeType.Ramp:
            entity = createRamp();
            break;
          case ShapeType.Stairs:
            entity = createStairs();
            break;
          case ShapeType.SpiralStairs:
            entity = createSpiralStairs();
            break;
          case ShapeType.Star:
            entity = createStar();
            break;
          case ShapeType.Heart:
            entity = createHeart();
            break;
          case ShapeType.Diamond:
            entity = createDiamond();
            break;
          case ShapeType.Tube:
            entity = createTube();
            break;
          case ShapeType.Cross:
            entity = createCross();
            break;
          case ShapeType.Camera:
            entity = createCamera();
            break;
          case ShapeType.CustomModel:
            if (modelPath) {
              entity = createCustomModel(modelPath);
            } else {
              throw new Error('CustomModel requires a modelPath');
            }
            break;
          case 'DirectionalLight':
            entity = createDirectionalLight();
            break;
          case 'PointLight':
            entity = createPointLight();
            break;
          case 'SpotLight':
            entity = createSpotLight();
            break;
          case 'AmbientLight':
            entity = createAmbientLight();
            break;
          default:
            entity = createEntity(type as string);
            break;
        }

        setSelectedId(entity.id);
        setStatusMessage(`Created ${type} (Entity ${entity.id})`);
        setShowAddMenu(false);
      } catch (error) {
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
      createTerrain,
      createTree,
      createRock,
      createBush,
      createGrass,
      createWall,
      createTrapezoid,
      createOctahedron,
      createPrism,
      createPyramid,
      createCapsule,
      createHelix,
      createMobiusStrip,
      createDodecahedron,
      createIcosahedron,
      createTetrahedron,
      createTorusKnot,
      createRamp,
      createStairs,
      createSpiralStairs,
      createStar,
      createHeart,
      createDiamond,
      createTube,
      createCross,
      createCamera,
      createCustomModel,
      createDirectionalLight,
      createPointLight,
      createSpotLight,
      createAmbientLight,
      setSelectedId,
      setStatusMessage,
      setShowAddMenu,
    ],
  );

  // Scene action handlers with status updates (using legacy methods for status bar)
  // Streaming-aware status methods - use the new streaming actions directly
  const handleSaveWithStatus = useCallback(async () => {
    try {
      await handleSave();
      setStatusMessage('Scene saved successfully');
    } catch (error) {
      setStatusMessage(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [handleSave, setStatusMessage]);

  const handleLoadWithStatus = useCallback(
    async (e?: React.ChangeEvent<HTMLInputElement>) => {
      try {
        await handleLoad(e);
        setStatusMessage('Scene loaded successfully');
      } catch (error) {
        setStatusMessage(
          `Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    [handleLoad, setStatusMessage],
  );

  const handleClearWithStatus = useCallback(() => {
    try {
      handleClear();
      setStatusMessage('Scene cleared successfully');
    } catch (error) {
      setStatusMessage(`Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [handleClear, setStatusMessage]);

  // Dummy triggerFileLoad for backward compatibility
  const triggerFileLoad = useCallback(() => {}, []);

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

  const toggleMaterials = useCallback(
    () => setIsMaterialsExpanded(!isMaterialsExpanded),
    [isMaterialsExpanded, setIsMaterialsExpanded],
  );

  return {
    // Entity creation
    handleAddObject,

    // Scene actions with toasts (new methods)
    handleSave,
    handleLoad,
    handleClear,

    // Scene actions with status messages (legacy methods)
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
    toggleMaterials,
  };
};
