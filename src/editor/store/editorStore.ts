import { create } from 'zustand';

interface IContextMenuState {
  open: boolean;
  entityId: number | null;
  anchorRef: React.RefObject<HTMLElement> | null;
}

interface IEditorStore {
  // Entity selection state
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;

  // UI state
  contextMenu: IContextMenuState;
  setContextMenu: (state: IContextMenuState) => void;
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;

  // Play mode state
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;

  // Panel visibility (future extension)
  showHierarchy: boolean;
  setShowHierarchy: (show: boolean) => void;
  showInspector: boolean;
  setShowInspector: (show: boolean) => void;
  showViewport: boolean;
  setShowViewport: (show: boolean) => void;
}

export const useEditorStore = create<IEditorStore>((set) => ({
  // Entity selection
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),

  // UI state
  contextMenu: { open: false, entityId: null, anchorRef: null },
  setContextMenu: (state) => set({ contextMenu: state }),
  showAddMenu: false,
  setShowAddMenu: (show) => set({ showAddMenu: show }),

  // Play mode
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  // Panel visibility
  showHierarchy: true,
  setShowHierarchy: (show) => set({ showHierarchy: show }),
  showInspector: true,
  setShowInspector: (show) => set({ showInspector: show }),
  showViewport: true,
  setShowViewport: (show) => set({ showViewport: show }),
}));

// Expose editor store globally for component registry access
// This avoids circular dependency issues
if (typeof window !== 'undefined') {
  (window as any).__editorStore = useEditorStore;
}
