import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { ComponentManifest, ComponentCategory, IRenderingContributions, IPhysicsContributions } from '@core/components/types';

// --- Mock Manifest Definitions ---
const mockValidManifest1: ComponentManifest<{ val: number }> = {
  id: 'Test1',
  name: 'Test Component 1',
  category: ComponentCategory.Gameplay,
  description: 'Description for Test1',
  icon: null, // Using null for simplicity in tests
  schema: z.object({ val: z.number().default(1) }),
  getDefaultData: () => ({ val: 1 }),
  getRenderingContributions: (data) => ({ visible: data.val > 0 }),
};

const mockValidManifest2: ComponentManifest<{ name: string }> = {
  id: 'Test2',
  name: 'Test Component 2',
  category: ComponentCategory.Core,
  description: 'Description for Test2',
  icon: null,
  schema: z.object({ name: z.string().default('defaultName') }),
  getDefaultData: () => ({ name: 'defaultName' }),
  removable: false,
};

const mockValidManifest3Physics: ComponentManifest<{ force: number }> = {
  id: 'PhysicsComp',
  name: 'Physics Component',
  category: ComponentCategory.Physics,
  description: 'Description for PhysicsComp',
  icon: null,
  schema: z.object({ force: z.number().default(10) }),
  getDefaultData: () => ({ force: 10 }),
  getPhysicsContributions: (data) => ({ rigidBodyProps: { mass: data.force / 2 } }),
};

const mockDuplicateIdManifest: ComponentManifest<{ val: string }> = {
  id: 'Test1', // Duplicate ID
  name: 'Duplicate Test Component',
  category: ComponentCategory.Rendering,
  description: 'Description for Duplicate',
  icon: null,
  schema: z.object({ val: z.string().default('duplicate') }),
  getDefaultData: () => ({ val: 'duplicate' }),
};

// --- Mock import.meta.glob ---
// This will be used to dynamically set the mock for each test case if needed
let mockGlobModules: Record<string, { default: ComponentManifest<any> } | {}> = {};

vi.mock('/*', () => ({
    // The path used in dynamicComponentRegistry is '/src/core/components/definitions/*.ts'
    // Vite's import.meta.glob resolves paths relative to the project root.
    // For the mock, we need to ensure the key matches what import.meta.glob expects.
    // Assuming the test runner is at the project root, this relative path should work.
    // If tests are run from a different CWD, this path might need adjustment for the mock.
    // The crucial part is that the module being tested uses a path that resolves here.
    // Given the module uses '/src/core/components/definitions/*.ts', we mock that exact path.
    '/src/core/components/definitions/*.ts': {
        get eager() { return true; }, // Make it behave like { eager: true }
        get modules() { return mockGlobModules; }, // Return our dynamic mock
        // Provide the glob function itself
        glob: (pattern: string, options: { eager: boolean }) => {
            if (options.eager) {
                return mockGlobModules;
            }
            // For non-eager, return a promise (not used by the module AFAIK)
            return Promise.resolve(mockGlobModules);
        }
    }
}), { virtual: true });


// --- Dynamic Registry Module ---
// We need to import the module *after* setting up the mocks
// and re-import it if mockGlobModules changes between describe blocks.
// For now, let's assume one import at the top is fine if we manage mockGlobModules carefully.
// If tests interfere, we'll need dynamic imports within `beforeEach` or `describe`.
import * as DynamicRegistry from './dynamicComponentRegistry';


describe('dynamicComponentRegistry', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset mocks and spies before each test
    vi.resetModules(); // This is crucial to re-evaluate the module with new mocks
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress warnings in tests
  });

  afterEach(() => {
    mockGlobModules = {}; // Clear mock modules
    consoleWarnSpy.mockRestore();
    vi.doUnmock('/*'); // Clean up the glob mock
  });

  describe('Component Discovery and AUTO_COMPONENT_REGISTRY', () => {
    it('should be empty if no components are found', async () => {
      mockGlobModules = {};
      const { AUTO_COMPONENT_REGISTRY } = await import('./dynamicComponentRegistry');
      expect(Object.keys(AUTO_COMPONENT_REGISTRY).length).toBe(0);
    });

    it('should register a single valid component', async () => {
      mockGlobModules = {
        '/src/core/components/definitions/test1.ts': { default: mockValidManifest1 },
      };
      const { AUTO_COMPONENT_REGISTRY } = await import('./dynamicComponentRegistry');
      expect(Object.keys(AUTO_COMPONENT_REGISTRY).length).toBe(1);
      expect(AUTO_COMPONENT_REGISTRY.Test1).toEqual(mockValidManifest1);
    });

    it('should register multiple valid components', async () => {
      mockGlobModules = {
        '/src/core/components/definitions/test1.ts': { default: mockValidManifest1 },
        '/src/core/components/definitions/test2.ts': { default: mockValidManifest2 },
      };
      const { AUTO_COMPONENT_REGISTRY } = await import('./dynamicComponentRegistry');
      expect(Object.keys(AUTO_COMPONENT_REGISTRY).length).toBe(2);
      expect(AUTO_COMPONENT_REGISTRY.Test1).toEqual(mockValidManifest1);
      expect(AUTO_COMPONENT_REGISTRY.Test2).toEqual(mockValidManifest2);
    });

    it('should warn and not overwrite with a duplicate component ID', async () => {
      mockGlobModules = {
        '/src/core/components/definitions/test1.ts': { default: mockValidManifest1 },
        '/src/core/components/definitions/duplicateTest1.ts': { default: mockDuplicateIdManifest },
      };
      const { AUTO_COMPONENT_REGISTRY } = await import('./dynamicComponentRegistry');
      expect(Object.keys(AUTO_COMPONENT_REGISTRY).length).toBe(1);
      expect(AUTO_COMPONENT_REGISTRY.Test1.name).toBe('Test Component 1'); // Original should be kept
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate component ID found: Test1'));
    });

    it('should warn if a module has no default export', async () => {
      mockGlobModules = {
        '/src/core/components/definitions/noDefault.ts': {}, // No default export
      };
      const { AUTO_COMPONENT_REGISTRY } = await import('./dynamicComponentRegistry');
      expect(Object.keys(AUTO_COMPONENT_REGISTRY).length).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('is missing a default export or an \'id\' property'));
    });

    it('should warn if a module default export has no id', async () => {
      mockGlobModules = {
        '/src/core/components/definitions/noId.ts': { default: { name: 'No ID Comp' } as any },
      };
      const { AUTO_COMPONENT_REGISTRY } = await import('./dynamicComponentRegistry');
      expect(Object.keys(AUTO_COMPONENT_REGISTRY).length).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('is missing a default export or an \'id\' property'));
    });
  });

  describe('AutoKnownComponentTypes', () => {
    it('should generate correct enum-like keys', async () => {
      mockGlobModules = {
        '/src/core/components/definitions/test1.ts': { default: mockValidManifest1 },
        '/src/core/components/definitions/physicsComp.ts': { default: mockValidManifest3Physics },
      };
      const { AutoKnownComponentTypes } = await import('./dynamicComponentRegistry');
      expect(AutoKnownComponentTypes.TEST_1).toBe('Test1');
      expect(AutoKnownComponentTypes.PHYSICS_COMP).toBe('PhysicsComp');
    });
     it('should be empty if no components are found', async () => {
      mockGlobModules = {};
      const { AutoKnownComponentTypes } = await import('./dynamicComponentRegistry');
      expect(Object.keys(AutoKnownComponentTypes).length).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    // Re-import module to ensure mocks are applied correctly for this describe block
    let registry: typeof DynamicRegistry;

    beforeEach(async () => {
        // Setup with some components for helper function tests
        mockGlobModules = {
            '/src/core/components/definitions/test1.ts': { default: mockValidManifest1 },
            '/src/core/components/definitions/test2.ts': { default: mockValidManifest2 },
            '/src/core/components/definitions/physicsComp.ts': { default: mockValidManifest3Physics },
        };
        registry = await import('./dynamicComponentRegistry');
    });

    describe('getComponentDefinition()', () => {
      it('should return the manifest for an existing component ID', () => {
        expect(registry.getComponentDefinition('Test1')).toEqual(mockValidManifest1);
      });

      it('should return undefined for a non-existing component ID', () => {
        expect(registry.getComponentDefinition('NonExistent')).toBeUndefined();
      });
    });

    describe('getAllComponentDefinitions()', () => {
      it('should return an array of all registered manifests', () => {
        const allDefs = registry.getAllComponentDefinitions();
        expect(allDefs).toBeInstanceOf(Array);
        expect(allDefs.length).toBe(3);
        expect(allDefs).toContainEqual(mockValidManifest1);
        expect(allDefs).toContainEqual(mockValidManifest2);
        expect(allDefs).toContainEqual(mockValidManifest3Physics);
      });
    });

    describe('getComponentsByCategory()', () => {
      it('should group components by their category', () => {
        const byCategory = registry.getComponentsByCategory();
        expect(byCategory[ComponentCategory.Gameplay]).toEqual([mockValidManifest1]);
        expect(byCategory[ComponentCategory.Core]).toEqual([mockValidManifest2]);
        expect(byCategory[ComponentCategory.Physics]).toEqual([mockValidManifest3Physics]);
        expect(byCategory[ComponentCategory.Rendering]).toBeUndefined();
      });
    });

    describe('isComponentRemovable()', () => {
      it('should return true for a component that is removable (or not specified, defaulting to true)', () => {
        expect(registry.isComponentRemovable('Test1')).toBe(true); // removable not specified
      });

      it('should return false for a component explicitly set as not removable', () => {
        expect(registry.isComponentRemovable('Test2')).toBe(false); // removable: false
      });

      it('should return true for a non-existent component (defaulting behavior)', () => {
        expect(registry.isComponentRemovable('NonExistent')).toBe(true);
      });
    });

    describe('getComponentDefaultData()', () => {
      it('should return the default data from the manifest schema', () => {
        expect(registry.getComponentDefaultData('Test1')).toEqual({ val: 1 });
        expect(registry.getComponentDefaultData('Test2')).toEqual({ name: 'defaultName' });
      });

      it('should return an empty object for a non-existent component and warn', () => {
        expect(registry.getComponentDefaultData('NonExistent')).toEqual({});
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Manifest not found for component ID: NonExistent'));
      });
    });

    // Tests for combineRenderingContributions and combinePhysicsContributions
    // These are more complex as they depend on component data passed at runtime
    describe('combineRenderingContributions()', () => {
        it('should combine contributions from multiple components', () => {
            const entityComponents = [
                { type: 'Test1', data: { val: 10 } }, // mockValidManifest1, visible: true
                { type: 'Test2', data: { name: 'test' } } // mockValidManifest2, no rendering contribution
            ];
            const combined = registry.combineRenderingContributions(entityComponents);
            expect(combined.visible).toBe(true); // From Test1
            expect(combined.material?.color).toBe('#3399ff'); // Default material color
        });

         it('should return default contributions if no component provides rendering info', () => {
            const entityComponents = [{ type: 'Test2', data: { name: 'test' } }]; // No rendering contributions
            const combined = registry.combineRenderingContributions(entityComponents);
            expect(combined.visible).toBe(true); // Default
            expect(combined.castShadow).toBe(true); // Default
        });
    });

    describe('combinePhysicsContributions()', () => {
        it('should combine contributions from physics components', () => {
            const entityComponents = [
                { type: 'PhysicsComp', data: { force: 20 } } // mass: 10
            ];
            const combined = registry.combinePhysicsContributions(entityComponents);
            expect(combined.enabled).toBe(true); // PhysicsComp enables it
            expect(combined.rigidBodyProps?.mass).toBe(10);
        });

        it('should handle components with no physics contributions gracefully', () => {
            const entityComponents = [{ type: 'Test1', data: { val: 1 } }]; // No physics contributions
            const combined = registry.combinePhysicsContributions(entityComponents);
            expect(combined.enabled).toBe(false); // Default
        });
    });
  });
});
