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
  updateAction: (assetName: string, mapName: string, actionName: string, action: Partial<IInputAction>) => void;

  // Control Schemes
  addControlScheme: (assetName: string, scheme: IControlScheme) => void;
  removeControlScheme: (assetName: string, schemeName: string) => void;
  updateControlScheme: (assetName: string, schemeName: string, scheme: Partial<IControlScheme>) => void;

  // Helpers
  getAsset: (name: string) => IInputActionsAsset | undefined;
  getActionMap: (assetName: string, mapName: string) => IActionMap | undefined;
  getAction: (assetName: string, mapName: string, actionName: string) => IInputAction | undefined;
}

// Default input configuration
const createDefaultAsset = (): IInputActionsAsset => ({
  name: 'Default Input',
  controlSchemes: [
    {
      name: 'Keyboard & Mouse',
      deviceRequirements: [
        { deviceType: DeviceType.Keyboard, optional: false },
        { deviceType: DeviceType.Mouse, optional: true },
      ],
    },
    {
      name: 'Gamepad',
      deviceRequirements: [
        { deviceType: DeviceType.Gamepad, optional: false },
      ],
    },
  ],
  actionMaps: [
    {
      name: 'Gameplay',
      enabled: true,
      actions: [
        {
          name: 'Move',
          actionType: ActionType.PassThrough,
          controlType: ControlType.Vector2,
          enabled: true,
          bindings: [
            {
              compositeType: CompositeType.TwoDVector,
              bindings: {
                up: { type: DeviceType.Keyboard, path: 'w' },
                down: { type: DeviceType.Keyboard, path: 's' },
                left: { type: DeviceType.Keyboard, path: 'a' },
                right: { type: DeviceType.Keyboard, path: 'd' },
              },
            },
            {
              compositeType: CompositeType.TwoDVector,
              bindings: {
                up: { type: DeviceType.Keyboard, path: 'arrowup' },
                down: { type: DeviceType.Keyboard, path: 'arrowdown' },
                left: { type: DeviceType.Keyboard, path: 'arrowleft' },
                right: { type: DeviceType.Keyboard, path: 'arrowright' },
              },
            },
          ],
        },
        {
          name: 'Jump',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [
            { type: DeviceType.Keyboard, path: 'space' },
          ],
        },
        {
          name: 'Fire',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [
            { type: DeviceType.Mouse, path: 'leftButton' },
            { type: DeviceType.Keyboard, path: 'f' },
          ],
        },
        {
          name: 'Look',
          actionType: ActionType.PassThrough,
          controlType: ControlType.Vector2,
          enabled: true,
          bindings: [
            { type: DeviceType.Mouse, path: 'delta' },
          ],
        },
      ],
    },
    {
      name: 'UI',
      enabled: true,
      actions: [
        {
          name: 'Navigate',
          actionType: ActionType.PassThrough,
          controlType: ControlType.Vector2,
          enabled: true,
          bindings: [
            {
              compositeType: CompositeType.TwoDVector,
              bindings: {
                up: { type: DeviceType.Keyboard, path: 'arrowup' },
                down: { type: DeviceType.Keyboard, path: 'arrowdown' },
                left: { type: DeviceType.Keyboard, path: 'arrowleft' },
                right: { type: DeviceType.Keyboard, path: 'arrowright' },
              },
            },
          ],
        },
        {
          name: 'Submit',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [
            { type: DeviceType.Keyboard, path: 'enter' },
            { type: DeviceType.Keyboard, path: 'space' },
          ],
        },
        {
          name: 'Cancel',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [
            { type: DeviceType.Keyboard, path: 'escape' },
          ],
        },
      ],
    },
  ],
});

export const useInputStore = create<IInputStore>((set, get) => ({
  assets: [createDefaultAsset()],
  currentAsset: 'Default Input',

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
          assets: state.assets.map((a) =>
            a.name === name ? { ...a, ...updates } : a
          ),
        })),

      setCurrentAsset: (name) => set({ currentAsset: name }),

      // Action Map operations
      addActionMap: (assetName, actionMap) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.name === assetName
              ? { ...asset, actionMaps: [...asset.actionMaps, actionMap] }
              : asset
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
              : asset
          ),
        })),

      updateActionMap: (assetName, mapName, updates) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.name === assetName
              ? {
                  ...asset,
                  actionMaps: asset.actionMaps.map((map) =>
                    map.name === mapName ? { ...map, ...updates } : map
                  ),
                }
              : asset
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
                    map.name === mapName
                      ? { ...map, actions: [...map.actions, action] }
                      : map
                  ),
                }
              : asset
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
                      : map
                  ),
                }
              : asset
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
                            action.name === actionName
                              ? { ...action, ...updates }
                              : action
                          ),
                        }
                      : map
                  ),
                }
              : asset
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
              : asset
          ),
        })),

      removeControlScheme: (assetName, schemeName) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.name === assetName
              ? {
                  ...asset,
                  controlSchemes: asset.controlSchemes.filter(
                    (s) => s.name !== schemeName
                  ),
                }
              : asset
          ),
        })),

      updateControlScheme: (assetName, schemeName, updates) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.name === assetName
              ? {
                  ...asset,
                  controlSchemes: asset.controlSchemes.map((scheme) =>
                    scheme.name === schemeName ? { ...scheme, ...updates } : scheme
                  ),
                }
              : asset
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
}));

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
