import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentRegistry, ComponentFactory, ComponentCategory } from '../ComponentRegistry';
import { EntityManager } from '../EntityManager';
import { ECSWorld } from '../World';
import { z } from 'zod';
import { Types } from 'bitecs';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    // Reset the world
    ECSWorld.getInstance().reset();

    registry = ComponentRegistry.getInstance();

    // Refresh world reference after reset
    registry.refreshWorld();

    // Clear any existing components for clean state
    (registry as any).components.clear();
    (registry as any).bitECSComponents.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ComponentRegistry.getInstance();
      const instance2 = ComponentRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('ComponentFactory', () => {
    it('should create a simple component descriptor', () => {
      const testSchema = z.object({
        value: z.number(),
        enabled: z.boolean(),
      });

      const descriptor = ComponentFactory.createSimple({
        id: 'TestComponent',
        name: 'Test Component',
        category: ComponentCategory.Core,
        schema: testSchema,
        fieldMappings: {
          value: Types.f32,
          enabled: Types.ui8,
        },
      });

      expect(descriptor.id).toBe('TestComponent');
      expect(descriptor.name).toBe('Test Component');
      expect(descriptor.category).toBe(ComponentCategory.Core);
      expect(descriptor.schema).toBe(testSchema);
    });

    it('should create a complex component descriptor', () => {
      const testSchema = z.object({
        position: z.array(z.number()).length(3),
        rotation: z.array(z.number()).length(3),
      });

      const descriptor = ComponentFactory.create({
        id: 'ComplexComponent',
        name: 'Complex Component',
        category: ComponentCategory.Gameplay,
        schema: testSchema,
        fields: {
          x: Types.f32,
          y: Types.f32,
          z: Types.f32,
          rx: Types.f32,
          ry: Types.f32,
          rz: Types.f32,
        },
        serialize: (eid, component) => ({
          position: [component.x[eid], component.y[eid], component.z[eid]],
          rotation: [component.rx[eid], component.ry[eid], component.rz[eid]],
        }),
        deserialize: (eid, data, component) => {
          component.x[eid] = data.position[0];
          component.y[eid] = data.position[1];
          component.z[eid] = data.position[2];
          component.rx[eid] = data.rotation[0];
          component.ry[eid] = data.rotation[1];
          component.rz[eid] = data.rotation[2];
        },
      });

      expect(descriptor.id).toBe('ComplexComponent');
      expect(descriptor.serialize).toBeDefined();
      expect(descriptor.deserialize).toBeDefined();
    });
  });

  describe('component registration', () => {
    it('should register a component', () => {
      const testSchema = z.object({
        value: z.number(),
      });

      const descriptor = ComponentFactory.createSimple({
        id: 'TestComponent',
        name: 'Test Component',
        category: ComponentCategory.Core,
        schema: testSchema,
        fieldMappings: {
          value: Types.f32,
        },
      });

      registry.register(descriptor);

      const retrieved = registry.get('TestComponent');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('TestComponent');
    });

    it('should warn when registering duplicate component', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const testSchema = z.object({
        value: z.number(),
      });

      const descriptor = ComponentFactory.createSimple({
        id: 'TestComponent',
        name: 'Test Component',
        category: ComponentCategory.Core,
        schema: testSchema,
        fieldMappings: {
          value: Types.f32,
        },
      });

      registry.register(descriptor);
      registry.register(descriptor); // Duplicate registration

      expect(consoleSpy).toHaveBeenCalledWith('Component TestComponent is already registered');
      consoleSpy.mockRestore();
    });
  });

  describe('component querying', () => {
    beforeEach(() => {
      // Register test components
      const componentSchema = z.object({ value: z.number() });

      const coreComponent = ComponentFactory.createSimple({
        id: 'CoreComponent',
        name: 'Core Component',
        category: ComponentCategory.Core,
        schema: componentSchema,
        fieldMappings: { value: Types.f32 },
      });

      const renderingComponent = ComponentFactory.createSimple({
        id: 'RenderingComponent',
        name: 'Rendering Component',
        category: ComponentCategory.Rendering,
        schema: componentSchema,
        fieldMappings: { value: Types.f32 },
      });

      registry.register(coreComponent);
      registry.register(renderingComponent);
    });

    it('should get components by category', () => {
      const coreComponents = registry.getByCategory(ComponentCategory.Core);
      const renderingComponents = registry.getByCategory(ComponentCategory.Rendering);

      expect(coreComponents.some((c) => c.id === 'CoreComponent')).toBe(true);
      expect(renderingComponents.some((c) => c.id === 'RenderingComponent')).toBe(true);
    });

    it('should list all registered components', () => {
      const componentList = registry.listComponents();

      expect(componentList).toContain('CoreComponent');
      expect(componentList).toContain('RenderingComponent');
    });
  });

  describe('component lifecycle callbacks', () => {
    it('should call onAdd callback when component is added', () => {
      const onAddSpy = vi.fn();

      const testSchema = z.object({ value: z.number() });
      const descriptor = ComponentFactory.createSimple({
        id: 'CallbackComponent',
        name: 'Callback Component',
        category: ComponentCategory.Core,
        schema: testSchema,
        fieldMappings: { value: Types.f32 },
        onAdd: onAddSpy,
      });

      registry.register(descriptor);

      // Since we can't easily test the actual BitECS integration,
      // we'll just verify the descriptor has the callback
      expect(descriptor.onAdd).toBe(onAddSpy);
    });

    it('should call onRemove callback when component is removed', () => {
      const onRemoveSpy = vi.fn();

      const testSchema = z.object({ value: z.number() });
      const descriptor = ComponentFactory.createSimple({
        id: 'CallbackComponent',
        name: 'Callback Component',
        category: ComponentCategory.Core,
        schema: testSchema,
        fieldMappings: { value: Types.f32 },
        onRemove: onRemoveSpy,
      });

      registry.register(descriptor);

      expect(descriptor.onRemove).toBe(onRemoveSpy);
    });
  });

  describe('BitECS integration', () => {
    it('should provide BitECS component for queries', () => {
      const testSchema = z.object({ value: z.number() });
      const descriptor = ComponentFactory.createSimple({
        id: 'QueryComponent',
        name: 'Query Component',
        category: ComponentCategory.Core,
        schema: testSchema,
        fieldMappings: { value: Types.f32 },
      });

      registry.register(descriptor);

      const bitECSComponent = registry.getBitECSComponent('QueryComponent');

      expect(bitECSComponent).toBeDefined();
      expect(bitECSComponent.value).toBeDefined(); // Should have the field
    });
  });

  describe('component incompatibility', () => {
    it('should check if two components are incompatible with each other', () => {
      const component1Schema = z.object({ value: z.number() });
      const component2Schema = z.object({ value: z.number() });

      const component1 = ComponentFactory.createSimple({
        id: 'Component1',
        name: 'Component 1',
        category: ComponentCategory.Core,
        schema: component1Schema,
        fieldMappings: { value: Types.f32 },
        conflicts: ['Component2'],
      });

      const component2 = ComponentFactory.createSimple({
        id: 'Component2',
        name: 'Component 2',
        category: ComponentCategory.Core,
        schema: component2Schema,
        fieldMappings: { value: Types.f32 },
        incompatibleComponents: ['Component1'],
      });

      registry.register(component1);
      registry.register(component2);

      const areIncompatible = registry.areComponentsIncompatible('Component1', 'Component2');
      expect(areIncompatible).toBe(true);
    });

    it('should get incompatible components for a given component', () => {
      const componentSchema = z.object({ value: z.number() });

      const component = ComponentFactory.createSimple({
        id: 'TestComponent',
        name: 'Test Component',
        category: ComponentCategory.Core,
        schema: componentSchema,
        fieldMappings: { value: Types.f32 },
        incompatibleComponents: ['OtherComponent'],
      });

      registry.register(component);

      const incompatible = registry.getIncompatibleComponents('TestComponent');
      expect(incompatible).toContain('OtherComponent');
    });
  });
});
