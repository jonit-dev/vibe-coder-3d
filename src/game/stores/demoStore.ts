import { create } from 'zustand';

type DemoCategory = 'cameras' | 'gameLoop' | 'physics' | 'ecs' | null;
type CameraType = 'orbit' | 'thirdPerson' | 'firstPerson' | 'fixed' | 'cinematic' | null;

type GameLoopType = 'basic' | null;
type PhysicsType = 'basic' | 'advanced' | null;
type EcsType = 'entity' | null;

type DemoType = CameraType | GameLoopType | PhysicsType | EcsType;

interface DemoStore {
  currentCategory: DemoCategory;
  currentDemo: DemoType;
  setCategory: (category: DemoCategory) => void;
  setDemo: (demo: DemoType) => void;
  goBack: () => void;
}

export const useDemo = create<DemoStore>((set) => ({
  currentCategory: null,
  currentDemo: null,
  setCategory: (category) => set({ currentCategory: category, currentDemo: null }),
  setDemo: (demo) => set({ currentDemo: demo }),
  goBack: () =>
    set((state) => ({
      currentCategory: state.currentDemo ? state.currentCategory : null,
      currentDemo: null,
    })),
}));
