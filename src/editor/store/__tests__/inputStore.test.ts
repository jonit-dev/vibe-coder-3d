import { describe, it, expect, beforeEach } from 'vitest';
import { useInputStore } from '../inputStore';
import {
  ActionType,
  ControlType,
  DeviceType,
  CompositeType,
  type IInputAction,
  type IActionMap,
  type IControlScheme,
} from '@core/lib/input/inputTypes';

describe('inputStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useInputStore.setState({
      assets: [],
      currentAsset: null,
    });
  });

  describe('asset management', () => {
    it('should add an asset', () => {
      const { addAsset, assets } = useInputStore.getState();

      const asset = {
        name: 'Test Asset',
        controlSchemes: [],
        actionMaps: [],
      };

      addAsset(asset);

      expect(assets()).toHaveLength(1);
      expect(assets()[0].name).toBe('Test Asset');
    });

    it('should remove an asset', () => {
      const { addAsset, removeAsset, assets } = useInputStore.getState();

      addAsset({ name: 'Asset 1', controlSchemes: [], actionMaps: [] });
      addAsset({ name: 'Asset 2', controlSchemes: [], actionMaps: [] });

      removeAsset('Asset 1');

      expect(assets()).toHaveLength(1);
      expect(assets()[0].name).toBe('Asset 2');
    });

    it('should update an asset', () => {
      const { addAsset, updateAsset, assets } = useInputStore.getState();

      addAsset({ name: 'Original', controlSchemes: [], actionMaps: [] });
      updateAsset('Original', { name: 'Updated' });

      expect(assets()[0].name).toBe('Updated');
    });

    it('should set current asset', () => {
      const { addAsset, setCurrentAsset, currentAsset } = useInputStore.getState();

      addAsset({ name: 'Asset 1', controlSchemes: [], actionMaps: [] });
      setCurrentAsset('Asset 1');

      expect(currentAsset()).toBe('Asset 1');
    });

    it('should clear current asset when removed', () => {
      const { addAsset, setCurrentAsset, removeAsset, currentAsset } =
        useInputStore.getState();

      addAsset({ name: 'Asset 1', controlSchemes: [], actionMaps: [] });
      setCurrentAsset('Asset 1');
      removeAsset('Asset 1');

      expect(currentAsset()).toBeNull();
    });
  });

  describe('action map management', () => {
    beforeEach(() => {
      const { addAsset } = useInputStore.getState();
      addAsset({
        name: 'Test',
        controlSchemes: [],
        actionMaps: [],
      });
    });

    it('should add an action map', () => {
      const { addActionMap, getAsset } = useInputStore.getState();

      const map: IActionMap = {
        name: 'Gameplay',
        enabled: true,
        actions: [],
      };

      addActionMap('Test', map);

      const asset = getAsset('Test');
      expect(asset?.actionMaps).toHaveLength(1);
      expect(asset?.actionMaps[0].name).toBe('Gameplay');
    });

    it('should remove an action map', () => {
      const { addActionMap, removeActionMap, getAsset } = useInputStore.getState();

      addActionMap('Test', { name: 'Map1', enabled: true, actions: [] });
      addActionMap('Test', { name: 'Map2', enabled: true, actions: [] });

      removeActionMap('Test', 'Map1');

      const asset = getAsset('Test');
      expect(asset?.actionMaps).toHaveLength(1);
      expect(asset?.actionMaps[0].name).toBe('Map2');
    });

    it('should update an action map', () => {
      const { addActionMap, updateActionMap, getAsset } = useInputStore.getState();

      addActionMap('Test', { name: 'Map', enabled: true, actions: [] });
      updateActionMap('Test', 'Map', { enabled: false });

      const asset = getAsset('Test');
      expect(asset?.actionMaps[0].enabled).toBe(false);
    });
  });

  describe('action management', () => {
    beforeEach(() => {
      const { addAsset, addActionMap } = useInputStore.getState();

      addAsset({ name: 'Test', controlSchemes: [], actionMaps: [] });
      addActionMap('Test', { name: 'Gameplay', enabled: true, actions: [] });
    });

    it('should add an action', () => {
      const { addAction, getActionMap } = useInputStore.getState();

      const action: IInputAction = {
        name: 'Jump',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      };

      addAction('Test', 'Gameplay', action);

      const map = getActionMap('Test', 'Gameplay');
      expect(map?.actions).toHaveLength(1);
      expect(map?.actions[0].name).toBe('Jump');
    });

    it('should remove an action', () => {
      const { addAction, removeAction, getActionMap } = useInputStore.getState();

      addAction('Test', 'Gameplay', {
        name: 'Action1',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      });
      addAction('Test', 'Gameplay', {
        name: 'Action2',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      });

      removeAction('Test', 'Gameplay', 'Action1');

      const map = getActionMap('Test', 'Gameplay');
      expect(map?.actions).toHaveLength(1);
      expect(map?.actions[0].name).toBe('Action2');
    });

    it('should update an action', () => {
      const { addAction, updateAction, getAction } = useInputStore.getState();

      addAction('Test', 'Gameplay', {
        name: 'Jump',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      });

      updateAction('Test', 'Gameplay', 'Jump', { enabled: false });

      const action = getAction('Test', 'Gameplay', 'Jump');
      expect(action?.enabled).toBe(false);
    });
  });

  describe('control scheme management', () => {
    beforeEach(() => {
      const { addAsset } = useInputStore.getState();
      addAsset({ name: 'Test', controlSchemes: [], actionMaps: [] });
    });

    it('should add a control scheme', () => {
      const { addControlScheme, getAsset } = useInputStore.getState();

      const scheme: IControlScheme = {
        name: 'Keyboard & Mouse',
        deviceRequirements: [
          { deviceType: DeviceType.Keyboard, optional: false },
          { deviceType: DeviceType.Mouse, optional: true },
        ],
      };

      addControlScheme('Test', scheme);

      const asset = getAsset('Test');
      expect(asset?.controlSchemes).toHaveLength(1);
      expect(asset?.controlSchemes[0].name).toBe('Keyboard & Mouse');
    });

    it('should remove a control scheme', () => {
      const { addControlScheme, removeControlScheme, getAsset } =
        useInputStore.getState();

      addControlScheme('Test', {
        name: 'Scheme1',
        deviceRequirements: [],
      });
      addControlScheme('Test', {
        name: 'Scheme2',
        deviceRequirements: [],
      });

      removeControlScheme('Test', 'Scheme1');

      const asset = getAsset('Test');
      expect(asset?.controlSchemes).toHaveLength(1);
      expect(asset?.controlSchemes[0].name).toBe('Scheme2');
    });

    it('should update a control scheme', () => {
      const { addControlScheme, updateControlScheme, getAsset } =
        useInputStore.getState();

      addControlScheme('Test', {
        name: 'Original',
        deviceRequirements: [],
      });

      updateControlScheme('Test', 'Original', { name: 'Updated' });

      const asset = getAsset('Test');
      expect(asset?.controlSchemes[0].name).toBe('Updated');
    });
  });

  describe('default asset', () => {
    it('should create default asset on initialization', () => {
      const store = useInputStore.getState();

      // Force re-initialization by clearing state
      useInputStore.setState({
        assets: [],
        currentAsset: null,
      });

      // Import to trigger initialization
      const { default: createStore } = require('../inputStore');

      const state = createStore.getState();
      expect(state.assets).toHaveLength(1);
      expect(state.assets[0].name).toBe('Default Input');
      expect(state.currentAsset).toBe('Default Input');
    });

    it('should have Gameplay action map with Move action', () => {
      const store = useInputStore.getState();

      // Get default asset
      const asset = store.getAsset('Default Input');
      expect(asset).toBeDefined();

      const gameplayMap = asset?.actionMaps.find((m) => m.name === 'Gameplay');
      expect(gameplayMap).toBeDefined();

      const moveAction = gameplayMap?.actions.find((a) => a.name === 'Move');
      expect(moveAction).toBeDefined();
      expect(moveAction?.controlType).toBe(ControlType.Vector2);
      expect(moveAction?.bindings.length).toBeGreaterThan(0);
    });

    it('should have UI action map with Navigate action', () => {
      const store = useInputStore.getState();

      const asset = store.getAsset('Default Input');
      const uiMap = asset?.actionMaps.find((m) => m.name === 'UI');
      expect(uiMap).toBeDefined();

      const navigateAction = uiMap?.actions.find((a) => a.name === 'Navigate');
      expect(navigateAction).toBeDefined();
      expect(navigateAction?.controlType).toBe(ControlType.Vector2);
    });
  });

  describe('helper methods', () => {
    beforeEach(() => {
      const { addAsset, addActionMap, addAction } = useInputStore.getState();

      addAsset({ name: 'Test', controlSchemes: [], actionMaps: [] });
      addActionMap('Test', { name: 'Map', enabled: true, actions: [] });
      addAction('Test', 'Map', {
        name: 'Action',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      });
    });

    it('should get asset by name', () => {
      const { getAsset } = useInputStore.getState();

      const asset = getAsset('Test');
      expect(asset).toBeDefined();
      expect(asset?.name).toBe('Test');
    });

    it('should get action map by name', () => {
      const { getActionMap } = useInputStore.getState();

      const map = getActionMap('Test', 'Map');
      expect(map).toBeDefined();
      expect(map?.name).toBe('Map');
    });

    it('should get action by name', () => {
      const { getAction } = useInputStore.getState();

      const action = getAction('Test', 'Map', 'Action');
      expect(action).toBeDefined();
      expect(action?.name).toBe('Action');
    });

    it('should return undefined for non-existent items', () => {
      const { getAsset, getActionMap, getAction } = useInputStore.getState();

      expect(getAsset('NonExistent')).toBeUndefined();
      expect(getActionMap('Test', 'NonExistent')).toBeUndefined();
      expect(getAction('Test', 'Map', 'NonExistent')).toBeUndefined();
    });
  });
});
