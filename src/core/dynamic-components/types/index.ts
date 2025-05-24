// Re-export core types from the main types directory
export * from '@/core/types/component-registry';
import { ComponentCategory } from '@/core/types/component-registry';

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
