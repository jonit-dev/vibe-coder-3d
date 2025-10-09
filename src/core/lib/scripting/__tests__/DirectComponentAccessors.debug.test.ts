/**
 * Debug test to understand what's happening
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DirectScriptExecutor } from '../DirectScriptExecutor';
import { componentRegistry } from '../../ecs/ComponentRegistry';
import { EntityManager } from '../../ecs/EntityManager';
import type { ITimeAPI, IInputAPI } from '../ScriptAPI';

describe('Debug Direct Accessor', () => {
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

  it('should debug meshRenderer accessor', async () => {
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
      let meshRendererValue = null;
      let hasComponent = false;

      function onStart() {
        console.log('Entity:', entity);
        console.log('Entity.meshRenderer:', entity.meshRenderer);
        meshRendererValue = entity.meshRenderer;
        hasComponent = entity.hasComponent('MeshRenderer');

        if (entity.meshRenderer) {
          console.log('Setting color...');
          entity.meshRenderer.material.setColor('#ff00ff');
        } else {
          console.log('meshRenderer is undefined!');
        }
      }
    `;

    const scriptId = 'debug-test';
    executor.compileScript(script, scriptId);

    await executor.executeScript('onStart', scriptId, {
      entityId: eid,
      parameters: {},
      timeInfo: createMockTimeInfo(),
      inputInfo: createMockInputInfo(),
    });

    // Check context
    const context = executor.getScriptContext(eid);
    console.log('Context entity:', context?.entity);
    console.log('Context entity.meshRenderer:', context?.entity.meshRenderer);
    console.log('Entity has keys:', context?.entity ? Object.keys(context.entity) : 'no entity');
    console.log('Has MeshRenderer component:', componentRegistry.hasComponent(eid, 'MeshRenderer'));

    // Check if we can create components API manually
    const { createComponentsAPI } = await import('../apis/ComponentsAPI');
    const { ComponentMutationBuffer } = await import('../../ecs/mutations/ComponentMutationBuffer');
    const testBuffer = new ComponentMutationBuffer();
    const testProxy = createComponentsAPI(eid, testBuffer);
    console.log('Manual proxy.MeshRenderer:', testProxy.MeshRenderer);

    // Check buffer
    const mutationBuffer = executor.getMutationBuffer();
    console.log('Buffer has pending:', mutationBuffer.hasPending);
    console.log('Buffer size:', mutationBuffer.size);
  });
});
