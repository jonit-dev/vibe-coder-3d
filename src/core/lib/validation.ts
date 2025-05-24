import { z } from 'zod';

// Core validation schemas for common data types
export const PositionSchema = z.tuple([z.number(), z.number(), z.number()]);
export const RotationSchema = z.tuple([z.number(), z.number(), z.number()]);
export const ScaleSchema = z.tuple([
  z.number().positive(),
  z.number().positive(),
  z.number().positive(),
]);
export const QuaternionValidationSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

// Game engine hook schemas
export const GameEngineControlsSchema = z.object({
  isRunning: z.boolean(),
  isPaused: z.boolean(),
  frameRate: z.number().positive(),
  deltaTime: z.number().nonnegative(),
  totalTime: z.number().nonnegative(),
});

// Audio hook schemas
export const AudioOptionsSchema = z.object({
  volume: z.number().min(0).max(1).default(1),
  loop: z.boolean().default(false),
  autoplay: z.boolean().default(false),
  preload: z.boolean().default(true),
  format: z.array(z.string()).optional(),
  onload: z.function().optional(),
  onerror: z.function().optional(),
  onend: z.function().optional(),
});

export const AudioControlsSchema = z.object({
  play: z.function().returns(z.void()),
  pause: z.function().returns(z.void()),
  stop: z.function().returns(z.void()),
  setVolume: z.function(z.tuple([z.number().min(0).max(1)]), z.void()),
  setLoop: z.function(z.tuple([z.boolean()]), z.void()),
  isPlaying: z.boolean(),
  isLoaded: z.boolean(),
  duration: z.number().nonnegative(),
  currentTime: z.number().nonnegative(),
});

// Event system schemas
export const EventDataSchema = z.record(z.string(), z.unknown());

export const GameEventSchema = z.object({
  type: z.string(),
  data: EventDataSchema.optional(),
  timestamp: z.number().nonnegative(),
  source: z.string().optional(),
});

// Physics schemas
export const PhysicsBodyConfigSchema = z.object({
  type: z.enum(['static', 'dynamic', 'kinematic']).default('dynamic'),
  mass: z.number().positive().default(1),
  friction: z.number().min(0).max(1).default(0.5),
  restitution: z.number().min(0).max(1).default(0.0),
  linearDamping: z.number().min(0).max(1).default(0.01),
  angularDamping: z.number().min(0).max(1).default(0.01),
  isSensor: z.boolean().default(false),
  collisionGroups: z.array(z.string()).default([]),
});

// Rendering schemas
export const LODConfigSchema = z.object({
  distance: z.number().nonnegative(),
  meshUrl: z.string().url(),
  textureUrl: z.string().url().optional(),
  materialOverrides: z.record(z.string(), z.unknown()).optional(),
});

export const RenderingConfigSchema = z.object({
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  frustumCulled: z.boolean().default(true),
  renderOrder: z.number().int().default(0),
  visible: z.boolean().default(true),
  layers: z.array(z.string()).default(['default']),
  lod: z.array(LODConfigSchema).optional(),
});

// System update schemas
export const SystemUpdateConfigSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
  maxEntitiesPerFrame: z.number().int().positive().default(1000),
  targetFrameTime: z.number().positive().default(16.67), // ~60 FPS
});

// Debug schemas
export const DebugVisualizationSchema = z.object({
  showBoundingBoxes: z.boolean().default(false),
  showWireframes: z.boolean().default(false),
  showNormals: z.boolean().default(false),
  showColliders: z.boolean().default(false),
  showVelocities: z.boolean().default(false),
  showFPS: z.boolean().default(false),
  showStats: z.boolean().default(false),
  logLevel: z.enum(['none', 'error', 'warn', 'info', 'debug']).default('warn'),
});

// Export inferred types
export type IPosition = z.infer<typeof PositionSchema>;
export type IRotation = z.infer<typeof RotationSchema>;
export type IScale = z.infer<typeof ScaleSchema>;
export type IValidationQuaternion = z.infer<typeof QuaternionValidationSchema>;
export type IGameEngineControls = z.infer<typeof GameEngineControlsSchema>;
export type IAudioOptions = z.infer<typeof AudioOptionsSchema>;
export type IAudioControls = z.infer<typeof AudioControlsSchema>;
export type IEventData = z.infer<typeof EventDataSchema>;
export type IGameEvent = z.infer<typeof GameEventSchema>;
export type IPhysicsBodyConfig = z.infer<typeof PhysicsBodyConfigSchema>;
export type ILODConfig = z.infer<typeof LODConfigSchema>;
export type IRenderingConfig = z.infer<typeof RenderingConfigSchema>;
export type ISystemUpdateConfig = z.infer<typeof SystemUpdateConfigSchema>;
export type IDebugVisualization = z.infer<typeof DebugVisualizationSchema>;

// Validation functions
export const validatePosition = (position: unknown): IPosition => PositionSchema.parse(position);

export const validateRotation = (rotation: unknown): IRotation => RotationSchema.parse(rotation);

export const validateScale = (scale: unknown): IScale => ScaleSchema.parse(scale);

export const validateQuaternion = (quaternion: unknown): IValidationQuaternion =>
  QuaternionValidationSchema.parse(quaternion);

export const validateGameEngineControls = (controls: unknown): IGameEngineControls =>
  GameEngineControlsSchema.parse(controls);

export const validateAudioOptions = (options: unknown): IAudioOptions =>
  AudioOptionsSchema.parse(options);

export const validateGameEvent = (event: unknown): IGameEvent => GameEventSchema.parse(event);

export const validatePhysicsBodyConfig = (config: unknown): IPhysicsBodyConfig =>
  PhysicsBodyConfigSchema.parse(config);

export const validateRenderingConfig = (config: unknown): IRenderingConfig =>
  RenderingConfigSchema.parse(config);

export const validateSystemUpdateConfig = (config: unknown): ISystemUpdateConfig =>
  SystemUpdateConfigSchema.parse(config);

export const validateDebugVisualization = (config: unknown): IDebugVisualization =>
  DebugVisualizationSchema.parse(config);

// Safe validation functions
export const safeValidatePosition = (position: unknown) => PositionSchema.safeParse(position);

export const safeValidateRotation = (rotation: unknown) => RotationSchema.safeParse(rotation);

export const safeValidateScale = (scale: unknown) => ScaleSchema.safeParse(scale);

export const safeValidateGameEvent = (event: unknown) => GameEventSchema.safeParse(event);

export const safeValidatePhysicsBodyConfig = (config: unknown) =>
  PhysicsBodyConfigSchema.safeParse(config);

export const safeValidateRenderingConfig = (config: unknown) =>
  RenderingConfigSchema.safeParse(config);

// Utility functions for common validations
export const isValidPosition = (value: unknown): value is IPosition => {
  return safeValidatePosition(value).success;
};

export const isValidRotation = (value: unknown): value is IRotation => {
  return safeValidateRotation(value).success;
};

export const isValidScale = (value: unknown): value is IScale => {
  return safeValidateScale(value).success;
};

export const isValidGameEvent = (value: unknown): value is IGameEvent => {
  return safeValidateGameEvent(value).success;
};

// Error handling utilities
export const createValidationError = (message: string, path?: string, value?: unknown) => {
  return new Error(
    `Validation Error${path ? ` at ${path}` : ''}: ${message}${
      value !== undefined ? ` (received: ${JSON.stringify(value)})` : ''
    }`,
  );
};

export const logValidationWarning = (message: string, value?: unknown) => {
  console.warn(
    `Validation Warning: ${message}${
      value !== undefined ? ` (received: ${JSON.stringify(value)})` : ''
    }`,
  );
};

// Default value helpers
export const getDefaultPosition = (): IPosition => [0, 0, 0];
export const getDefaultRotation = (): IRotation => [0, 0, 0];
export const getDefaultScale = (): IScale => [1, 1, 1];
export const getDefaultQuaternion = (): IValidationQuaternion => [0, 0, 0, 1];
