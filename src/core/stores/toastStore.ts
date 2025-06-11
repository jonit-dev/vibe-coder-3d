import { z } from 'zod';
import { create } from 'zustand';

// Zod schemas for toast management
export const ToastTypeSchema = z.enum(['success', 'error', 'warning', 'info', 'loading']);

export const ToastSchema = z.object({
  id: z.string(),
  type: ToastTypeSchema,
  title: z.string(),
  message: z.string().optional(),
  duration: z.number().default(4000), // Auto-dismiss after 4 seconds
  persistent: z.boolean().default(false), // If true, won't auto-dismiss
  action: z
    .object({
      label: z.string(),
      onClick: z.function(),
    })
    .optional(),
});

// Export types
export type ToastType = z.infer<typeof ToastTypeSchema>;
export type IToast = z.infer<typeof ToastSchema>;

export interface IToastStore {
  toasts: IToast[];
  addToast: (toast: Omit<IToast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<Omit<IToast, 'id'>>) => void;
  // Convenience methods for common operations
  showSuccess: (title: string, message?: string, options?: Partial<IToast>) => string;
  showError: (title: string, message?: string, options?: Partial<IToast>) => string;
  showWarning: (title: string, message?: string, options?: Partial<IToast>) => string;
  showInfo: (title: string, message?: string, options?: Partial<IToast>) => string;
  showLoading: (title: string, message?: string, options?: Partial<IToast>) => string;
}

// Validation helpers
export const validateToast = (toast: unknown): IToast => ToastSchema.parse(toast);
export const safeValidateToast = (toast: unknown) => ToastSchema.safeParse(toast);

// Generate unique toast IDs
const generateToastId = (): string => {
  return `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const useToastStore = create<IToastStore>((set, get) => ({
  toasts: [],

  addToast: (toastData) => {
    try {
      const id = generateToastId();
      const toast: IToast = { ...toastData, id };

      // Validate the toast data
      const validatedToast = validateToast(toast);

      set((state) => ({
        toasts: [...state.toasts, validatedToast],
      }));

      // Auto-dismiss toast unless it's persistent or loading
      if (
        !validatedToast.persistent &&
        validatedToast.type !== 'loading' &&
        validatedToast.duration
      ) {
        setTimeout(() => {
          get().removeToast(id);
        }, validatedToast.duration);
      }

      return id;
    } catch (error) {
      console.error('Invalid toast data:', error);
      return '';
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)),
    }));
  },

  // Convenience methods
  showSuccess: (title, message, options = {}) => {
    return get().addToast({
      type: 'success',
      title,
      message,
      duration: 4000,
      persistent: false,
      ...options,
    });
  },

  showError: (title, message, options = {}) => {
    return get().addToast({
      type: 'error',
      title,
      message,
      duration: 6000, // Errors stay longer
      persistent: false,
      ...options,
    });
  },

  showWarning: (title, message, options = {}) => {
    return get().addToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
      persistent: false,
      ...options,
    });
  },

  showInfo: (title, message, options = {}) => {
    return get().addToast({
      type: 'info',
      title,
      message,
      duration: 4000,
      persistent: false,
      ...options,
    });
  },

  showLoading: (title, message, options = {}) => {
    return get().addToast({
      type: 'loading',
      title,
      message,
      duration: 4000,
      persistent: true, // Loading toasts don't auto-dismiss
      ...options,
    });
  },
}));

// Hook for project-specific operations
export const useProjectToasts = () => {
  const toast = useToastStore();

  return {
    showSaveSuccess: (entityCount: number) =>
      toast.showSuccess('Project Saved', `Successfully saved scene with ${entityCount} entities`, {
        duration: 3000,
      }),

    showSaveError: (error?: string) =>
      toast.showError('Save Failed', error || 'An error occurred while saving the project', {
        duration: 8000,
      }),

    showLoadSuccess: (entityCount: number) =>
      toast.showSuccess(
        'Project Loaded',
        `Successfully loaded scene with ${entityCount} entities`,
        { duration: 3000 },
      ),

    showLoadError: (error?: string) =>
      toast.showError('Load Failed', error || 'An error occurred while loading the project', {
        duration: 8000,
      }),

    showDeleteSuccess: (entityCount: number) =>
      toast.showSuccess('Scene Cleared', `Successfully cleared ${entityCount} entities`, {
        duration: 3000,
      }),

    showDeleteError: (error?: string) =>
      toast.showError('Clear Failed', error || 'An error occurred while clearing the scene', {
        duration: 8000,
      }),

    showLoadingOperation: (operation: string) =>
      toast.showLoading(`${operation}...`, 'Please wait while the operation completes'),

    // Generic operation handlers
    showOperationStart: (operation: string) => toast.showLoading(`${operation}...`),

    showOperationSuccess: (operation: string, details?: string) =>
      toast.showSuccess(`${operation} Complete`, details, { duration: 3000 }),

    showOperationError: (operation: string, error?: string) =>
      toast.showError(`${operation} Failed`, error, { duration: 8000 }),
  };
};
