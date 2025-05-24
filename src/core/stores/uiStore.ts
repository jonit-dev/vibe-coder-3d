import { z } from 'zod';
import { create } from 'zustand';

// Zod schemas for UI state management
export const InstructionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const GameUIStateSchema = z.object({
  // Instructions panel
  instructionsVisible: z.boolean().default(false),
  instructionsTitle: z.string().default(''),
  instructions: z.array(InstructionItemSchema).default([]),

  // Score display
  score: z.number().default(0),

  // Action messages
  actionMessage: z.string().nullable().default(null),
});

// Export types for backward compatibility
export interface IInstructionItem {
  id: string;
  text: string;
}

export interface IGameUIState {
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

// Validation helpers
export const validateInstructionItem = (item: unknown): IInstructionItem =>
  InstructionItemSchema.parse(item);

export const validateInstructionItems = (items: unknown): IInstructionItem[] =>
  z.array(InstructionItemSchema).parse(items);

export const validateUIState = (state: unknown) => GameUIStateSchema.parse(state);

// Safe validation helpers
export const safeValidateInstructionItem = (item: unknown) => InstructionItemSchema.safeParse(item);

export const safeValidateUIState = (state: unknown) => GameUIStateSchema.safeParse(state);

export const useUIStore = create<IGameUIState>((set) => ({
  // Instructions panel
  instructionsVisible: false,
  instructionsTitle: '',
  instructions: [],
  showInstructions: (title, instructions) => {
    // Validate input data
    try {
      const validatedInstructions = validateInstructionItems(instructions);
      set({
        instructionsVisible: true,
        instructionsTitle: title,
        instructions: validatedInstructions,
      });
    } catch (error) {
      console.error('Invalid instruction items:', error);
      // Fallback to empty array if validation fails
      set({
        instructionsVisible: true,
        instructionsTitle: title,
        instructions: [],
      });
    }
  },
  hideInstructions: () => set({ instructionsVisible: false }),

  // Score display
  score: 0,
  setScore: (score) => {
    // Validate score input
    if (typeof score === 'number' && !isNaN(score) && score >= 0) {
      set({ score });
    } else {
      console.error('Invalid score value:', score);
    }
  },

  // Action messages
  actionMessage: null,
  showActionMessage: (message) => {
    // Validate message input
    if (typeof message === 'string' && message.trim() !== '') {
      set({ actionMessage: message });
    } else {
      console.error('Invalid action message:', message);
    }
  },
  hideActionMessage: () => set({ actionMessage: null }),
}));
