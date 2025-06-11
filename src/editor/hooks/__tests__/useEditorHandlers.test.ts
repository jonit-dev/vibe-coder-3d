import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorHandlers } from '../useEditorHandlers';
import { useEntityCreation } from '../useEntityCreation';
import { usePhysicsControls } from '../usePhysicsControls';
import { useSceneActions } from '../useSceneActions';

// Mock dependencies
vi.mock('../useEntityCreation', () => ({
  useEntityCreation: vi.fn(),
}));

vi.mock('../usePhysicsControls', () => ({
  usePhysicsControls: vi.fn(),
}));

vi.mock('../useSceneActions', () => ({
  useSceneActions: vi.fn(),
}));

describe('useEditorHandlers', () => {
  // Mock functions
  const mockSetSelectedId = vi.fn();
  const mockSetStatusMessage = vi.fn();
  const mockSetShowAddMenu = vi.fn();
  const mockSetIsPlaying = vi.fn();
  const mockSetIsChatExpanded = vi.fn();
  const mockSetIsLeftPanelCollapsed = vi.fn();

  // Mock entity creation functions
  const mockCreateEntity = vi.fn().mockReturnValue({ id: 999, name: 'Generic Entity' });
  const mockCreateCube = vi.fn().mockReturnValue({ id: 1, name: 'Cube 0' });
  const mockCreateSphere = vi.fn().mockReturnValue({ id: 2, name: 'Sphere 0' });
  const mockCreateCylinder = vi.fn().mockReturnValue({ id: 3, name: 'Cylinder 0' });
  const mockCreateCone = vi.fn().mockReturnValue({ id: 4, name: 'Cone 0' });
  const mockCreateTorus = vi.fn().mockReturnValue({ id: 5, name: 'Torus 0' });
  const mockCreatePlane = vi.fn().mockReturnValue({ id: 6, name: 'Plane 0' });
  const mockCreateCamera = vi.fn().mockReturnValue({ id: 7, name: 'Camera 0' });
  const mockCreateCustomModel = vi.fn().mockReturnValue({ id: 8, name: 'Model 0' });

  // Mock physics controls
  const mockHandlePlay = vi.fn();
  const mockHandlePause = vi.fn();
  const mockHandleStop = vi.fn();

  // Mock scene actions
  const mockHandleSave = vi.fn();
  const mockHandleLoad = vi.fn();
  const mockHandleClear = vi.fn();
  const mockTriggerFileLoad = vi.fn();

  const defaultProps = {
    setSelectedId: mockSetSelectedId,
    setStatusMessage: mockSetStatusMessage,
    setShowAddMenu: mockSetShowAddMenu,
    setIsPlaying: mockSetIsPlaying,
    setIsChatExpanded: mockSetIsChatExpanded,
    setIsLeftPanelCollapsed: mockSetIsLeftPanelCollapsed,
    showAddMenu: false,
    isChatExpanded: false,
    isLeftPanelCollapsed: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup entity creation mock
    (useEntityCreation as any).mockReturnValue({
      createEntity: mockCreateEntity,
      createCube: mockCreateCube,
      createSphere: mockCreateSphere,
      createCylinder: mockCreateCylinder,
      createCone: mockCreateCone,
      createTorus: mockCreateTorus,
      createPlane: mockCreatePlane,
      createCamera: mockCreateCamera,
      createCustomModel: mockCreateCustomModel,
    });

    // Setup physics controls mock
    (usePhysicsControls as any).mockReturnValue({
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
    });

    // Setup scene actions mock
    (useSceneActions as any).mockReturnValue({
      handleSave: mockHandleSave,
      handleLoad: mockHandleLoad,
      handleClear: mockHandleClear,
      handleSaveLegacy: vi.fn().mockReturnValue('Saved successfully'),
      handleLoadLegacy: vi.fn().mockResolvedValue('Loaded successfully'),
      handleClearLegacy: vi.fn().mockReturnValue('Cleared successfully'),
      triggerFileLoad: mockTriggerFileLoad,
    });
  });

  describe('handleAddObject', () => {
    it('should create cube when type is Cube', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Cube');
      });

      expect(mockCreateCube).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledWith(1);
      expect(mockSetStatusMessage).toHaveBeenCalledWith('Created Cube (Entity 1)');
      expect(mockSetShowAddMenu).toHaveBeenCalledWith(false);
    });

    it('should create sphere when type is Sphere', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Sphere');
      });

      expect(mockCreateSphere).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledWith(2);
      expect(mockSetStatusMessage).toHaveBeenCalledWith('Created Sphere (Entity 2)');
    });

    it('should create cylinder when type is Cylinder', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Cylinder');
      });

      expect(mockCreateCylinder).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledWith(3);
    });

    it('should create cone when type is Cone', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Cone');
      });

      expect(mockCreateCone).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledWith(4);
    });

    it('should create torus when type is Torus', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Torus');
      });

      expect(mockCreateTorus).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledWith(5);
    });

    it('should create plane when type is Plane', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Plane');
      });

      expect(mockCreatePlane).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledWith(6);
    });

    it('should create camera when type is Camera', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Camera');
      });

      expect(mockCreateCamera).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledWith(7);
    });

    it('should create custom model when type is CustomModel with modelPath', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));
      const modelPath = '/assets/models/test.glb';

      await act(async () => {
        await result.current.handleAddObject('CustomModel', modelPath);
      });

      expect(mockCreateCustomModel).toHaveBeenCalledWith(modelPath);
      expect(mockSetSelectedId).toHaveBeenCalledWith(8);
      expect(mockSetStatusMessage).toHaveBeenCalledWith('Created CustomModel (Entity 8)');
    });

    it('should throw error when CustomModel type is used without modelPath', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('CustomModel');
      });

      expect(mockCreateCustomModel).not.toHaveBeenCalled();
      expect(mockSetStatusMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create CustomModel'),
      );
    });

    it('should create generic entity for unknown types', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('UnknownType' as any);
      });

      expect(mockCreateEntity).toHaveBeenCalledWith('UnknownType');
    });

    it('should handle creation errors gracefully', async () => {
      mockCreateCube.mockImplementationOnce(() => {
        throw new Error('Creation failed');
      });

      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Cube');
      });

      expect(mockSetStatusMessage).toHaveBeenCalledWith('Failed to create Cube: Creation failed');
      expect(mockSetSelectedId).not.toHaveBeenCalled();
    });

    it('should handle unknown errors gracefully', async () => {
      mockCreateSphere.mockImplementationOnce(() => {
        throw 'Unknown error';
      });

      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Sphere');
      });

      expect(mockSetStatusMessage).toHaveBeenCalledWith('Failed to create Sphere: Unknown error');
    });
  });

  describe('physics controls', () => {
    it('should handle play action', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.handlePlayWithStatus();
      });

      expect(mockSetIsPlaying).toHaveBeenCalledWith(true);
      expect(mockHandlePlay).toHaveBeenCalledTimes(1);
    });

    it('should handle pause action', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.handlePauseWithStatus();
      });

      expect(mockSetIsPlaying).toHaveBeenCalledWith(false);
      expect(mockHandlePause).toHaveBeenCalledTimes(1);
    });

    it('should handle stop action', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.handleStopWithStatus();
      });

      expect(mockSetIsPlaying).toHaveBeenCalledWith(false);
      expect(mockHandleStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('UI toggles', () => {
    it('should toggle add menu', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.toggleAddMenu();
      });

      expect(mockSetShowAddMenu).toHaveBeenCalledWith(true);
    });

    it('should toggle add menu when already open', () => {
      const propsWithOpenMenu = { ...defaultProps, showAddMenu: true };
      const { result } = renderHook(() => useEditorHandlers(propsWithOpenMenu));

      act(() => {
        result.current.toggleAddMenu();
      });

      expect(mockSetShowAddMenu).toHaveBeenCalledWith(false);
    });

    it('should toggle chat', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.toggleChat();
      });

      expect(mockSetIsChatExpanded).toHaveBeenCalledWith(true);
    });

    it('should toggle chat when already expanded', () => {
      const propsWithExpandedChat = { ...defaultProps, isChatExpanded: true };
      const { result } = renderHook(() => useEditorHandlers(propsWithExpandedChat));

      act(() => {
        result.current.toggleChat();
      });

      expect(mockSetIsChatExpanded).toHaveBeenCalledWith(false);
    });

    it('should toggle left panel', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.toggleLeftPanel();
      });

      expect(mockSetIsLeftPanelCollapsed).toHaveBeenCalledWith(true);
    });

    it('should toggle left panel when already collapsed', () => {
      const propsWithCollapsedPanel = { ...defaultProps, isLeftPanelCollapsed: true };
      const { result } = renderHook(() => useEditorHandlers(propsWithCollapsedPanel));

      act(() => {
        result.current.toggleLeftPanel();
      });

      expect(mockSetIsLeftPanelCollapsed).toHaveBeenCalledWith(false);
    });
  });

  describe('scene actions', () => {
    it('should handle save action with status', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.handleSaveWithStatus();
      });

      expect(mockSetStatusMessage).toHaveBeenCalledWith('Saved successfully');
    });

    it('should handle load action with status', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleLoadWithStatus();
      });

      expect(mockSetStatusMessage).toHaveBeenCalledWith('Loaded successfully');
    });

    it('should handle clear action with status', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      act(() => {
        result.current.handleClearWithStatus();
      });

      expect(mockSetStatusMessage).toHaveBeenCalledWith('Cleared successfully');
    });

    it('should provide direct access to new scene actions', () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      expect(result.current.handleSave).toBe(mockHandleSave);
      expect(result.current.handleLoad).toBe(mockHandleLoad);
      expect(result.current.handleClear).toBe(mockHandleClear);
      expect(result.current.triggerFileLoad).toBe(mockTriggerFileLoad);
    });
  });

  describe('multiple entity creation', () => {
    it('should handle rapid entity creation', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Cube');
        await result.current.handleAddObject('Sphere');
        await result.current.handleAddObject('Cylinder');
      });

      expect(mockCreateCube).toHaveBeenCalledTimes(1);
      expect(mockCreateSphere).toHaveBeenCalledTimes(1);
      expect(mockCreateCylinder).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedId).toHaveBeenCalledTimes(3);
      expect(mockSetShowAddMenu).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty model path for CustomModel', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('CustomModel', '');
      });

      expect(mockCreateCustomModel).not.toHaveBeenCalled();
      expect(mockSetStatusMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create CustomModel'),
      );
    });

    it('should handle whitespace-only model path', async () => {
      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('CustomModel', '   ');
      });

      // Since our implementation doesn't trim, this would call createCustomModel
      // but in a real implementation, you might want to trim whitespace
      expect(mockCreateCustomModel).toHaveBeenCalledWith('   ');
    });
  });

  describe('component creation with advanced shapes', () => {
    it('should create all advanced geometric shapes', async () => {
      const mockCreateTrapezoid = vi.fn().mockReturnValue({ id: 9, name: 'Trapezoid 0' });
      const mockCreateOctahedron = vi.fn().mockReturnValue({ id: 10, name: 'Octahedron 0' });
      const mockCreatePrism = vi.fn().mockReturnValue({ id: 11, name: 'Prism 0' });
      const mockCreatePyramid = vi.fn().mockReturnValue({ id: 12, name: 'Pyramid 0' });
      const mockCreateCapsule = vi.fn().mockReturnValue({ id: 13, name: 'Capsule 0' });

      (useEntityCreation as any).mockReturnValue({
        ...useEntityCreation(),
        createTrapezoid: mockCreateTrapezoid,
        createOctahedron: mockCreateOctahedron,
        createPrism: mockCreatePrism,
        createPyramid: mockCreatePyramid,
        createCapsule: mockCreateCapsule,
      });

      const { result } = renderHook(() => useEditorHandlers(defaultProps));

      await act(async () => {
        await result.current.handleAddObject('Trapezoid' as any);
        await result.current.handleAddObject('Octahedron' as any);
        await result.current.handleAddObject('Prism' as any);
        await result.current.handleAddObject('Pyramid' as any);
        await result.current.handleAddObject('Capsule' as any);
      });

      expect(mockCreateTrapezoid).toHaveBeenCalledTimes(1);
      expect(mockCreateOctahedron).toHaveBeenCalledTimes(1);
      expect(mockCreatePrism).toHaveBeenCalledTimes(1);
      expect(mockCreatePyramid).toHaveBeenCalledTimes(1);
      expect(mockCreateCapsule).toHaveBeenCalledTimes(1);
    });
  });
});
