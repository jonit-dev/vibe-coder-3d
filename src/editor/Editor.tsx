import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useECSQuery } from '@core/hooks/useECS';
import {
  MeshTypeEnum,
  Transform,
  createEntity,
  destroyEntity,
  updateMeshType,
} from '@core/lib/ecs';

import HierarchyPanel from './components/hierarchy-panel/HierarchyPanel';
import InspectorPanel from './components/inspector/InspectorPanel';
import ViewportPanel from './components/viewport-panel/ViewportPanel';

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

  // Select first entity if nothing is selected and entities exist
  useEffect(() => {
    if ((selectedId === null || !entityIds.includes(selectedId)) && entityIds.length > 0) {
      setSelectedId(entityIds[0]);
    }
  }, [selectedId, entityIds]);

  // Add new entity (Cube by default)
  const handleAddObject = () => {
    const entity = createEntity();
    // Ensure the mesh type is set to cube explicitly
    updateMeshType(entity, MeshTypeEnum.Cube);
    setSelectedId(entity);
    setStatusMessage(`Added new entity: ${entity}`);
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
            className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-xs font-semibold"
            onClick={handleAddObject}
            title="Add Object (Ctrl+N)"
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
            <InspectorPanel entityId={selectedId} onTransformChange={handleTransformChange} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            <div className="max-w-md text-center px-4">
              <div className="mb-2">No entity selected or scene is empty.</div>
              <button
                className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-sm mt-2"
                onClick={handleAddObject}
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
