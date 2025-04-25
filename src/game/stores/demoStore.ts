import { create } from 'zustand';

type DemoCategory = 'cameras' | 'gameLoop' | 'physics' | 'ecs' | 'assets' | null;
type CameraType = 'orbit' | 'thirdPerson' | 'firstPerson' | 'fixed' | 'cinematic' | null;

type GameLoopType = 'basic' | null;
type PhysicsType = 'basic' | 'advanced' | 'bowls' | null;
type EcsType = 'entity' | null;
type AssetsType = 'nightstalker' | null;

type DemoType = CameraType | GameLoopType | PhysicsType | EcsType | AssetsType;

interface IDemoStore {
  currentCategory: DemoCategory;
  currentDemo: DemoType;
  setCategory: (category: DemoCategory) => void;
  setDemo: (demo: DemoType) => void;
  goBack: () => void;
}

export const useDemo = create<IDemoStore>((set) => ({
  currentCategory: null,
  currentDemo: null,
  setCategory: (category) => {
    console.log('Setting category:', category);
    set({ currentCategory: category, currentDemo: null });
  },
  setDemo: (demo) => {
    console.log('Setting demo:', demo);
    set({ currentDemo: demo });
  },
  goBack: () =>
    set((state) => {
      console.log('Going back from:', { category: state.currentCategory, demo: state.currentDemo });
      return {
        currentCategory: state.currentDemo ? state.currentCategory : null,
        currentDemo: null,
      };
    }),
}));
