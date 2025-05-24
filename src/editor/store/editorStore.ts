import { create } from 'zustand';

import { IRigidBodyData } from '@/editor/components/panels/InspectorPanel/RigidBody/RigidBodySection';

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
  rigidBodies: Record<number, IRigidBodyData>;
  setEntityRigidBody: (entityId: number, data: IRigidBodyData | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const useEditorStore = create<IEditorStore>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  contextMenu: { open: false, entityId: null, anchorRef: null },
  setContextMenu: (state) => set({ contextMenu: state }),
  showAddMenu: false,
  setShowAddMenu: (show) => set({ showAddMenu: show }),
  rigidBodies: {},
  setEntityRigidBody: (entityId, data) =>
    set((state) => {
      if (data) {
        return { rigidBodies: { ...state.rigidBodies, [entityId]: data } };
      } else {
        const { [entityId]: removed, ...rest } = state.rigidBodies;
        return { rigidBodies: rest };
      }
    }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}));
