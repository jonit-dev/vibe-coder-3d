import { describe, it, expect, vi, beforeEach, afterEach, SpyInstance } from 'vitest';
import { z } from 'zod';
import { ComponentManifest, ComponentCategory } from '@core/components/types';
import { ComponentManager } from './ComponentManager'; // The class to test
import * as DynamicRegistry from './dynamicComponentRegistry'; // To mock its functions
import { EntityId } from './types'; // Added

// --- Actual Manifest Imports ---
import transformManifestActual from '@core/components/definitions/transform';
import meshRendererManifestActual from '@core/components/definitions/meshRenderer';
import rigidBodyManifestActual from '@core/components/definitions/rigidBody';
import meshColliderManifestActual from '@core/components/definitions/meshCollider';
import cameraManifestActual from '@core/components/definitions/camera';

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
// ComponentManager interacts with bitecs. We will mock these interactions
// for most tests, but unmock for specific bitecs interaction tests.
const mockBitecs = {
  addComponent: vi.fn(),
  removeComponent: vi.fn(), // This is bitecsRemoveComponent in ComponentManager
  hasComponent: vi.fn(),   // This is bitecsHasComponent in ComponentManager
  defineQuery: vi.fn(),
  removeEntity: vi.fn(),
  addEntity: vi.fn().mockImplementation(() => 0 as EntityId), // Default mock for addEntity
  // Mock other bitecs exports if needed
};
vi.mock('bitecs', () => mockBitecs);

// --- Import actual bitecs for specific tests ---
import * as ActualBitecs from 'bitecs';
import { Transform as BitecsTransformObject } from '@core/lib/ecs/BitECSComponents'; // Actual Transform component for bitecs
import { ECSWorld } from '@core/lib/ecs/World'; // Actual world


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
    mockGetAllDefinitions.mockReturnValue([
        mockHealthManifest,
        mockTransformManifest,
        mockCustomComponentManifest,
        // Add actuals if getRegisteredComponentTypes is tested within these suites
        // or ensure the mock for it is comprehensive enough.
    ]);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    // Basic cleanup for ComponentManager state, assuming entity IDs are somewhat unique per describe block.
    // More robust cleanup might involve iterating known entity IDs used in tests.
    // Or, if ComponentManager had a reset method for tests, call it here.
    // For now, relying on distinct entity IDs and specific component removals if needed.
  });

  // Existing tests for general ComponentManager logic (using mock manifests)
  describe('addComponent() with mock manifests', () => {
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

  describe('removeComponent() with mock manifests', () => {
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

  describe('updateComponent() with mock manifests', () => {
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

  describe('Data Access and Checks with mock manifests', () => {
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
  
  describe('getRegisteredComponentTypes() with mock manifests', () => {
    it('should return all component types from the mocked dynamic registry', () => {
        const types = componentManager.getRegisteredComponentTypes();
        // Based on the default mock for getAllComponentDefinitions in the general beforeEach
        expect(types).toEqual(['Health', 'Transform', 'CustomComponent']);
        expect(mockGetAllDefinitions).toHaveBeenCalled();
    });
  });

  // --- Tests for Core Component Manifests ---
  const coreManifests = [
    { name: 'Transform', manifest: transformManifestActual, 
      validData: { position: [1,1,1], rotation: [0,0,0,1], scale: [2,2,2] },
      invalidData: { position: [1,1,'a'] }, // Invalid type
      partialData: { scale: [3,3,3] }
    },
    { name: 'MeshRenderer', manifest: meshRendererManifestActual,
      validData: { meshId: 'sphere', materialId: 'customMat', enabled: true, castShadows: true, receiveShadows: true, material: { color: '#FF0000', metalness: 0.5, roughness: 0.2, emissive: '#00FF00', emissiveIntensity: 1 } },
      invalidData: { material: { color: 'not-a-hex' } },
      partialData: { enabled: false, material: { roughness: 0.8 } }
    },
    { name: 'RigidBody', manifest: rigidBodyManifestActual,
      validData: { bodyType: 'dynamic', mass: 5, enabled: true, gravityScale: 1.5, canSleep: false, linearDamping: 0.1, angularDamping: 0.1, material: { friction: 0.5, restitution: 0.5, density: 1.2 } },
      invalidData: { mass: -1 }, // mass must be >= 0
      partialData: { linearDamping: 0.5, material: { friction: 0.8 } }
    },
    { name: 'MeshCollider', manifest: meshColliderManifestActual,
      validData: { enabled: true, colliderType: 'sphere', isTrigger: true, center: [0,0.5,0], size: { radius: 0.5 }, physicsMaterial: { friction: 0.6, restitution: 0.4, density: 1.1 } },
      invalidData: { colliderType: 'unknown' }, // Invalid enum
      partialData: { isTrigger: false, physicsMaterial: { restitution: 0.2 } }
    },
    { name: 'Camera', manifest: cameraManifestActual,
      validData: { preset: 'custom', fov: 60, near: 0.01, far: 2000, isMain: true, enableControls: false, target: [1,2,3], projectionType: 'orthographic', clearDepth: false, renderPriority: 10 },
      invalidData: { fov: 200 }, // fov > 179
      partialData: { isMain: false, far: 1500 }
    },
  ];

  coreManifests.forEach(({ name, manifest, validData, invalidData, partialData }) => {
    describe(`${name} Component Integration (Actual Manifest)`, () => {
      let entityIdCounter = 100; // Start from a higher counter to avoid collision with other tests
      let currentEntityId: EntityId;

      beforeEach(() => {
        currentEntityId = entityIdCounter++ as EntityId;
        // Ensure getComponentDefinition returns the actual manifest for this test suite
        // This overrides the general mock for the specific component ID
        asMock(DynamicRegistry.getComponentDefinition).mockImplementation((type: string) => {
          if (type === manifest.id) return manifest;
          // Fallback to other mocks if needed, or return undefined
          if (type === 'Health') return mockHealthManifest;
          if (type === 'CustomComponent') return mockCustomComponentManifest;
          // The 'Transform' from mockTransformManifest might conflict if not careful,
          // but since these tests are namespaced by manifest.id, it should be fine.
          if (type === 'Transform' && manifest.id !== 'Transform') return mockTransformManifest;
          return undefined;
        });
      });
      
      afterEach(() => {
          // Attempt to clean up the component added to avoid state leakage
          if (componentManager.hasComponent(currentEntityId, manifest.id)) {
              componentManager.removeComponent(currentEntityId, manifest.id);
          }
           // Restore the general mock implementation for getComponentDefinition
          asMock(DynamicRegistry.getComponentDefinition).mockImplementation((type: string) => {
            if (type === 'Health') return mockHealthManifest;
            if (type === 'Transform') return mockTransformManifest; // General mock transform
            if (type === 'CustomComponent') return mockCustomComponentManifest;
            return undefined;
        });
      });

      describe(`addComponent() - ${name}`, () => {
        it('should add with valid initial data and call onAdd if defined', () => {
          const onAddSpy = manifest.onAdd ? vi.spyOn(manifest, 'onAdd').mockImplementation(() => {}) : undefined;

          componentManager.addComponent(currentEntityId, manifest.id, validData);
          const storedData = componentManager.getComponentData(currentEntityId, manifest.id);
          
          // Zod parsing can transform data (e.g. add defaults for unspecified optionals)
          // So we check if the storedData contains what we provided.
          // For a more precise check, parse validData with the schema first.
          const expectedData = manifest.schema.parse(validData);
          expect(storedData).toEqual(expectedData);

          if (manifest.onAdd && onAddSpy) {
            expect(onAddSpy).toHaveBeenCalledWith(currentEntityId, storedData);
            onAddSpy.mockRestore();
          }
        });

        it('should use default data and log error if initial data is invalid', () => {
          const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          
          componentManager.addComponent(currentEntityId, manifest.id, invalidData);
          
          const storedData = componentManager.getComponentData(currentEntityId, manifest.id);
          const defaultData = manifest.getDefaultData();
          const parsedDefault = manifest.schema.parse(defaultData); // CM stores parsed default data

          expect(storedData).toEqual(parsedDefault);
          expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Invalid initial data for component "${manifest.id}"`));
          consoleErrorSpy.mockRestore();
        });

        it('should add with default data when no initial data is provided', () => {
          componentManager.addComponent(currentEntityId, manifest.id);
          const storedData = componentManager.getComponentData(currentEntityId, manifest.id);
          const defaultData = manifest.getDefaultData();
          const parsedDefault = manifest.schema.parse(defaultData);
          expect(storedData).toEqual(parsedDefault);
        });
      });

      describe(`updateComponent() - ${name}`, () => {
        it('should update with valid partial data', () => {
          componentManager.addComponent(currentEntityId, manifest.id); // Add with defaults
          const initialData = componentManager.getComponentData(currentEntityId, manifest.id);
          
          componentManager.updateComponent(currentEntityId, manifest.id, partialData);
          
          const storedData = componentManager.getComponentData(currentEntityId, manifest.id);
          const expectedData = { ...initialData, ...partialData }; // Simple merge for check
          
          // For more robust check, parse the merged object with Zod schema
          // This ensures that defaults for other fields are preserved correctly after partial update
          const expectedParsedData = manifest.schema.parse(expectedData);
          expect(storedData).toEqual(expectedParsedData);

          // Check that only partialData fields changed, and others remain from initialData (or defaults)
          Object.keys(partialData as any).forEach(key => {
            expect((storedData as any)[key]).toEqual((expectedParsedData as any)[key]);
          });

        });

        it('should not update and log error if partial data leads to invalid merged state', () => {
          componentManager.addComponent(currentEntityId, manifest.id, validData); // Add with valid data
          const initialStoredData = componentManager.getComponentData(currentEntityId, manifest.id);
          const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

          // Use the 'invalidData' as a 'partialInvalidData' if it makes sense,
          // or craft specific invalid partial data.
          // Example: if validData has {a:1, b:2}, and schema needs b > 0
          // invalidPartialData could be {b: -5}
          let specificInvalidPartial = invalidData; // Using the top-level invalidData for this test
                                                  // This might not always make sense for a "partial" update
                                                  // depending on the schema.
          // A better approach for `invalidPartialData` for some schemas:
          if (name === 'Transform') specificInvalidPartial = { position: 'not-an-array' } as any;
          if (name === 'MeshRenderer') specificInvalidPartial = { material: { color: 123 } } as any;
          // ... and so on for other components, ensuring the partial update itself is the cause of invalidity

          componentManager.updateComponent(currentEntityId, manifest.id, specificInvalidPartial);
          
          const finalStoredData = componentManager.getComponentData(currentEntityId, manifest.id);
          expect(finalStoredData).toEqual(initialStoredData); // Data should not have changed
          expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Invalid data for component "${manifest.id}"`));
          consoleErrorSpy.mockRestore();
        });
      });
    });
  });

  // TODO: Add tests for removeComponentsForEntity if its logic becomes more complex than just iterating removeComponent
  // TODO: Test bitecs interaction more thoroughly if specific behaviors beyond calling the functions are critical
});


describe('Transform Component - Direct Bitecs Interaction', () => {
  let componentManager: ComponentManager;
  let worldInstance: ActualBitecs.IWorld;
  let entityId: EntityId;
  let originalBitecsMockState: any; // To store the state of the mock

  beforeAll(() => {
    // Store the original mock state
    originalBitecsMockState = { ...mockBitecs };
    
    // Unmock specific functions or the entire module for these tests
    // We want actual bitecs.addComponent etc. to run
    vi.doUnmock('bitecs'); 
    // Re-import actual bitecs if necessary, or ensure they are available
    // The import * as ActualBitecs should make them available.
  });

  afterAll(() => {
    // Restore the global mock for other test suites
    vi.doMock('bitecs', () => originalBitecsMockState);
  });

  beforeEach(async () => {
    // Reset modules to ensure ComponentManager gets the actual bitecs if it was dynamically importing
    // However, ComponentManager imports bitecs statically, so this might not be strictly needed here
    // if the unmocking at the describe level is effective.
    // vi.resetModules(); 
    
    worldInstance = ECSWorld.getInstance().getWorld(); // Get the actual world instance
    componentManager = ComponentManager.getInstance(); // Get/create instance

    // Ensure getComponentDefinition returns the actual transformManifest
    asMock(DynamicRegistry.getComponentDefinition).mockImplementation((type: string) => {
      if (type === transformManifestActual.id) {
        return transformManifestActual;
      }
      // Fallback for other types if any are incidentally used
      if (type === 'Health') return mockHealthManifest;
      if (type === 'CustomComponent') return mockCustomComponentManifest;
      return undefined;
    });
    asMock(DynamicRegistry.getAllComponentDefinitions).mockReturnValue([transformManifestActual]);


    // Create a new entity for each test directly using bitecs
    entityId = ActualBitecs.addEntity(worldInstance) as EntityId;
  });

  afterEach(() => {
    // Clean up the entity
    if (worldInstance && entityId !== undefined) {
        // Remove transform component if it exists to clean up bitecs store for the entity
        if (ActualBitecs.hasComponent(worldInstance, BitecsTransformObject, entityId)) {
            ActualBitecs.removeComponent(worldInstance, BitecsTransformObject, entityId);
        }
        ActualBitecs.removeEntity(worldInstance, entityId);
    }
    vi.clearAllMocks(); // Clear mocks like getComponentDefinition
  });

  it('should update bitecs Transform store when adding with initial data', () => {
    const initialData = { position: [1, 2, 3], rotation: [0, 1, 0, 0], scale: [2, 2, 2] };
    componentManager.addComponent(entityId, transformManifestActual.id, initialData);

    // Verify data in the actual bitecs Transform component store
    expect(Array.from(BitecsTransformObject.position[entityId])).toEqual(initialData.position);
    expect(Array.from(BitecsTransformObject.rotation[entityId])).toEqual(initialData.rotation);
    expect(Array.from(BitecsTransformObject.scale[entityId])).toEqual(initialData.scale);
  });

  it('should update bitecs Transform store when adding with default data', () => {
    componentManager.addComponent(entityId, transformManifestActual.id);
    const defaultData = transformManifestActual.getDefaultData();

    expect(Array.from(BitecsTransformObject.position[entityId])).toEqual(defaultData.position);
    expect(Array.from(BitecsTransformObject.rotation[entityId])).toEqual(defaultData.rotation);
    expect(Array.from(BitecsTransformObject.scale[entityId])).toEqual(defaultData.scale);
  });

  it('should update bitecs Transform store when updating component data', () => {
    componentManager.addComponent(entityId, transformManifestActual.id); // Add with defaults
    const updatedData = { position: [5, 5, 5], scale: [0.5, 0.5, 0.5] };
    componentManager.updateComponent(entityId, transformManifestActual.id, updatedData);

    const expectedRotation = transformManifestActual.getDefaultData().rotation;

    expect(Array.from(BitecsTransformObject.position[entityId])).toEqual(updatedData.position);
    expect(Array.from(BitecsTransformObject.rotation[entityId])).toEqual(expectedRotation);
    expect(Array.from(BitecsTransformObject.scale[entityId])).toEqual(updatedData.scale);
  });

  it('should not remove Transform from bitecs store as it is non-removable', () => {
    const initialData = transformManifestActual.getDefaultData();
    componentManager.addComponent(entityId, transformManifestActual.id, initialData);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // ComponentManager's removeComponent internally checks `isComponentRemovable`
    // which for Transform (removable: false) should prevent actual removal.
    // The `onRemove` hook in the manifest should also not be called.
    const onRemoveSpy = vi.spyOn(transformManifestActual, 'onRemove' as any).mockImplementation(() => {});

    componentManager.removeComponent(entityId, transformManifestActual.id);
    
    consoleErrorSpy.mockRestore();
    if (onRemoveSpy) onRemoveSpy.mockRestore(); // Restore if spy was created

    // Verify that the component is still in bitecs and data is unchanged
    expect(ActualBitecs.hasComponent(worldInstance, BitecsTransformObject, entityId)).toBe(true);
    expect(Array.from(BitecsTransformObject.position[entityId])).toEqual(initialData.position);
    expect(Array.from(BitecsTransformObject.rotation[entityId])).toEqual(initialData.rotation);
    expect(Array.from(BitecsTransformObject.scale[entityId])).toEqual(initialData.scale);
    expect(onRemoveSpy).not.toHaveBeenCalled(); // onRemove hook should not be called for non-removable
  });
});
