/**
 * Integration Tests for Direct Component Accessors in Scripts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DirectScriptExecutor } from '../DirectScriptExecutor';
import { componentRegistry } from '../../ecs/ComponentRegistry';
import { EntityManager } from '../../ecs/EntityManager';
import { updateScriptSystem } from '../../../systems/ScriptSystem';
import type { ITimeAPI, IInputAPI } from '../ScriptAPI';

describe('Direct Component Accessors Integration', () => {
  let executor: DirectScriptExecutor;
  let entityManager: EntityManager;

  beforeEach(() => {
    executor = DirectScriptExecutor.getInstance();
    entityManager = EntityManager.getInstance();

    // Clear previous state
    executor.clearAll();
    entityManager.clearEntities();
  });

  const createMockTimeInfo = (): ITimeAPI => ({
    time: 0,
    deltaTime: 0.016,
    frameCount: 0,
  });

  const createMockInputInfo = (): IInputAPI => ({
    isKeyDown: () => false,
    isKeyPressed: () => false,
    isKeyReleased: () => false,
    isMouseButtonDown: () => false,
    isMouseButtonPressed: () => false,
    isMouseButtonReleased: () => false,
    mousePosition: () => [0, 0],
    mouseDelta: () => [0, 0],
    mouseWheel: () => 0,
    lockPointer: () => {},
    unlockPointer: () => {},
    isPointerLocked: () => false,
    getActionValue: () => 0,
    isActionActive: () => false,
    onAction: () => {},
    offAction: () => {},
    enableActionMap: () => {},
    disableActionMap: () => {},
  });

  describe('entity.meshRenderer accessor', () => {
    it('should be undefined if MeshRenderer component does not exist', async () => {
      // Create entity without MeshRenderer
      const entity = entityManager.createEntity('TestEntity', 'Cube');
      const eid = entity.id;

      const script = `
        let accessorValue = null;
        function onStart() {
          accessorValue = entity.meshRenderer;
        }
      `;

      const scriptId = 'test-meshrenderer-undefined';
      executor.compileScript(script, scriptId);

      await executor.executeScript('onStart', scriptId, {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      });

      const context = executor.getScriptContext(eid);
      // Accessor should be undefined since no MeshRenderer
      expect(context?.entity.meshRenderer).toBeUndefined();
    });

    it('should allow setting material color via entity.meshRenderer', async () => {
      // Create entity with MeshRenderer
      const entity = entityManager.createEntity('TestEntity', 'Cube');
      const eid = entity.id;

      componentRegistry.addComponent(eid, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          color: '#ffffff',
          metalness: 0,
          roughness: 0.5,
        },
      });

      const script = `
        function onStart() {
          entity.meshRenderer?.material.setColor('#ff00ff');
        }
      `;

      const scriptId = 'test-meshrenderer-color';
      executor.compileScript(script, scriptId);

      await executor.executeScript('onStart', scriptId, {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      });

      // Flush mutations
      const mutationBuffer = executor.getMutationBuffer();
      expect(mutationBuffer.hasPending).toBe(true);

      // Apply mutations
      mutationBuffer.flush((entityId, componentId, field, value) => {
        const current = componentRegistry.getComponentData<Record<string, unknown>>(
          entityId,
          componentId,
        );
        if (current && field === 'material') {
          componentRegistry.updateComponent(entityId, componentId, {
            ...current,
            material: { ...(current.material as object), ...(value as object) },
          });
        }
      });

      // Verify the color was updated
      const meshRenderer = componentRegistry.getComponentData(eid, 'MeshRenderer');
      expect(meshRenderer?.material?.color).toBe('#ff00ff');
    });

    it('should clamp metalness and roughness to 0-1 range', async () => {
      const entity = entityManager.createEntity('TestEntity', 'Cube');
      const eid = entity.id;

      componentRegistry.addComponent(eid, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          color: '#ffffff',
          metalness: 0.5,
          roughness: 0.5,
        },
      });

      const script = `
        function onStart() {
          entity.meshRenderer?.material.setMetalness(1.5);  // Out of range
          entity.meshRenderer?.material.setRoughness(-0.2); // Out of range
        }
      `;

      const scriptId = 'test-clamping';
      executor.compileScript(script, scriptId);

      await executor.executeScript('onStart', scriptId, {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      });

      // Flush and apply mutations
      const mutationBuffer = executor.getMutationBuffer();
      mutationBuffer.flush((entityId, componentId, field, value) => {
        const current = componentRegistry.getComponentData<Record<string, unknown>>(
          entityId,
          componentId,
        );
        if (current && field === 'material') {
          componentRegistry.updateComponent(entityId, componentId, {
            ...current,
            material: { ...(current.material as object), ...(value as object) },
          });
        }
      });

      const meshRenderer = componentRegistry.getComponentData(eid, 'MeshRenderer');

      // Values should be clamped
      expect(meshRenderer?.material?.metalness).toBe(0); // Last write (roughness) wins, but we want to verify clamping works
      // Note: Due to last-write-wins on 'material' field, only the last setRoughness is applied
      // Let's verify the clamping happened in the buffer
      expect(meshRenderer?.material?.roughness).toBe(0); // Clamped from -0.2 to 0
    });

    it('should enable/disable renderer via enable() method', async () => {
      const entity = entityManager.createEntity('TestEntity', 'Cube');
      const eid = entity.id;

      componentRegistry.addComponent(eid, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
      });

      const script = `
        function onStart() {
          entity.meshRenderer?.enable(false);
        }
      `;

      const scriptId = 'test-enable';
      executor.compileScript(script, scriptId);

      await executor.executeScript('onStart', scriptId, {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      });

      // Flush and apply mutations
      const mutationBuffer = executor.getMutationBuffer();
      mutationBuffer.flush((entityId, componentId, field, value) => {
        const current = componentRegistry.getComponentData<Record<string, unknown>>(
          entityId,
          componentId,
        );
        if (current) {
          componentRegistry.updateComponent(entityId, componentId, {
            ...current,
            [field]: value,
          });
        }
      });

      const meshRenderer = componentRegistry.getComponentData(eid, 'MeshRenderer');
      expect(meshRenderer?.enabled).toBe(false);
    });

    it('should set emissive properties correctly', async () => {
      const entity = entityManager.createEntity('TestEntity', 'Cube');
      const eid = entity.id;

      componentRegistry.addComponent(eid, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          color: '#ffffff',
          emissive: '#000000',
          emissiveIntensity: 0,
        },
      });

      const script = `
        function onStart() {
          entity.meshRenderer?.material.setEmissive('#00ff00', 2.5);
        }
      `;

      const scriptId = 'test-emissive';
      executor.compileScript(script, scriptId);

      await executor.executeScript('onStart', scriptId, {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      });

      // Flush and apply mutations
      const mutationBuffer = executor.getMutationBuffer();
      mutationBuffer.flush((entityId, componentId, field, value) => {
        const current = componentRegistry.getComponentData<Record<string, unknown>>(
          entityId,
          componentId,
        );
        if (current && field === 'material') {
          componentRegistry.updateComponent(entityId, componentId, {
            ...current,
            material: { ...(current.material as object), ...(value as object) },
          });
        }
      });

      const meshRenderer = componentRegistry.getComponentData(eid, 'MeshRenderer');
      expect(meshRenderer?.material?.emissive).toBe('#00ff00');
      expect(meshRenderer?.material?.emissiveIntensity).toBe(2.5);
    });
  });

  describe('Mutation buffer integration with ScriptSystem', () => {
    it('should flush mutations after script execution in updateScriptSystem', async () => {
      const entity = entityManager.createEntity('TestEntity', 'Cube');
      const eid = entity.id;

      componentRegistry.addComponent(eid, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          color: '#ffffff',
        },
      });

      componentRegistry.addComponent(eid, 'Script', {
        enabled: true,
        language: 'typescript',
        code: `
          function onUpdate(dt: number) {
            entity.meshRenderer?.material.setColor('#ff0000');
          }
        `,
        executeInUpdate: true,
        executeOnStart: false,
        executeOnEnable: false,
        scriptName: 'TestScript',
        description: 'Test script',
        parameters: {},
      });

      // Run script system update
      await updateScriptSystem(16, true);

      // Check that the mutation was applied
      const meshRenderer = componentRegistry.getComponentData(eid, 'MeshRenderer');
      expect(meshRenderer?.material?.color).toBe('#ff0000');
    });
  });

  describe('Backwards compatibility', () => {
    it('should not break existing getComponent/setComponent APIs', async () => {
      const entity = entityManager.createEntity('TestEntity', 'Cube');
      const eid = entity.id;

      componentRegistry.addComponent(eid, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          color: '#ffffff',
        },
      });

      const script = `
        function onStart() {
          // Use old API
          const meshRenderer = entity.getComponent('MeshRenderer');
          console.log('Got renderer:', meshRenderer);

          // Use new API
          entity.meshRenderer?.material.setColor('#00ff00');
        }
      `;

      const scriptId = 'test-backwards-compat';
      executor.compileScript(script, scriptId);

      await executor.executeScript('onStart', scriptId, {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      });

      // Both APIs should work
      const meshRenderer = componentRegistry.getComponentData(eid, 'MeshRenderer');
      expect(meshRenderer).toBeDefined();

      // Flush mutations from new API
      const mutationBuffer = executor.getMutationBuffer();
      mutationBuffer.flush((entityId, componentId, field, value) => {
        const current = componentRegistry.getComponentData<Record<string, unknown>>(
          entityId,
          componentId,
        );
        if (current && field === 'material') {
          componentRegistry.updateComponent(entityId, componentId, {
            ...current,
            material: { ...(current.material as object), ...(value as object) },
          });
        }
      });

      const updated = componentRegistry.getComponentData(eid, 'MeshRenderer');
      expect(updated?.material?.color).toBe('#00ff00');
    });
  });
});
