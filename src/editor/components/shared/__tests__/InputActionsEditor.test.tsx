import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { InputActionsEditor } from '../InputActionsEditor';
import {
  IInputActionsAsset,
  DeviceType,
  ActionType,
  ControlType,
  CompositeType,
} from '@core/lib/input/inputTypes';

describe('InputActionsEditor', () => {
  const createMockAsset = (): IInputActionsAsset => ({
    name: 'TestAsset',
    controlSchemes: [
      {
        name: 'Keyboard&Mouse',
        deviceRequirements: [
          { deviceType: DeviceType.Keyboard, optional: false },
          { deviceType: DeviceType.Mouse, optional: false },
        ],
      },
    ],
    actionMaps: [],
  });

  describe('Action Map Management', () => {
    it('should render empty state when no action maps exist', () => {
      const asset = createMockAsset();
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      expect(screen.getByText('No action maps defined')).toBeInTheDocument();
      expect(screen.getByText('Create Action Map')).toBeInTheDocument();
    });

    it('should add a new action map when Add Action Map is clicked', () => {
      const asset = createMockAsset();
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      const addButton = screen.getByRole('button', { name: /add action map/i });
      fireEvent.click(addButton);

      expect(onAssetChange).toHaveBeenCalledWith(
        expect.objectContaining({
          actionMaps: expect.arrayContaining([
            expect.objectContaining({
              name: 'NewActionMap1',
              enabled: true,
              actions: [],
            }),
          ]),
        }),
      );
    });

    it('should display existing action maps', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [],
          },
          {
            name: 'UI',
            enabled: true,
            actions: [],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      expect(screen.getByText('Gameplay')).toBeInTheDocument();
      expect(screen.getByText('UI')).toBeInTheDocument();
      // Both maps have 0 actions, so we expect multiple matches
      const actionCounts = screen.getAllByText('(0 actions)');
      expect(actionCounts).toHaveLength(2);
    });
  });

  describe('Action Management', () => {
    it('should display existing actions', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [],
              },
              {
                name: 'Move',
                actionType: ActionType.PassThrough,
                controlType: ControlType.Vector2,
                enabled: true,
                bindings: [],
              },
            ],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      expect(screen.getByText('Jump')).toBeInTheDocument();
      expect(screen.getByText('Move')).toBeInTheDocument();
      expect(screen.getByText(/button \/ button/i)).toBeInTheDocument();
      expect(screen.getByText(/passthrough \/ vector2/i)).toBeInTheDocument();
    });
  });

  describe('Binding Management', () => {
    it('should add a simple binding to an action', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [],
              },
            ],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      // The first action map auto-expands, so we should see the Jump action
      const jumpAction = screen.getByText('Jump');
      expect(jumpAction).toBeInTheDocument();

      // Find the chevron button and click it to expand the action
      const actionRow = jumpAction.closest('div');
      const chevronButtons = actionRow!.querySelectorAll('button');
      // First button in the action row is the chevron
      fireEvent.click(chevronButtons[0]);

      // Now we should see "Add Binding" button
      const addBindingButton = screen.getByText(/add binding/i);
      fireEvent.click(addBindingButton);

      // Verify the callback was called with the right structure
      const callArg = onAssetChange.mock.calls[0][0] as IInputActionsAsset;
      expect(callArg.actionMaps[0].actions[0].bindings).toHaveLength(1);
      expect(callArg.actionMaps[0].actions[0].bindings[0]).toMatchObject({
        type: DeviceType.Keyboard,
        path: 'space',
      });
    });

    it('should add a composite binding to an action', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
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
                bindings: [],
              },
            ],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      // Action should be visible (first map auto-expands)
      const moveAction = screen.getByText('Move');
      expect(moveAction).toBeInTheDocument();

      // Find the chevron button and click it to expand the action
      const actionRow = moveAction.closest('div');
      const chevronButtons = actionRow!.querySelectorAll('button');
      // First button in the action row is the chevron
      fireEvent.click(chevronButtons[0]);

      // Click "Add Composite"
      const addCompositeButton = screen.getByText(/add composite/i);
      fireEvent.click(addCompositeButton);

      // Verify the callback was called with the right structure
      const callArg = onAssetChange.mock.calls[0][0] as IInputActionsAsset;
      expect(callArg.actionMaps[0].actions[0].bindings).toHaveLength(1);

      const binding = callArg.actionMaps[0].actions[0].bindings[0];
      expect('compositeType' in binding).toBe(true);
      if ('compositeType' in binding) {
        expect(binding.compositeType).toBe(CompositeType.TwoDVector);
      }
    });

    it('should display existing bindings', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [
                  {
                    type: DeviceType.Keyboard,
                    path: 'space',
                  },
                  {
                    type: DeviceType.Mouse,
                    path: 'rightButton',
                  },
                ],
              },
            ],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      // First expand the Jump action to see bindings
      const jumpAction = screen.getByText('Jump');
      const actionRow = jumpAction.closest('div');
      const chevronButtons = actionRow!.querySelectorAll('button');
      fireEvent.click(chevronButtons[0]);

      // Now check for the binding display format "keyboard: space"
      expect(screen.getByText(/keyboard/i)).toBeInTheDocument();
      expect(screen.getByText(/space/i)).toBeInTheDocument();
      expect(screen.getByText(/mouse/i)).toBeInTheDocument();
      expect(screen.getByText(/rightButton/i)).toBeInTheDocument();
    });
  });

  describe('Properties Panel', () => {
    it('should show action map properties when action map is selected', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      // Click on the action map to select it
      const gameplayRow = screen.getByText('Gameplay');
      fireEvent.click(gameplayRow);

      // Properties panel should appear
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Gameplay')).toBeInTheDocument();
    });

    it('should update action map name via properties panel', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      // Select the action map
      fireEvent.click(screen.getByText('Gameplay'));

      // Find and change the name input
      const nameInput = screen.getByDisplayValue('Gameplay');
      fireEvent.change(nameInput, { target: { value: 'Combat' } });

      expect(onAssetChange).toHaveBeenCalledWith(
        expect.objectContaining({
          actionMaps: [
            expect.objectContaining({
              name: 'Combat',
            }),
          ],
        }),
      );
    });

    it('should show action properties when action is selected', () => {
      const asset: IInputActionsAsset = {
        ...createMockAsset(),
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [],
              },
            ],
          },
        ],
      };
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      // Select the action
      fireEvent.click(screen.getByText('Jump'));

      // Properties panel should show action properties
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jump')).toBeInTheDocument();
    });
  });

  describe('Complete Flow', () => {
    it('should support adding an action map', () => {
      const asset = createMockAsset();
      const onAssetChange = vi.fn();

      render(<InputActionsEditor asset={asset} onAssetChange={onAssetChange} />);

      // Add action map
      fireEvent.click(screen.getByText('Create Action Map'));

      // Verify action map was added
      expect(onAssetChange).toHaveBeenCalledTimes(1);
      const firstCall = onAssetChange.mock.calls[0][0] as IInputActionsAsset;
      expect(firstCall.actionMaps).toHaveLength(1);
      expect(firstCall.actionMaps[0].name).toBe('NewActionMap1');
      expect(firstCall.actionMaps[0].enabled).toBe(true);
      expect(firstCall.actionMaps[0].actions).toHaveLength(0);
    });
  });
});
