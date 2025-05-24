import { useRef } from 'react';

import { useLocalStorage } from './useLocalStorage';
import { ISerializedScene, useSceneSerialization } from './useSceneSerialization';

export const useSceneActions = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportScene, importScene } = useSceneSerialization();
  const [savedScene, setSavedScene] = useLocalStorage<ISerializedScene>('lastScene', {
    version: 2,
    entities: [],
  });

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

  const handleSave = (): string => {
    try {
      const scene = exportScene();
      // Save to file
      downloadJSON(scene, 'scene.json');
      // Also save to localStorage
      setSavedScene(scene);
      return 'Scene saved to file and localStorage.';
    } catch (e) {
      console.error('Save error:', e);
      return 'Failed to save scene.';
    }
  };

  const handleLoad = (e?: React.ChangeEvent<HTMLInputElement>): Promise<string> => {
    return new Promise((resolve) => {
      const file = e?.target?.files?.[0];
      if (!file) {
        resolve('No file selected.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          importScene(json);
          // Update localStorage with the loaded scene
          setSavedScene(json);
          resolve('Scene loaded from file and saved to localStorage.');
        } catch (err) {
          console.error('Load error:', err);
          resolve('Failed to load scene.');
        }
      };
      reader.readAsText(file);
    });
  };

  const handleClear = (): string => {
    try {
      // Clear the ECS world
      const emptyScene = { version: 2, entities: [] };
      importScene(emptyScene);
      // Also clear localStorage
      setSavedScene(emptyScene);
      return 'Scene cleared - Empty scene loaded.';
    } catch (e) {
      console.error('Clear error:', e);
      return 'Failed to clear scene.';
    }
  };

  const triggerFileLoad = () => {
    fileInputRef.current?.click();
  };

  return {
    fileInputRef,
    savedScene,
    setSavedScene,
    handleSave,
    handleLoad,
    handleClear,
    triggerFileLoad,
    importScene,
  };
};
