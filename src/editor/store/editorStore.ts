import { create } from 'zustand';

import { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { IMeshRendererData } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';
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
  meshColliders: Record<number, IMeshColliderData>;
  setEntityMeshCollider: (entityId: number, data: IMeshColliderData | null) => void;
  meshRenderers: Record<number, IMeshRendererData>;
  setEntityMeshRenderer: (entityId: number, data: IMeshRendererData | null) => void;
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
  meshColliders: {},
  setEntityMeshCollider: (entityId, data) =>
    set((state) => {
      if (data) {
        return { meshColliders: { ...state.meshColliders, [entityId]: data } };
      } else {
        const { [entityId]: removed, ...rest } = state.meshColliders;
        return { meshColliders: rest };
      }
    }),
  meshRenderers: {},
  setEntityMeshRenderer: (entityId, data) =>
    set((state) => {
      if (data) {
        return { meshRenderers: { ...state.meshRenderers, [entityId]: data } };
      } else {
        const { [entityId]: removed, ...rest } = state.meshRenderers;
        return { meshRenderers: rest };
      }
    }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}));
