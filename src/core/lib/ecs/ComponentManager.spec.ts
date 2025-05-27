import { describe, it, expect, vi, beforeEach, afterEach, SpyInstance } from 'vitest';
import { z } from 'zod';
import { ComponentManifest, ComponentCategory } from '@core/components/types';
import { ComponentManager } from './ComponentManager'; // The class to test
import * as DynamicRegistry from './dynamicComponentRegistry'; // To mock its functions

// --- Mocks for dynamicComponentRegistry ---
// We'll mock the functions ComponentManager relies on
vi.mock('./dynamicComponentRegistry', async (importOriginal) => {
  const actual = await importOriginal<typeof DynamicRegistry>(); // Get actual types and non-mocked parts
  return {
    ...actual, // Spread actual to keep other exports intact if any
    getComponentDefinition: vi.fn(),
    getAllComponentDefinitions: vi.fn(),
    // Mock other helpers if ComponentManager starts using them directly
  };
});

// --- Mock Manifest Definitions ---
const mockHealthData = { current: 100, max: 100 };
const mockHealthSchema = z.object({
  current: z.number().default(mockHealthData.current),
  max: z.number().default(mockHealthData.max),
});
const mockHealthManifest: ComponentManifest<typeof mockHealthData> = {
  id: 'Health',
  name: 'Health',
  category: ComponentCategory.Gameplay,
  description: 'Manages health',
  icon: null,
  schema: mockHealthSchema,
  getDefaultData: () => mockHealthSchema.parse({}), // Uses Zod defaults
  onAdd: vi.fn(),
  onRemove: vi.fn(),
};

const mockTransformData = { position: [0,0,0], rotation: [0,0,0,1], scale: [1,1,1] };
const mockTransformSchema = z.object({
    position: z.tuple([z.number(), z.number(), z.number()]).default([0,0,0]),
    rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).default([0,0,0,1]),
    scale: z.tuple([z.number(), z.number(), z.number()]).default([1,1,1]),
});
const mockTransformManifest: ComponentManifest<typeof mockTransformData> = {
  id: 'Transform', // This ID is special as it's in componentMap in ComponentManager
  name: 'Transform',
  category: ComponentCategory.Core,
  description: 'Position, rotation, scale',
  icon: null,
  schema: mockTransformSchema,
  getDefaultData: () => mockTransformSchema.parse({}),
  removable: false,
  onAdd: vi.fn(),
  onRemove: vi.fn(),
};

// Mock for a component that doesn't have a bitecs mapping
const mockCustomData = { value: "test" };
const mockCustomSchema = z.object({ value: z.string().default("default") });
const mockCustomComponentManifest: ComponentManifest<typeof mockCustomData> = {
  id: 'CustomComponent',
  name: 'Custom Component',
  category: ComponentCategory.Gameplay,
  description: 'A custom non-bitecs component',
  icon: null,
  schema: mockCustomSchema,
  getDefaultData: () => mockCustomSchema.parse({}),
  onAdd: vi.fn(),
  onRemove: vi.fn(),
};


// --- Mock bitecs ---
// ComponentManager interacts with bitecs. We need to mock these interactions
// to isolate ComponentManager's logic.
vi.mock('bitecs', () => ({
  addComponent: vi.fn(),
  removeComponent: vi.fn(), // This is bitecsRemoveComponent in ComponentManager
  hasComponent: vi.fn(),   // This is bitecsHasComponent in ComponentManager
  // Mock other bitecs exports if needed, e.g., defineComponent, Types, etc.
  // For these tests, we mostly care that the right functions are called.
}));


// --- Test Suite ---
describe('ComponentManager', () => {
  let componentManager: ComponentManager;
  let mockGetDefinition: SpyInstance;
  let mockGetAllDefinitions: SpyInstance;
  let consoleErrorSpy: SpyInstance;
  let consoleWarnSpy: SpyInstance;

  // Helper to cast to mocked functions for type safety in tests
  const asMock = (fn: any) => fn as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear all mocks before each test

    // Setup spies for console messages
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Initialize ComponentManager instance for each test
    componentManager = ComponentManager.getInstance();

    // Assign mocked functions from the registry
    mockGetDefinition = DynamicRegistry.getComponentDefinition as SpyInstance;
    mockGetAllDefinitions = DynamicRegistry.getAllComponentDefinitions as SpyInstance;

    // Default mock implementations
    mockGetDefinition.mockImplementation((type: string) => {
      if (type === 'Health') return mockHealthManifest;
      if (type === 'Transform') return mockTransformManifest;
      if (type === 'CustomComponent') return mockCustomComponentManifest;
      return undefined;
    });
    mockGetAllDefinitions.mockReturnValue([mockHealthManifest, mockTransformManifest, mockCustomComponentManifest]);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('addComponent()', () => {
    const entityId = 1;

    it('should add a component with valid initial data and call onAdd', () => {
      const initialData = { current: 50, max: 120 };
      const added = componentManager.addComponent(entityId, 'Health', initialData);

      expect(mockGetDefinition).toHaveBeenCalledWith('Health');
      expect(added).toBeDefined();
      expect(added?.data).toEqual(initialData); // Valid data is used
      expect(mockHealthManifest.onAdd).toHaveBeenCalledWith(entityId, initialData);
      // For manifest-only components, check internal storage:
      // expect(componentManager.getComponentData(entityId, 'Health')).toEqual(initialData);
    });

    it('should add a component using default data if none provided and call onAdd', () => {
      const added = componentManager.addComponent(entityId, 'Health');
      const expectedDefault = mockHealthManifest.getDefaultData();

      expect(mockGetDefinition).toHaveBeenCalledWith('Health');
      expect(added).toBeDefined();
      expect(added?.data).toEqual(expectedDefault);
      expect(mockHealthManifest.onAdd).toHaveBeenCalledWith(entityId, expectedDefault);
    });

    it('should use default data if initial data is invalid, and warn', () => {
      const invalidInitialData = { current: -10, max: "not-a-number" } as any; // Clearly invalid
      const added = componentManager.addComponent(entityId, 'Health', invalidInitialData);
      const expectedDefault = mockHealthManifest.getDefaultData();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid initial data for component "Health"'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Using default data for "Health"'));
      expect(added?.data).toEqual(expectedDefault);
      expect(mockHealthManifest.onAdd).toHaveBeenCalledWith(entityId, expectedDefault);
    });
    
    it('should fail to add if initial data and default data are invalid, and error', () => {
      const invalidInitialData = { current: -10 } as any;
      // Sabotage getDefaultData for this specific test
      const faultyManifest = { ...mockHealthManifest, getDefaultData: ()_=> ({current: "bad", max: "verybad"})} as any;
      mockGetDefinition.mockReturnValueOnce(faultyManifest);

      const added = componentManager.addComponent(entityId, 'Health', invalidInitialData);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid initial data for component "Health"'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Default data for component "Health" is also invalid'));
      expect(added).toBeUndefined();
      expect(faultyManifest.onAdd).not.toHaveBeenCalled();
    });


    it('should return undefined and error if component type is not registered', () => {
      mockGetDefinition.mockReturnValueOnce(undefined);
      const added = componentManager.addComponent(entityId, 'UnknownComponent', {});
      expect(added).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Component type "UnknownComponent" not registered.'));
    });

    it('should add a bitecs-mapped component (e.g., Transform) correctly', () => {
        const initialTransformData = { position: [1,2,3], rotation: [0,0,0,1], scale: [1,1,1]};
        componentManager.addComponent(entityId, 'Transform', initialTransformData);
        // Check if bitecs.addComponent was called (it's mocked)
        expect(vi.mocked(await import('bitecs')).addComponent).toHaveBeenCalled();
        expect(mockTransformManifest.onAdd).toHaveBeenCalledWith(entityId, initialTransformData);
    });

    it('should add a manifest-only (non-bitecs) component correctly', () => {
        const initialCustomData = { value: "my-value" };
        componentManager.addComponent(entityId, 'CustomComponent', initialCustomData);
        
        // bitecs.addComponent should NOT have been called for this one
        expect(vi.mocked(await import('bitecs')).addComponent).not.toHaveBeenCalled();
        expect(mockCustomComponentManifest.onAdd).toHaveBeenCalledWith(entityId, initialCustomData);
        expect(componentManager.getComponentData(entityId, 'CustomComponent')).toEqual(initialCustomData);
    });
  });

  describe('removeComponent()', () => {
    const entityId = 1;

    it('should remove an existing component and call onRemove', () => {
      componentManager.addComponent(entityId, 'Health', { current: 50, max: 100 }); // Add first
      mockHealthManifest.onAdd?.mockClear(); // Clear previous onAdd call

      const removed = componentManager.removeComponent(entityId, 'Health');
      expect(removed).toBe(true);
      expect(mockHealthManifest.onRemove).toHaveBeenCalledWith(entityId);
      expect(componentManager.hasComponent(entityId, 'Health')).toBe(false);
    });

    it('should return false if trying to remove a non-existent component', () => {
      const removed = componentManager.removeComponent(entityId, 'Health'); // Not added yet
      expect(removed).toBe(false);
      expect(mockHealthManifest.onRemove).not.toHaveBeenCalled();
    });

    it('should remove a bitecs-mapped component (e.g., Transform) correctly', async () => {
        // Assume Transform component needs to be "present" in bitecs mock for removal
        asMock(vi.mocked(await import('bitecs')).hasComponent).mockReturnValue(true);
        componentManager.addComponent(entityId, 'Transform'); // Add it first
        mockTransformManifest.onAdd?.mockClear();

        const removed = componentManager.removeComponent(entityId, 'Transform');
        expect(removed).toBe(true);
        expect(vi.mocked(await import('bitecs')).removeComponent).toHaveBeenCalled();
        expect(mockTransformManifest.onRemove).toHaveBeenCalledWith(entityId);
    });
  });

  describe('updateComponent()', () => {
    const entityId = 1;

    it('should update an existing component with valid partial data', () => {
      componentManager.addComponent(entityId, 'Health', { current: 100, max: 100 });
      const partialUpdate = { current: 75 };
      const success = componentManager.updateComponent(entityId, 'Health', partialUpdate);

      expect(success).toBe(true);
      const updatedData = componentManager.getComponentData(entityId, 'Health');
      expect(updatedData).toEqual({ current: 75, max: 100 });
    });

    it('should fail to update if partial data leads to invalid state, and error', () => {
      componentManager.addComponent(entityId, 'Health', { current: 100, max: 100 });
      const invalidUpdate = { current: "very-invalid" } as any;
      const success = componentManager.updateComponent(entityId, 'Health', invalidUpdate);

      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid data for component "Health"'));
      const originalData = componentManager.getComponentData(entityId, 'Health');
      expect(originalData).toEqual({ current: 100, max: 100 }); // Data should not have changed
    });

    it('should return false and warn if component not found on entity', () => {
        const success = componentManager.updateComponent(entityId, 'Health', { current: 90 });
        expect(success).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Component "Health" not found on entity 1. Cannot update.'));
    });
    
    it('should return false if component type is not registered', () => {
        mockGetDefinition.mockReturnValueOnce(undefined);
        const success = componentManager.updateComponent(entityId, 'Unknown', { current: 90 });
        expect(success).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Component type "Unknown" not registered. Cannot update.'));
    });
  });

  describe('Data Access and Checks', () => {
    const entityId = 1;
    const healthData = { current: 80, max: 150 };

    beforeEach(() => {
      componentManager.addComponent(entityId, 'Health', healthData);
      componentManager.addComponent(entityId, 'CustomComponent', { value: "custom" });
    });

    it('getComponentData() should retrieve correct data', () => {
      expect(componentManager.getComponentData(entityId, 'Health')).toEqual(healthData);
      expect(componentManager.getComponentData(entityId, 'CustomComponent')).toEqual({value: "custom"});
    });
    
    it('getComponent() should retrieve component structure', () => {
      const component = componentManager.getComponent(entityId, 'Health');
      expect(component).toEqual({ entityId, type: 'Health', data: healthData });
    });

    it('hasComponent() should return true for existing, false for non-existing', () => {
      expect(componentManager.hasComponent(entityId, 'Health')).toBe(true);
      expect(componentManager.hasComponent(entityId, 'CustomComponent')).toBe(true);
      expect(componentManager.hasComponent(entityId, 'Transform')).toBe(false); // Not added
      expect(componentManager.hasComponent(2, 'Health')).toBe(false); // Different entity
    });

    it('getComponentsForEntity() should return all components for an entity', () => {
      const components = componentManager.getComponentsForEntity(entityId);
      expect(components.length).toBe(2);
      expect(components).toContainEqual({ entityId, type: 'Health', data: healthData });
      expect(components).toContainEqual({ entityId, type: 'CustomComponent', data: { value: "custom" } });
    });
  });
  
  describe('getRegisteredComponentTypes()', () => {
    it('should return all component types from the mocked dynamic registry', () => {
        const types = componentManager.getRegisteredComponentTypes();
        // Based on the default mock for getAllComponentDefinitions
        expect(types).toEqual(['Health', 'Transform', 'CustomComponent']);
        expect(mockGetAllDefinitions).toHaveBeenCalled();
    });
  });

  // TODO: Add tests for removeComponentsForEntity if its logic becomes more complex than just iterating removeComponent
  // TODO: Test bitecs interaction more thoroughly if specific behaviors beyond calling the functions are critical
});
