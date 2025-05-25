import { useEffect } from 'react';

import { useEntityCreation } from './useEntityCreation';

// Shape types that can be created in the editor
export type ShapeType = 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane';

interface IUseEditorKeyboardProps {
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  onAddObject: (type: ShapeType) => void;
  onSave: () => void;
  onStatusMessage: (message: string) => void;
}

export const useEditorKeyboard = ({
  selectedId,
  setSelectedId,
  isChatExpanded,
  setIsChatExpanded,
  onAddObject,
  onSave,
  onStatusMessage,
}: IUseEditorKeyboardProps) => {
  const { deleteEntity } = useEntityCreation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Ctrl+N: Add new cube
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        onAddObject('Cube');
      }

      // Ctrl+S: Save scene
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSave();
      }

      // Ctrl+/: Toggle chat
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setIsChatExpanded(!isChatExpanded);
      }

      // Delete: Delete selected entity
      if (e.key === 'Delete' && selectedId != null) {
        e.preventDefault();
        deleteEntity(selectedId);
        onStatusMessage('Entity deleted');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedId,
    isChatExpanded,
    setSelectedId,
    setIsChatExpanded,
    onAddObject,
    onSave,
    onStatusMessage,
    deleteEntity,
  ]);
};
