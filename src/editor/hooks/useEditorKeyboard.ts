import { useEffect } from 'react';

import { destroyEntity } from '@core/lib/ecs';

import { ShapeType } from './useEntityCreation';

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
        destroyEntity(selectedId);
        setSelectedId(null);
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
  ]);
};
