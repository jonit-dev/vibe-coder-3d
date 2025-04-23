import { create } from 'zustand';

type DemoCategory = 'cameras' | null;
type CameraType =
  | 'orbit'
  | 'thirdPerson'
  | 'firstPerson'
  | 'fixed'
  | 'cinematic'
  | null;

interface DemoStore {
  currentCategory: DemoCategory;
  currentDemo: CameraType;
  setCategory: (category: DemoCategory) => void;
  setDemo: (demo: CameraType) => void;
  goBack: () => void;
}

export const useDemo = create<DemoStore>((set) => ({
  currentCategory: null,
  currentDemo: null,
  setCategory: (category) =>
    set({ currentCategory: category, currentDemo: null }),
  setDemo: (demo) => set({ currentDemo: demo }),
  goBack: () =>
    set((state) => ({
      currentCategory: state.currentDemo ? state.currentCategory : null,
      currentDemo: null,
    })),
}));
