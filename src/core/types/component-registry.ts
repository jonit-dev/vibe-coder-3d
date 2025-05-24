import { z } from 'zod';

// Component categories for organization
export enum ComponentCategory {
  Core = 'core', // Transform, Name
  Rendering = 'rendering', // Material, MeshType, MeshRenderer
  Physics = 'physics', // Velocity, RigidBody, MeshCollider
  Gameplay = 'gameplay', // Health, Inventory
  AI = 'ai', // AIAgent, Behavior
  Audio = 'audio', // AudioSource, AudioListener
  UI = 'ui', // UIElement, Canvas
  Network = 'network', // NetworkSync, PlayerInput
}

// Component descriptor interface for registering components
export interface IComponentDescriptor<T = any> {
  id: string;
  name: string;
  category: ComponentCategory;
  component: any; // bitecs component
  dependencies?: string[];
  conflicts?: string[];
  schema: z.ZodSchema<T>;
  serialize: (entityId: number) => T | undefined;
  deserialize: (entityId: number, data: T) => void;
  onAdd?: (entityId: number) => void;
  onRemove?: (entityId: number) => void;
  required?: boolean;
  removable?: boolean; // Whether this component can be removed from entities (default: true for optional components)
  metadata?: {
    description?: string;
    version?: string;
    author?: string;
    tags?: string[];
  };
}

// Validation result for component operations
export interface IValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingDependencies?: string[];
  conflicts?: string[];
}

// Component addition/removal events
export interface IComponentChangeEvent {
  entityId: number;
  componentId: string;
  action: 'add' | 'remove' | 'update';
  data?: any;
  timestamp: number;
}

// Schemas for validation
export const ComponentCategorySchema = z.nativeEnum(ComponentCategory);

export const ComponentDescriptorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: ComponentCategorySchema,
  dependencies: z.array(z.string()).optional(),
  conflicts: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  removable: z.boolean().default(true),
  metadata: z
    .object({
      description: z.string().optional(),
      version: z.string().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  missingDependencies: z.array(z.string()).optional(),
  conflicts: z.array(z.string()).optional(),
});

export const ComponentChangeEventSchema = z.object({
  entityId: z.number().int().nonnegative(),
  componentId: z.string().min(1),
  action: z.literal('add').or(z.literal('remove')).or(z.literal('update')),
  data: z.any().optional(),
  timestamp: z.number().int().nonnegative(),
});

// Type exports
export type IComponentCategory = z.infer<typeof ComponentCategorySchema>;
export type IComponentDescriptorMetadata = z.infer<typeof ComponentDescriptorSchema>;

// Validation helpers
export const validateComponentCategory = (category: unknown): IComponentCategory =>
  ComponentCategorySchema.parse(category);

export const validateValidationResult = (result: unknown): IValidationResult =>
  ValidationResultSchema.parse(result);

export const validateComponentChangeEvent = (event: unknown): IComponentChangeEvent =>
  ComponentChangeEventSchema.parse(event);

// Additional types specific to dynamic components
export interface IComponentOperationResult {
  success: boolean;
  errors: string[];
  warnings?: string[];
  data?: any;
}

export interface IComponentBatch {
  entityId: number;
  operations: IComponentOperation[];
}

export interface IComponentOperation {
  type: 'add' | 'remove' | 'update';
  componentId: string;
  data?: any;
}

export interface IComponentGroupResult {
  success: boolean;
  errors: string[];
  addedComponents: string[];
  failedComponents: string[];
}

// Component group interface
export interface IComponentGroup {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  components: string[]; // Component IDs to add together
  defaultValues?: Record<string, any>; // Default values for each component
  order: number; // Display order in UI
}
