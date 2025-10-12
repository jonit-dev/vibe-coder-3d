import { create } from 'zustand';
import {
  IInputActionsAsset,
  IActionMap,
  IInputAction,
  IControlScheme,
  DeviceType,
  ActionType,
  ControlType,
  CompositeType,
} from '@core/lib/input/inputTypes';

interface IInputStore {
  // Input actions assets
  assets: IInputActionsAsset[];
  currentAsset: string | null;

  // Actions
  addAsset: (asset: IInputActionsAsset) => void;
  removeAsset: (name: string) => void;
  updateAsset: (name: string, asset: Partial<IInputActionsAsset>) => void;
  setCurrentAsset: (name: string | null) => void;

  // Action Maps
  addActionMap: (assetName: string, actionMap: IActionMap) => void;
  removeActionMap: (assetName: string, mapName: string) => void;
  updateActionMap: (assetName: string, mapName: string, actionMap: Partial<IActionMap>) => void;

  // Actions
  addAction: (assetName: string, mapName: string, action: IInputAction) => void;
  removeAction: (assetName: string, mapName: string, actionName: string) => void;
  updateAction: (
    assetName: string,
    mapName: string,
    actionName: string,
    action: Partial<IInputAction>,
  ) => void;

  // Control Schemes
  addControlScheme: (assetName: string, scheme: IControlScheme) => void;
  removeControlScheme: (assetName: string, schemeName: string) => void;
  updateControlScheme: (
    assetName: string,
    schemeName: string,
    scheme: Partial<IControlScheme>,
  ) => void;

  // Helpers
  getAsset: (name: string) => IInputActionsAsset | undefined;
  getActionMap: (assetName: string, mapName: string) => IActionMap | undefined;
  getAction: (assetName: string, mapName: string, actionName: string) => IInputAction | undefined;
}

// Load default input assets from external library
const loadDefaultInputAssets = async (): Promise<IInputActionsAsset[]> => {
  try {
    const { BrowserAssetLoader } = await import(
      '@/core/lib/serialization/assets/BrowserAssetLoader'
    );
    const loader = new BrowserAssetLoader();
    const libraryInputs = await loader.loadInputAssets();
    return libraryInputs.length > 0 ? libraryInputs : [];
  } catch (error) {
    console.error('Failed to load library input assets:', error);
    return [];
  }
};

export const useInputStore = create<IInputStore>()((set, get) => {
  // Load input assets from library in background
  loadDefaultInputAssets().then((libraryAssets) => {
    if (libraryAssets.length > 0) {
      set({
        assets: libraryAssets,
        currentAsset: libraryAssets[0].name,
      });
    }
  });

  return {
    assets: [], // Will be populated by loadDefaultInputAssets
    currentAsset: null,

        // Asset operations
        addAsset: (asset) =>
          set((state) => ({
            assets: [...state.assets, asset],
          })),

        removeAsset: (name) =>
          set((state) => ({
            assets: state.assets.filter((a) => a.name !== name),
            currentAsset: state.currentAsset === name ? null : state.currentAsset,
          })),

        updateAsset: (name, updates) =>
          set((state) => ({
            assets: state.assets.map((a) => (a.name === name ? { ...a, ...updates } : a)),
          })),

        setCurrentAsset: (name) => set({ currentAsset: name }),

        // Action Map operations
        addActionMap: (assetName, actionMap) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? { ...asset, actionMaps: [...asset.actionMaps, actionMap] }
                : asset,
            ),
          })),

        removeActionMap: (assetName, mapName) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    actionMaps: asset.actionMaps.filter((m) => m.name !== mapName),
                  }
                : asset,
            ),
          })),

        updateActionMap: (assetName, mapName, updates) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    actionMaps: asset.actionMaps.map((map) =>
                      map.name === mapName ? { ...map, ...updates } : map,
                    ),
                  }
                : asset,
            ),
          })),

        // Action operations
        addAction: (assetName, mapName, action) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    actionMaps: asset.actionMaps.map((map) =>
                      map.name === mapName ? { ...map, actions: [...map.actions, action] } : map,
                    ),
                  }
                : asset,
            ),
          })),

        removeAction: (assetName, mapName, actionName) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    actionMaps: asset.actionMaps.map((map) =>
                      map.name === mapName
                        ? {
                            ...map,
                            actions: map.actions.filter((a) => a.name !== actionName),
                          }
                        : map,
                    ),
                  }
                : asset,
            ),
          })),

        updateAction: (assetName, mapName, actionName, updates) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    actionMaps: asset.actionMaps.map((map) =>
                      map.name === mapName
                        ? {
                            ...map,
                            actions: map.actions.map((action) =>
                              action.name === actionName ? { ...action, ...updates } : action,
                            ),
                          }
                        : map,
                    ),
                  }
                : asset,
            ),
          })),

        // Control Scheme operations
        addControlScheme: (assetName, scheme) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    controlSchemes: [...asset.controlSchemes, scheme],
                  }
                : asset,
            ),
          })),

        removeControlScheme: (assetName, schemeName) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    controlSchemes: asset.controlSchemes.filter((s) => s.name !== schemeName),
                  }
                : asset,
            ),
          })),

        updateControlScheme: (assetName, schemeName, updates) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.name === assetName
                ? {
                    ...asset,
                    controlSchemes: asset.controlSchemes.map((scheme) =>
                      scheme.name === schemeName ? { ...scheme, ...updates } : scheme,
                    ),
                  }
                : asset,
            ),
          })),

        // Helper methods
        getAsset: (name) => get().assets.find((a) => a.name === name),

        getActionMap: (assetName, mapName) => {
          const asset = get().getAsset(assetName);
          return asset?.actionMaps.find((m) => m.name === mapName);
        },

        getAction: (assetName, mapName, actionName) => {
          const map = get().getActionMap(assetName, mapName);
          return map?.actions.find((a) => a.name === actionName);
        },
      };
});

// Selectors
export const useCurrentAssetName = () => useInputStore((state) => state.currentAsset);

// Single subscription to prevent double re-renders
export const useCurrentAsset = () =>
  useInputStore((state) => {
    const assetName = state.currentAsset;
    return assetName ? state.assets.find((a) => a.name === assetName) : undefined;
  });

export const useActionMaps = (assetName: string) =>
  useInputStore((state) => state.getAsset(assetName)?.actionMaps ?? []);

export const useActions = (assetName: string, mapName: string) =>
  useInputStore((state) => state.getActionMap(assetName, mapName)?.actions ?? []);
