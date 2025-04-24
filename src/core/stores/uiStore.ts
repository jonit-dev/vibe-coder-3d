import { create } from 'zustand';

interface IInstructionItem {
  id: string;
  text: string;
}

interface IGameUIState {
  // Instructions panel
  instructionsVisible: boolean;
  instructionsTitle: string;
  instructions: IInstructionItem[];
  showInstructions: (title: string, instructions: IInstructionItem[]) => void;
  hideInstructions: () => void;

  // Score display
  score: number;
  setScore: (score: number) => void;

  // Action messages
  actionMessage: string | null;
  showActionMessage: (message: string) => void;
  hideActionMessage: () => void;
}

export const useUIStore = create<IGameUIState>((set) => ({
  // Instructions panel
  instructionsVisible: false,
  instructionsTitle: '',
  instructions: [],
  showInstructions: (title, instructions) =>
    set({
      instructionsVisible: true,
      instructionsTitle: title,
      instructions,
    }),
  hideInstructions: () => set({ instructionsVisible: false }),

  // Score display
  score: 0,
  setScore: (score) => set({ score }),

  // Action messages
  actionMessage: null,
  showActionMessage: (message) => set({ actionMessage: message }),
  hideActionMessage: () => set({ actionMessage: null }),
}));
