import React, { useEffect, useRef, useState } from 'react';

import { useECSQuery } from '@core/hooks/useECS';
import { MeshTypeEnum, Transform, destroyEntity } from '@core/lib/ecs';
import { ecsManager } from '@core/lib/ecs-manager';

import { AddObjectMenu } from './AddObjectMenu';
import { HierarchyPanel } from './components/panels/HierarchyPanel/HierarchyPanel';
import { InspectorPanel } from './components/panels/InspectorPanel/InspectorPanel';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';
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
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLDivElement>(null);
  const { exportScene, importScene } = useSceneSerialization();
  // Store the last scene in localStorage with the correct type
  const [savedScene, setSavedScene] = useLocalStorage<ISerializedScene>('lastScene', {
    version: 2,
    entities: [],
  });
  // Track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-load the last saved scene when the editor opens
  useEffect(() => {
    // Only load on first mount and if there's a saved scene with entities
    if (!isInitialized && savedScene && savedScene.entities) {
      try {
        console.log('Loading scene from localStorage:', savedScene);
        importScene(savedScene);
        if (savedScene.entities.length > 0) {
          setStatusMessage(
            `Loaded last saved scene from localStorage (version ${savedScene.version}).`,
          );
        }
      } catch (err) {
        console.error('Failed to load scene from localStorage:', err);
        setStatusMessage('Failed to load last scene. Starting with empty scene.');
      }
      setIsInitialized(true);
    } else if (!isInitialized) {
      console.log('No saved scene found or scene is empty');
      setIsInitialized(true);
    }
  }, [isInitialized, importScene, savedScene, setStatusMessage]);

  useEffect(() => {
    if ((selectedId === null || !entityIds.includes(selectedId)) && entityIds.length > 0) {
      setSelectedId(entityIds[0]);
    }
  }, [selectedId, entityIds, setSelectedId]);

  const handleAddObject = (type: 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane') => {
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
    const entity = ecsManager.createEntity({ meshType });
    setSelectedId(entity);
    setStatusMessage(`Added new ${type}: ${entity}`);
    setShowAddMenu(false);
    console.log('[AddObject] Added entity', { entity, type });
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
    setSelectedId(null);
    setStatusMessage('Scene cleared and localStorage reset.');
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
      if (e.key === 'Delete' && selectedId != null) {
        e.preventDefault();
        destroyEntity(selectedId);
        setSelectedId(null);
        setStatusMessage('Entity deleted');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleAddObject, handleSave, setSelectedId]);

  return (
    <div
      className="w-full h-screen flex flex-col bg-gradient-to-br from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <TopBar
        entityCount={entityIds.length}
        onSave={handleSave}
        onLoad={() => fileInputRef.current?.click()}
        onClear={handleClear}
        onAddObject={() => setShowAddMenu(!showAddMenu)}
      />

      <div ref={addButtonRef} className="hidden" />
      <AddObjectMenu
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
        <HierarchyPanel entityIds={entityIds} />
        {selectedId != null ? (
          <>
            <ViewportPanel entityId={selectedId} />
            <InspectorPanel />
          </>
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
