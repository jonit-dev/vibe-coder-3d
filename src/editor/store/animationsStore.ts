import type { IAnimationAsset } from '@core/animation/assets/defineAnimations';
import { AnimationRegistry } from '@core/animation/AnimationRegistry';
import { create } from 'zustand';

interface IAnimationsState {
  // Registry instance
  registry: AnimationRegistry;

  // Animations cache for reactivity
  animations: IAnimationAsset[];

  // Current selection
  selectedAnimationId: string | null;

  // Modal states
  isBrowserOpen: boolean;
  isCreateOpen: boolean;
  isInspectorOpen: boolean;

  // Search and filters
  searchTerm: string;
  filterByTag: string;

  // Internal methods
  _refreshAnimations: () => void;

  // Actions
  setSelectedAnimation: (animationId: string | null) => void;
  openBrowser: () => void;
  closeBrowser: () => void;
  openCreate: () => void;
  closeCreate: () => void;
  openInspector: (animationId?: string) => void;
  closeInspector: () => void;
  setSearchTerm: (term: string) => void;
  setFilterByTag: (tag: string) => void;

  // Animation operations
  createAnimation: (animation: IAnimationAsset) => Promise<void>;
  updateAnimation: (animationId: string, updates: Partial<IAnimationAsset>) => Promise<void>;
  deleteAnimation: (animationId: string) => Promise<void>;
  duplicateAnimation: (animationId: string) => Promise<IAnimationAsset>;

  // Selector functions for computed properties
  getFilteredAnimations: () => IAnimationAsset[];
  getSelectedAnimation: () => IAnimationAsset | null | undefined;
  getAnimationById: (id: string) => IAnimationAsset | undefined;

  // Async library loading
  loadLibrary: () => Promise<void>;
}

export const useAnimationsStore = create<IAnimationsState>((set, get) => {
  // Initialize registry
  const registry = AnimationRegistry.getInstance();

  // Load animations from external library files
  const loadLibraryAnimations = async () => {
    try {
      const { BrowserAssetLoader } = await import(
        '@core/lib/serialization/assets/BrowserAssetLoader'
      );
      const loader = new BrowserAssetLoader();
      const libraryAnimations = await loader.loadAnimations();

      // Upsert all library animations into registry
      libraryAnimations.forEach((animation) => {
        registry.upsert(animation);
      });

      // Refresh store to reflect loaded animations
      get()._refreshAnimations();
    } catch (error) {
      console.error('Failed to load library animations:', error);
    }
  };

  // Trigger load in background
  loadLibraryAnimations();

  return {
    get registry() {
      return AnimationRegistry.getInstance();
    },
    animations: registry.list(), // Initialize with current animations

    selectedAnimationId: null,
    isBrowserOpen: false,
    isCreateOpen: false,
    isInspectorOpen: false,
    searchTerm: '',
    filterByTag: '',

    _refreshAnimations: () => {
      const registry = AnimationRegistry.getInstance();
      const animations = registry.list();
      set({ animations });
    },

    setSelectedAnimation: (animationId) => set({ selectedAnimationId: animationId }),

    openBrowser: () => set({ isBrowserOpen: true }),
    closeBrowser: () => set({ isBrowserOpen: false }),
    openCreate: () => set({ isCreateOpen: true }),
    closeCreate: () => set({ isCreateOpen: false }),
    openInspector: (animationId) =>
      set({
        isInspectorOpen: true,
        selectedAnimationId: animationId || get().selectedAnimationId,
      }),
    closeInspector: () => set({ isInspectorOpen: false }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setFilterByTag: (tag) => set({ filterByTag: tag }),

    createAnimation: async (animation) => {
      const registry = AnimationRegistry.getInstance();
      registry.upsert(animation);
      get()._refreshAnimations(); // Update UI reactively
    },

    updateAnimation: async (animationId, updates) => {
      const registry = AnimationRegistry.getInstance();
      const existing = registry.get(animationId);
      if (!existing) throw new Error(`Animation not found: ${animationId}`);

      const updated: IAnimationAsset = { ...existing, ...updates };

      registry.upsert(updated);
      get()._refreshAnimations(); // Update UI reactively
    },

    deleteAnimation: async (animationId) => {
      AnimationRegistry.getInstance().remove(animationId);
      get()._refreshAnimations(); // Update UI reactively
    },

    duplicateAnimation: async (animationId) => {
      const registry = AnimationRegistry.getInstance();
      const original = registry.get(animationId);
      if (!original) throw new Error(`Animation not found: ${animationId}`);

      const duplicate: IAnimationAsset = {
        ...original,
        id: `${original.id}_copy_${Date.now()}`,
        name: `${original.name} (Copy)`,
      };

      registry.upsert(duplicate);
      get()._refreshAnimations(); // Update UI reactively

      return duplicate;
    },

    getFilteredAnimations: () => {
      const { searchTerm, filterByTag, animations } = get();

      if (!animations) return [];

      return animations.filter((animation) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !animation.name.toLowerCase().includes(searchLower) &&
            !animation.id.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Tag filter
        if (filterByTag && filterByTag !== 'all') {
          if (!animation.tags || !animation.tags.includes(filterByTag)) {
            return false;
          }
        }

        return true;
      });
    },

    getSelectedAnimation: () => {
      const { selectedAnimationId, animations } = get();
      return selectedAnimationId
        ? animations.find((a) => a.id === selectedAnimationId) || null
        : null;
    },

    getAnimationById: (id: string) => {
      const { animations } = get();
      return animations.find((a) => a.id === id);
    },

    loadLibrary: async () => {
      await loadLibraryAnimations();
    },
  };
});

/**
 * PERFORMANCE: Optimized hook for subscribing to a single animation by ID
 * This prevents re-renders when unrelated animations change
 *
 * Usage:
 * const animation = useAnimationById('my-animation-id');
 */
export const useAnimationById = (animationId: string): IAnimationAsset | undefined => {
  return useAnimationsStore((state) => state.animations.find((a) => a.id === animationId));
};
