import { z } from 'zod';

/**
 * Unity-like Input System Types
 */

// Action Types
export enum ActionType {
  Button = 'button',
  Value = 'value',
  PassThrough = 'passthrough',
}

// Control Types
export enum ControlType {
  Button = 'button',
  Axis = 'axis',
  Vector2 = 'vector2',
  Vector3 = 'vector3',
}

// Input Device Types
export enum DeviceType {
  Keyboard = 'keyboard',
  Mouse = 'mouse',
  Gamepad = 'gamepad',
  Touch = 'touch',
}

// Composite Binding Types
export enum CompositeType {
  OneModifier = '1DAxis',
  TwoDVector = '2DVector',
  ThreeDVector = '3DVector',
}

// Binding schemas
export const KeyboardBindingSchema = z.object({
  type: z.literal(DeviceType.Keyboard),
  path: z.string(), // e.g., "w", "shift", "space"
  modifiers: z.array(z.string()).optional(),
});

export const MouseBindingSchema = z.object({
  type: z.literal(DeviceType.Mouse),
  path: z.string(), // e.g., "leftButton", "rightButton", "delta/x", "scroll"
  modifiers: z.array(z.string()).optional(),
});

export const GamepadBindingSchema = z.object({
  type: z.literal(DeviceType.Gamepad),
  path: z.string(), // e.g., "buttonSouth", "leftStick/x"
  modifiers: z.array(z.string()).optional(),
});

export const SimpleBindingSchema = z.union([
  KeyboardBindingSchema,
  MouseBindingSchema,
  GamepadBindingSchema,
]);

export const CompositeBindingSchema = z.object({
  compositeType: z.nativeEnum(CompositeType),
  bindings: z.record(SimpleBindingSchema), // e.g., { up: KeyboardBinding, down: KeyboardBinding }
});

export const BindingSchema = z.union([SimpleBindingSchema, CompositeBindingSchema]);

// Action schema
export const InputActionSchema = z.object({
  name: z.string(),
  actionType: z.nativeEnum(ActionType),
  controlType: z.nativeEnum(ControlType),
  bindings: z.array(BindingSchema),
  enabled: z.boolean().default(true),
});

// Action Map schema
export const ActionMapSchema = z.object({
  name: z.string(),
  actions: z.array(InputActionSchema),
  enabled: z.boolean().default(true),
});

// Control Scheme schema
export const ControlSchemeSchema = z.object({
  name: z.string(),
  deviceRequirements: z.array(
    z.object({
      deviceType: z.nativeEnum(DeviceType),
      optional: z.boolean().default(false),
    }),
  ),
});

// Input Actions Asset schema
export const InputActionsAssetSchema = z.object({
  name: z.string(),
  controlSchemes: z.array(ControlSchemeSchema),
  actionMaps: z.array(ActionMapSchema),
});

// Inferred types
export type IKeyboardBinding = z.infer<typeof KeyboardBindingSchema>;
export type IMouseBinding = z.infer<typeof MouseBindingSchema>;
export type IGamepadBinding = z.infer<typeof GamepadBindingSchema>;
export type ISimpleBinding = z.infer<typeof SimpleBindingSchema>;
export type ICompositeBinding = z.infer<typeof CompositeBindingSchema>;
export type IBinding = z.infer<typeof BindingSchema>;
export type IInputAction = z.infer<typeof InputActionSchema>;
export type IActionMap = z.infer<typeof ActionMapSchema>;
export type IControlScheme = z.infer<typeof ControlSchemeSchema>;
export type IInputActionsAsset = z.infer<typeof InputActionsAssetSchema>;

// Callback context for action events
export interface IInputActionCallbackContext {
  action: IInputAction;
  phase: 'started' | 'performed' | 'canceled';
  value: number | [number, number] | [number, number, number];
  time: number;
  duration: number;
}

// Action reference (used in components to reference actions)
export interface IInputActionReference {
  asset: string; // Asset name
  actionMap: string; // Action map name
  action: string; // Action name
}
