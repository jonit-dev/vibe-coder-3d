import React, { useCallback, useEffect, useRef, useState } from 'react';

import HierarchyPanel from './components/HierarchyPanel';
import InspectorPanel from './components/InspectorPanel';
import ViewportPanel from './components/ViewportPanel';
import { useLocalStorage } from './components/useLocalStorage';

export interface ITransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface ISceneObject {
  id: string;
  name: string;
  components: {
    Transform: ITransform;
    Mesh: string;
    Material: string;
  };
}

const Editor: React.FC = () => {
  // Use localStorage for persisting objects
  const [objects, setObjects] = useLocalStorage<ISceneObject[]>('editor-scene', []);
  const [selectedId, setSelectedId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedObject = objects.find((obj) => obj.id === selectedId);

  // Select first object if nothing is selected and objects exist
  useEffect(() => {
    if (!selectedId && objects.length > 0) {
      setSelectedId(objects[0].id);
    }
  }, [selectedId, objects]);

  // Add new object for testing
  const handleAddObject = () => {
    const newId = Date.now().toString();
    const newObj: ISceneObject = {
      id: newId,
      name: `Object${objects.length + 1}`,
      components: {
        Transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        Mesh: 'Cube',
        Material: 'Default',
      },
    };
    setObjects((prev) => [...prev, newObj]);
    setSelectedId(newId);
    setStatusMessage(`Added new object: ${newObj.name}`);
  };

  // Use useCallback to prevent new function references on every render
  const handleTransformChange = useCallback(
    (transform: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }) => {
      if (!selectedId) return;

      setObjects((prev) =>
        prev.map((obj) =>
          obj.id === selectedId
            ? {
                ...obj,
                components: {
                  ...obj.components,
                  Transform: transform,
                },
              }
            : obj,
        ),
      );
    },
    [selectedId, setObjects],
  );

  // Save scene as JSON
  const handleSave = () => {
    const dataStr = JSON.stringify(objects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Scene saved to file');
  };

  // Load scene from JSON
  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loaded = JSON.parse(event.target?.result as string);
        if (Array.isArray(loaded)) {
          setObjects(loaded);
          setSelectedId(loaded[0]?.id || '');
          setStatusMessage(`Loaded scene with ${loaded.length} objects`);
        }
      } catch (err) {
        alert('Failed to load scene: Invalid JSON');
        setStatusMessage('Error: Failed to load scene');
      }
    };
    reader.readAsText(file);
  };

  // Clear scene
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the scene?')) {
      setObjects([]);
      setSelectedId('');
      setStatusMessage('Scene cleared');
    }
  };

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
      if (e.key === 'Delete' && selectedId) {
        e.preventDefault();
        setObjects((prev) => prev.filter((obj) => obj.id !== selectedId));
        setSelectedId('');
        setStatusMessage('Object deleted');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, setObjects, handleAddObject, handleSave]);

  return (
    <div className="w-full h-screen flex flex-col bg-[#232323] text-white">
      <header className="p-2 bg-[#1a1a1a] border-b border-[#222] flex items-center shadow-sm justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-bold tracking-wide mr-4">Game Editor</h1>
          <div className="text-xs bg-blue-900/30 px-2 py-1 rounded text-blue-200">
            {objects.length} object{objects.length !== 1 ? 's' : ''}
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
        <HierarchyPanel objects={objects} selectedId={selectedId} setSelectedId={setSelectedId} />
        {selectedObject ? (
          <>
            <ViewportPanel selectedObject={selectedObject} />
            <InspectorPanel
              selectedObject={selectedObject}
              onTransformChange={handleTransformChange}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            <div className="max-w-md text-center px-4">
              <div className="mb-2">No object selected or scene is empty.</div>
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
