import { z } from 'zod';

// Game Project Configuration
export const GameProjectConfigSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  assetBasePath: z.string(),
  startupScene: z.string(),
});

export type IGameProjectConfig = z.infer<typeof GameProjectConfigSchema>;

// Component Descriptor
export const ComponentDescriptorSchema = z.object({
  id: z.string(),
  schema: z.unknown(),
  serialize: z.function(),
  deserialize: z.function(),
});

export interface IComponentDescriptor<TData = unknown> {
  id: string;
  schema: unknown;
  serialize: (entityId: number) => TData | undefined;
  deserialize: (entityId: number, data: TData) => void;
}

// System Descriptor
export const SystemDescriptorSchema = z.object({
  id: z.string(),
  order: z.number().optional(),
  update: z.function(),
});

export interface ISystemDescriptor {
  id: string;
  order?: number;
  update: (dt: number) => void;
}

// Script Descriptor
export const ScriptDescriptorSchema = z.object({
  id: z.string(),
  onInit: z.function().optional(),
  onUpdate: z.function().optional(),
  onDestroy: z.function().optional(),
});

export interface IScriptDescriptor {
  id: string;
  onInit?: (entityId: number) => void;
  onUpdate?: (entityId: number, dt: number) => void;
  onDestroy?: (entityId: number) => void;
}

// Prefab Descriptor
export const PrefabDescriptorSchema = z.object({
  id: z.string(),
  create: z.function(),
});

export interface IPrefabDescriptor {
  id: string;
  create: (params?: Record<string, unknown>) => number;
}

// Scene Descriptor
export const SceneDescriptorSchema = z.object({
  id: z.string(),
  load: z.function(),
});

export interface ISceneDescriptor {
  id: string;
  load: () => Promise<void>;
}
