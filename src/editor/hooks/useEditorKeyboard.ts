import { useEffect } from 'react';

import type { ShapeType } from '../types/shapes';

import { useEntityCreation } from './useEntityCreation';
import { useGroupSelection } from './useGroupSelection';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

interface IUseEditorKeyboardProps {
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  onAddObject: (type: ShapeType) => void;
  onSave: () => void;
  onStatusMessage: (message: string) => void;
  // Gizmo mode handling
  gizmoMode?: GizmoMode;
  setGizmoMode?: (mode: GizmoMode) => void;
}

export const useEditorKeyboard = ({
  selectedId,
  setSelectedId,
  isChatExpanded,
  setIsChatExpanded,
  onAddObject,
  onSave,
  onStatusMessage,
  gizmoMode, // Currently unused but kept for future extensibility
  setGizmoMode,
}: IUseEditorKeyboardProps) => {
  const { deleteEntity } = useEntityCreation();
  const groupSelection = useGroupSelection();

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

      // Delete: Delete selected entities (supports group selection)
      if (e.key === 'Delete') {
        e.preventDefault();
        const selectionInfo = groupSelection.getSelectionInfo();

        if (selectionInfo.count > 0) {
          // Delete all selected entities
          if (selectionInfo.ids) {
            selectionInfo.ids.forEach((id: number) => {
              deleteEntity(id);
            });
          }
          groupSelection.clearSelection();
          onStatusMessage(
            selectionInfo.count === 1
              ? 'Entity deleted'
              : `${selectionInfo.count} entities deleted`,
          );
        } else if (selectedId != null) {
          // Fallback to single selection if no group selection
          deleteEntity(selectedId);
          onStatusMessage('Entity deleted');
        }
      }

      // Ctrl+A: Select all entities
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        // This would require access to all entity IDs - we'll implement this later
        onStatusMessage('Select all (not implemented yet)');
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        groupSelection.clearSelection();
        onStatusMessage('Selection cleared');
      }

      // Gizmo mode shortcuts (only when entity is selected and setGizmoMode is provided)
      if (selectedId != null && setGizmoMode) {
        // W: Move tool
        if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          setGizmoMode('translate');
        }

        // E: Rotate tool
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          setGizmoMode('rotate');
        }

        // R: Scale tool
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setGizmoMode('scale');
        }
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
    setGizmoMode,
    gizmoMode,
    groupSelection,
  ]);
};
