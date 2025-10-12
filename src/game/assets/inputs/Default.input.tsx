import { defineInputAsset } from '@core/lib/serialization/assets/defineInputAssets';
import { ActionType, ControlType, DeviceType, CompositeType } from '@core';

/**
 * Default Input Configuration
 * Standard keyboard & mouse and gamepad controls for gameplay and UI
 */
export default defineInputAsset({
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
      deviceRequirements: [{ deviceType: DeviceType.Gamepad, optional: false }],
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
          bindings: [{ type: DeviceType.Keyboard, path: 'space' }],
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
          bindings: [{ type: DeviceType.Mouse, path: 'delta' }],
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
          bindings: [{ type: DeviceType.Keyboard, path: 'escape' }],
        },
      ],
    },
  ],
});
