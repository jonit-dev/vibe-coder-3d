import { create } from 'zustand';

type DemoCategory = 'cameras' | 'gameLoop' | 'physics' | null;
type CameraType = 'orbit' | 'thirdPerson' | 'firstPerson' | 'fixed' | 'cinematic' | null;

type GameLoopType = 'basic' | null;
type PhysicsType = 'basic' | null;

type DemoType = CameraType | GameLoopType | PhysicsType;

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
