import React, { useEffect, useRef, useState } from 'react';

import { useECSQuery } from '@core/hooks/useECS';
import { MeshTypeEnum, Transform, destroyEntity } from '@core/lib/ecs';
import { ecsManager } from '@core/lib/ecs-manager';

import { EnhancedAddObjectMenu } from './EnhancedAddObjectMenu';
import { HierarchyPanelContent } from './components/panels/HierarchyPanel/HierarchyPanelContent';
import { InspectorPanelContent } from './components/panels/InspectorPanel/InspectorPanelContent';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';
import { EditorPhysicsIntegration } from './components/physics/EditorPhysicsIntegration';
import { RightSidebarChat } from './components/ui/RightSidebarChat';
import { StackedLeftPanel } from './components/ui/StackedLeftPanel';
import { StatusBar } from './components/ui/StatusBar';
import { TopBar } from './components/ui/TopBar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ISerializedScene, useSceneSerialization } from './hooks/useSceneSerialization';
import { useEditorStore } from './store/editorStore';

export interface ITransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export type ShapeType = 'Cube' | 'Sphere' | 'Plane' | 'Cylinder' | 'Cone' | 'Torus';

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
  const entityIds = useECSQuery([Transform]);
  const selectedId = useEditorStore((s) => s.selectedId);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const showAddMenu = useEditorStore((s) => s.showAddMenu);
  const setShowAddMenu = useEditorStore((s) => s.setShowAddMenu);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { exportScene, importScene } = useSceneSerialization();
  // Store the last scene in localStorage with the correct type
  const [savedScene, setSavedScene] = useLocalStorage<ISerializedScene>('lastScene', {
    version: 2,
    entities: [],
  });
  // Track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to create a default scene with a plane
  const createDefaultScene = () => {
    console.log('Creating default scene with plane - current entities:', entityIds.length);

    // Prevent creating multiple grounds if entities already exist
    if (entityIds.length > 0) {
      console.log('Scene already has entities, skipping default scene creation');
      return;
    }

    const planeEntity = ecsManager.createEntity({
      meshType: MeshTypeEnum.Plane,
      position: [0, 0, 0], // Position at origin
      rotation: [-90, 0, 0], // Rotate to be horizontal (planes are vertical by default)
      scale: [10, 10, 10], // Proportional scale for all dimensions
      color: [0.8, 0.8, 0.8], // White/light gray color
      name: 'Ground',
    });

    // Set up default physics for the ground plane
    const setEntityRigidBody = useEditorStore.getState().setEntityRigidBody;
    setEntityRigidBody(planeEntity, {
      enabled: true,
      bodyType: 'fixed',
      mass: 1,
      gravityScale: 1,
      canSleep: true,
      linearDamping: 0.01,
      angularDamping: 0.01,
      initialVelocity: [0, 0, 0],
      initialAngularVelocity: [0, 0, 0],
      material: {
        friction: 0.7,
        restitution: 0.1,
        density: 1,
      },
    });

    setSelectedId(planeEntity);
    setStatusMessage('Created new scene with default ground plane.');
  };

  // Auto-load the last saved scene when the editor opens
  useEffect(() => {
    if (isInitialized) return;

    console.log(
      'Initialization effect running - entityIds:',
      entityIds.length,
      'savedScene:',
      savedScene,
    );

    // Only load on first mount and if there's a saved scene with entities
    if (savedScene && savedScene.entities && savedScene.entities.length > 0) {
      try {
        console.log('Loading scene from localStorage:', savedScene);
        importScene(savedScene);
        setStatusMessage(
          `Loaded last saved scene from localStorage (version ${savedScene.version}).`,
        );
      } catch (err) {
        console.error('Failed to load scene from localStorage:', err);
        setStatusMessage('Failed to load last scene. Starting with default scene.');
        createDefaultScene();
      }
    } else {
      console.log('No saved scene found or scene is empty, creating default scene');
      createDefaultScene();
    }
    setIsInitialized(true);
  }, [isInitialized, importScene, savedScene]);

  useEffect(() => {
    if ((selectedId === null || !entityIds.includes(selectedId)) && entityIds.length > 0) {
      setSelectedId(entityIds[0]);
    }
  }, [selectedId, entityIds, setSelectedId]);

  const handleAddObject = async (
    type: 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane',
  ) => {
    let meshType: MeshTypeEnum;
    switch (type) {
      case 'Cube':
        meshType = MeshTypeEnum.Cube;
        break;
      case 'Sphere':
        meshType = MeshTypeEnum.Sphere;
        break;
      case 'Cylinder':
        meshType = MeshTypeEnum.Cylinder;
        break;
      case 'Cone':
        meshType = MeshTypeEnum.Cone;
        break;
      case 'Torus':
        meshType = MeshTypeEnum.Torus;
        break;
      case 'Plane':
        meshType = MeshTypeEnum.Plane;
        break;
      default:
        meshType = MeshTypeEnum.Cube;
    }

    try {
      // Use physics entity archetype by default for new objects (except plane which should be static)
      if (type === 'Plane') {
        const entity = ecsManager.createEntity({ meshType });
        setSelectedId(entity);
        setStatusMessage(`Added new ${type}: ${entity}`);
      } else {
        const { ArchetypeManager } = await import('@core/index');

        // Debug: Check what archetypes are available
        const availableArchetypes = ArchetypeManager.listArchetypes();
        console.log(
          'Available archetypes:',
          availableArchetypes.map((a) => a.id),
        );

        // Check if physics-entity archetype exists
        const physicsArchetype = ArchetypeManager.getArchetype('physics-entity');
        if (!physicsArchetype) {
          console.warn('physics-entity archetype not found, falling back to basic-entity');

          // Try basic-entity as fallback
          const basicArchetype = ArchetypeManager.getArchetype('basic-entity');
          if (basicArchetype) {
            const entity = await ArchetypeManager.createEntity('basic-entity', {
              meshType: { type: meshType },
            });
            setSelectedId(entity);
            setStatusMessage(`Added new ${type}: ${entity} (basic entity)`);
          } else {
            throw new Error('No archetypes available');
          }
        } else {
          const entity = await ArchetypeManager.createEntity('physics-entity', {
            meshType: { type: meshType },
          });
          setSelectedId(entity);
          setStatusMessage(`Added new physics-enabled ${type}: ${entity}`);
        }
      }
    } catch (error) {
      console.error('Failed to create entity:', error);
      // Fallback to basic entity creation
      const entity = ecsManager.createEntity({ meshType });
      setSelectedId(entity);
      setStatusMessage(`Added new ${type}: ${entity} (fallback)`);
    }

    setShowAddMenu(false);
    console.log('[AddObject] Added entity', { type });
    console.log('[AddObject] Current entity IDs before update:', entityIds);
  };

  // Helper to trigger download
  const downloadJSON = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    try {
      const scene = exportScene();
      // Save to file
      downloadJSON(scene, 'scene.json');
      // Also save to localStorage
      setSavedScene(scene);
      setStatusMessage('Scene saved to file and localStorage.');
    } catch (e) {
      setStatusMessage('Failed to save scene.');
      console.error('Save error:', e);
    }
  };

  const handleLoad = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importScene(json);
        // Update localStorage with the loaded scene
        setSavedScene(json);
        setStatusMessage('Scene loaded from file and saved to localStorage.');
      } catch (err) {
        setStatusMessage('Failed to load scene.');
        console.error('Load error:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    // Clear the ECS world
    const emptyScene = { version: 2, entities: [] };
    importScene(emptyScene);
    // Also clear localStorage
    setSavedScene(emptyScene);
    // Create default scene with plane
    createDefaultScene();
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setStatusMessage('Physics simulation started');
  };

  const handlePause = () => {
    setIsPlaying(false);
    setStatusMessage('Physics simulation paused');
  };

  const handleStop = () => {
    setIsPlaying(false);
    setStatusMessage('Physics simulation stopped');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleAddObject('Cube');
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setIsChatExpanded(!isChatExpanded);
      }
      if (e.key === 'Delete' && selectedId != null) {
        e.preventDefault();
        destroyEntity(selectedId);
        setSelectedId(null);
        setStatusMessage('Entity deleted');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleAddObject, handleSave, setSelectedId, isChatExpanded]);

  return (
    <div
      className="w-full h-screen flex flex-col bg-gradient-to-br from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Physics Integration - handles play/pause physics state */}
      <EditorPhysicsIntegration />

      <TopBar
        entityCount={entityIds.length}
        onSave={handleSave}
        onLoad={() => fileInputRef.current?.click()}
        onClear={handleClear}
        onAddObject={() => setShowAddMenu(!showAddMenu)}
        addButtonRef={addButtonRef}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
        isChatOpen={isChatExpanded}
      />

      <EnhancedAddObjectMenu
        anchorRef={addButtonRef as React.RefObject<HTMLElement>}
        onAdd={handleAddObject}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleLoad}
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
                className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-sm mt-2"
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
