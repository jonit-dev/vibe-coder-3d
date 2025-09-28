import { create } from 'zustand';

interface IContextMenuState {
  open: boolean;
  entityId: number | null;
  anchorRef: React.RefObject<HTMLElement> | null;
}

interface IPerformanceMetrics {
  averageFPS: number;
  frameTime: number;
  renderCount: number;
}

interface IEditorStore {
  // Entity selection state
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  addToSelection: (id: number) => void;
  removeFromSelection: (id: number) => void;
  toggleSelection: (id: number) => void;
  clearSelection: () => void;

  // Entity list cache
  entityIds: number[];
  setEntityIds: (ids: number[]) => void;

  // UI state
  contextMenu: IContextMenuState;
  setContextMenu: (state: IContextMenuState) => void;
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;

  // Status and messaging
  statusMessage: string;
  setStatusMessage: (message: string) => void;

  // Panel states
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  isLeftPanelCollapsed: boolean;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;
  isMaterialsExpanded: boolean;
  setIsMaterialsExpanded: (expanded: boolean) => void;

  // Performance monitoring
  performanceMetrics: IPerformanceMetrics;
  setPerformanceMetrics: (metrics: IPerformanceMetrics) => void;

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

export const useEditorStore = create<IEditorStore>((set, get) => ({
  // Entity selection
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids, selectedId: ids.length > 0 ? ids[0] : null }),
  addToSelection: (id) => {
    const { selectedIds } = get();
    if (!selectedIds.includes(id)) {
      const newSelectedIds = [...selectedIds, id];
      set({ selectedIds: newSelectedIds, selectedId: newSelectedIds[0] });
    }
  },
  removeFromSelection: (id) => {
    const { selectedIds } = get();
    const newSelectedIds = selectedIds.filter((existingId) => existingId !== id);
    set({
      selectedIds: newSelectedIds,
      selectedId: newSelectedIds.length > 0 ? newSelectedIds[0] : null,
    });
  },
  toggleSelection: (id) => {
    const { selectedIds } = get();
    if (selectedIds.includes(id)) {
      get().removeFromSelection(id);
    } else {
      get().addToSelection(id);
    }
  },
  clearSelection: () => set({ selectedIds: [], selectedId: null }),

  // Entity list cache
  entityIds: [],
  setEntityIds: (ids) => set({ entityIds: ids }),

  // UI state
  contextMenu: { open: false, entityId: null, anchorRef: null },
  setContextMenu: (state) => set({ contextMenu: state }),
  showAddMenu: false,
  setShowAddMenu: (show) => set({ showAddMenu: show }),

  // Status and messaging
  statusMessage: 'Ready',
  setStatusMessage: (message) => set({ statusMessage: message }),

  // Panel states
  isChatExpanded: false,
  setIsChatExpanded: (expanded) => set({ isChatExpanded: expanded }),
  isLeftPanelCollapsed: false,
  setIsLeftPanelCollapsed: (collapsed) => set({ isLeftPanelCollapsed: collapsed }),
  isMaterialsExpanded: false,
  setIsMaterialsExpanded: (expanded) => set({ isMaterialsExpanded: expanded }),

  // Performance monitoring
  performanceMetrics: { averageFPS: 60, frameTime: 0, renderCount: 0 },
  setPerformanceMetrics: (metrics) => set({ performanceMetrics: metrics }),

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

// Individual selectors to prevent infinite loops - use these instead of object destructuring
export const useStatusMessage = () => useEditorStore((state) => state.statusMessage);
export const useSetStatusMessage = () => useEditorStore((state) => state.setStatusMessage);
export const useIsChatExpanded = () => useEditorStore((state) => state.isChatExpanded);
export const useSetIsChatExpanded = () => useEditorStore((state) => state.setIsChatExpanded);
export const useIsLeftPanelCollapsed = () => useEditorStore((state) => state.isLeftPanelCollapsed);
export const useSetIsLeftPanelCollapsed = () =>
  useEditorStore((state) => state.setIsLeftPanelCollapsed);
export const useShowAddMenu = () => useEditorStore((state) => state.showAddMenu);
export const useSetShowAddMenu = () => useEditorStore((state) => state.setShowAddMenu);

export const useIsPlaying = () => useEditorStore((state) => state.isPlaying);
export const useSetIsPlaying = () => useEditorStore((state) => state.setIsPlaying);

export const usePerformanceMetrics = () => useEditorStore((state) => state.performanceMetrics);
export const useSetPerformanceMetrics = () =>
  useEditorStore((state) => state.setPerformanceMetrics);

// Expose editor store globally for component registry access
// This avoids circular dependency issues
if (typeof window !== 'undefined') {
  (window as unknown as { __editorStore: typeof useEditorStore }).__editorStore = useEditorStore;
}
