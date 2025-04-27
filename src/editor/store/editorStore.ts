import { create } from 'zustand';

interface IContextMenuState {
  open: boolean;
  entityId: number | null;
  anchorRef: React.RefObject<HTMLElement> | null;
}

interface IEditorStore {
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  contextMenu: IContextMenuState;
  setContextMenu: (state: IContextMenuState) => void;
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;
}

export const useEditorStore = create<IEditorStore>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  contextMenu: { open: false, entityId: null, anchorRef: null },
  setContextMenu: (state) => set({ contextMenu: state }),
  showAddMenu: false,
  setShowAddMenu: (show) => set({ showAddMenu: show }),
}));
