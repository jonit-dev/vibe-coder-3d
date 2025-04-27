import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useECSQuery } from '@core/hooks/useECS';
import {
  MeshTypeEnum,
  Transform,
  createEntity,
  destroyEntity,
  updateMeshType,
} from '@core/lib/ecs';

import { HierarchyPanel } from './components/panels/HierarchyPanel/HierarchyPanel';
import { InspectorPanel } from './components/panels/InspectorPanel/InspectorPanel';
import { ViewportPanel } from './components/panels/ViewportPanel/ViewportPanel';

export interface ITransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export type ShapeType = 'Cube' | 'Sphere';

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
  // Query for all entities with a Transform (could extend to Name, etc.)
  const entityIds = useECSQuery([Transform]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Select first entity if nothing is selected and entities exist
  useEffect(() => {
    if ((selectedId === null || !entityIds.includes(selectedId)) && entityIds.length > 0) {
      setSelectedId(entityIds[0]);
    }
  }, [selectedId, entityIds]);

  // Add new entity (with type)
  const handleAddObject = (type: ShapeType = 'Cube') => {
    const entity = createEntity();
    updateMeshType(entity, type === 'Cube' ? MeshTypeEnum.Cube : MeshTypeEnum.Sphere);
    setSelectedId(entity);
    setStatusMessage(`Added new ${type}: ${entity}`);
    // Logging for debugging
    console.log('[AddObject] Added entity', { entity, type });
    // Log current entity IDs
    setTimeout(() => {
      const currentIds = useECSQuery([Transform]);
      console.log('[AddObject] Current entity IDs after add:', currentIds);
    }, 100);
  };

  // Update transform (for now, just position)
  const handleTransformChange = useCallback(
    (transform: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }) => {
      if (selectedId == null) return;
      // Update ECS Transform directly
      Transform.position[selectedId][0] = transform.position[0];
      Transform.position[selectedId][1] = transform.position[1];
      Transform.position[selectedId][2] = transform.position[2];
      Transform.rotation[selectedId][0] = transform.rotation[0];
      Transform.rotation[selectedId][1] = transform.rotation[1];
      Transform.rotation[selectedId][2] = transform.rotation[2];
      Transform.scale[selectedId][0] = transform.scale[0];
      Transform.scale[selectedId][1] = transform.scale[1];
      Transform.scale[selectedId][2] = transform.scale[2];
      Transform.needsUpdate[selectedId] = 1;
      setStatusMessage(`Transform updated: [${transform.position.join(', ')}]`);
    },
    [selectedId],
  );

  // Save/load/clear logic will be refactored in later steps
  const handleSave = () => setStatusMessage('Save not implemented (ECS)');
  const handleLoad = () => setStatusMessage('Load not implemented (ECS)');
  const handleClear = () => setStatusMessage('Clear not implemented (ECS)');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+N: New Object
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleAddObject();
      }

      // Ctrl+S: Save Scene
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Delete: Remove selected object
      if (e.key === 'Delete' && selectedId != null) {
        e.preventDefault();
        destroyEntity(selectedId);
        setSelectedId(null);
        setStatusMessage('Entity deleted');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleAddObject, handleSave]);

  // Add a useEffect to close the menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addButtonRef.current && !addButtonRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  return (
    <div className="w-full h-screen flex flex-col bg-[#232323] text-white">
      <header className="p-2 bg-[#1a1a1a] border-b border-[#222] flex items-center shadow-sm justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-bold tracking-wide mr-4">Game Editor</h1>
          <div className="text-xs bg-blue-900/30 px-2 py-1 rounded text-blue-200">
            {entityIds.length} object{entityIds.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            ref={addButtonRef}
            className="btn btn-success btn-sm font-semibold normal-case"
            onClick={() => handleAddObject('Cube')}
            title="Add Object (Ctrl+N)"
            type="button"
          >
            + Add Object
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-xs font-semibold"
            onClick={handleSave}
            title="Save Scene (Ctrl+S)"
          >
            Save Scene
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-xs font-semibold"
            onClick={() => fileInputRef.current?.click()}
            title="Load Scene"
          >
            Load Scene
          </button>
          <button
            className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-xs font-semibold"
            onClick={handleClear}
            title="Clear Scene"
          >
            Clear
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleLoad}
          />
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <HierarchyPanel
          entityIds={entityIds}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
        {selectedId != null ? (
          <>
            <ViewportPanel entityId={selectedId} />
            <InspectorPanel selectedEntity={selectedId} onTransformChange={handleTransformChange} />
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
      <footer className="h-6 bg-[#1a1a1a] border-t border-[#222] flex items-center text-xs px-3 justify-between text-gray-400">
        <div>{statusMessage}</div>
        <div className="flex gap-3">
          <div title="Add Object" className="opacity-70">
            Ctrl+N
          </div>
          <div title="Save Scene" className="opacity-70">
            Ctrl+S
          </div>
          <div title="Delete Object" className="opacity-70">
            Delete
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Editor;
