import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useInputStore } from '../inputStore';
import { DeviceType, ActionType, ControlType } from '@core/lib/input/inputTypes';

describe('InputStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to default state
    useInputStore.setState({
      assets: [
        {
          name: 'Test Input',
          controlSchemes: [],
          actionMaps: [],
        },
      ],
      currentAsset: 'Test Input',
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Action Map Operations', () => {
    it('should add an action map', () => {
      const store = useInputStore.getState();

      store.addActionMap('Test Input', {
        name: 'Gameplay',
        enabled: true,
        actions: [],
      });

      const state = useInputStore.getState();
      const asset = state.assets.find((a) => a.name === 'Test Input');
      expect(asset?.actionMaps).toHaveLength(1);
      expect(asset?.actionMaps[0].name).toBe('Gameplay');
    });

    it('should remove an action map', () => {
      const store = useInputStore.getState();

      store.addActionMap('Test Input', { name: 'Gameplay', enabled: true, actions: [] });
      store.removeActionMap('Test Input', 'Gameplay');

      const state = useInputStore.getState();
      const asset = state.assets.find((a) => a.name === 'Test Input');
      expect(asset?.actionMaps).toHaveLength(0);
    });

    it('should update an action map', () => {
      const store = useInputStore.getState();

      store.addActionMap('Test Input', { name: 'Gameplay', enabled: true, actions: [] });
      store.updateActionMap('Test Input', 'Gameplay', { enabled: false });

      const state = useInputStore.getState();
      const asset = state.assets.find((a) => a.name === 'Test Input');
      expect(asset?.actionMaps[0].enabled).toBe(false);
    });
  });

  describe('Action Operations', () => {
    beforeEach(() => {
      const store = useInputStore.getState();
      store.addActionMap('Test Input', { name: 'Gameplay', enabled: true, actions: [] });
    });

    it('should add an action', () => {
      const store = useInputStore.getState();

      store.addAction('Test Input', 'Gameplay', {
        name: 'Jump',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [{ type: DeviceType.Keyboard, path: 'space' }],
      });

      const state = useInputStore.getState();
      const map = state.getActionMap('Test Input', 'Gameplay');
      expect(map?.actions).toHaveLength(1);
      expect(map?.actions[0].name).toBe('Jump');
    });

    it('should remove an action', () => {
      const store = useInputStore.getState();

      store.addAction('Test Input', 'Gameplay', {
        name: 'Jump',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      });
      store.removeAction('Test Input', 'Gameplay', 'Jump');

      const state = useInputStore.getState();
      const map = state.getActionMap('Test Input', 'Gameplay');
      expect(map?.actions).toHaveLength(0);
    });

    it('should update an action', () => {
      const store = useInputStore.getState();

      store.addAction('Test Input', 'Gameplay', {
        name: 'Jump',
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      });
      store.updateAction('Test Input', 'Gameplay', 'Jump', { enabled: false });

      const state = useInputStore.getState();
      const action = state.getAction('Test Input', 'Gameplay', 'Jump');
      expect(action?.enabled).toBe(false);
    });
  });

  describe('Asset Operations', () => {
    it('should add an asset', () => {
      const store = useInputStore.getState();

      store.addAsset({
        name: 'New Asset',
        controlSchemes: [],
        actionMaps: [],
      });

      const state = useInputStore.getState();
      expect(state.assets).toHaveLength(2);
      expect(state.assets.find((a) => a.name === 'New Asset')).toBeDefined();
    });

    it('should remove an asset', () => {
      const store = useInputStore.getState();

      store.removeAsset('Test Input');

      const state = useInputStore.getState();
      expect(state.assets).toHaveLength(0);
      expect(state.currentAsset).toBeNull();
    });

    it('should set current asset', () => {
      const store = useInputStore.getState();

      store.addAsset({
        name: 'New Asset',
        controlSchemes: [],
        actionMaps: [],
      });
      store.setCurrentAsset('New Asset');

      const state = useInputStore.getState();
      expect(state.currentAsset).toBe('New Asset');
    });
  });
});
