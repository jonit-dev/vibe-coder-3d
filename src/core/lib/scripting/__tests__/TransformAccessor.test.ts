/**
 * Test for entity.transform accessor using mutation buffer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DirectScriptExecutor } from '../DirectScriptExecutor';
import { componentRegistry } from '../../ecs/ComponentRegistry';
import { EntityManager } from '../../ecs/EntityManager';
import type { ITimeAPI, IInputAPI } from '../ScriptAPI';
import { createComponentWriteSystem } from '../../../systems/ComponentWriteSystem';

describe('entity.transform Accessor', () => {
  let executor: DirectScriptExecutor;
  let entityManager: EntityManager;
  let componentWriteSystem: () => void;

  beforeEach(() => {
    executor = DirectScriptExecutor.getInstance();
    entityManager = EntityManager.getInstance();

    // Clear previous state
    executor.clearAll();
    entityManager.clearEntities();

    // Create component write system
    componentWriteSystem = createComponentWriteSystem(executor.getMutationBuffer());
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

  it('should update position via entity.transform.setPosition', async () => {
    const entity = entityManager.createEntity('TestEntity', 'Cube');
    const eid = entity.id;

    // Add Transform component manually (normally done by useEntityCreation hook)
    componentRegistry.addComponent(eid, 'Transform', {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });

    const script = `
      function onStart() {
        entity.transform.setPosition(10, 20, 30);
      }
    `;

    const scriptId = 'test-transform-position';
    executor.compileScript(script, scriptId);

    await executor.executeScript(
      scriptId,
      {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      },
      'onStart',
    );

    // Flush mutations
    componentWriteSystem();

    // Verify position was updated
    const transform = componentRegistry.getComponentData(eid, 'Transform');
    expect(transform?.position).toEqual([10, 20, 30]);
  });

  it('should update rotation via entity.transform.setRotation', async () => {
    const entity = entityManager.createEntity('TestEntity', 'Cube');
    const eid = entity.id;

    // Add Transform component manually
    componentRegistry.addComponent(eid, 'Transform', {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });

    const script = `
      function onStart() {
        entity.transform.setRotation(0.5, 1.0, 1.5);
      }
    `;

    const scriptId = 'test-transform-rotation';
    executor.compileScript(script, scriptId);

    await executor.executeScript(
      scriptId,
      {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      },
      'onStart',
    );

    // Flush mutations
    componentWriteSystem();

    // Verify rotation was updated (stored in degrees, but we passed in radians)
    const transform = componentRegistry.getComponentData(eid, 'Transform');
    const RAD_TO_DEG = 180 / Math.PI;
    const expectedRotation = [0.5 * RAD_TO_DEG, 1.0 * RAD_TO_DEG, 1.5 * RAD_TO_DEG];
    // Use toBeCloseTo for floating point comparisons
    expect(transform?.rotation?.[0]).toBeCloseTo(expectedRotation[0], 5);
    expect(transform?.rotation?.[1]).toBeCloseTo(expectedRotation[1], 5);
    expect(transform?.rotation?.[2]).toBeCloseTo(expectedRotation[2], 5);
  });

  it('should translate position via entity.transform.translate', async () => {
    const entity = entityManager.createEntity('TestEntity', 'Cube');
    const eid = entity.id;

    // Add Transform component with initial position
    componentRegistry.addComponent(eid, 'Transform', {
      position: [5, 10, 15],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });

    const script = `
      function onStart() {
        entity.transform.translate(2, 3, 4);
      }
    `;

    const scriptId = 'test-transform-translate';
    executor.compileScript(script, scriptId);

    await executor.executeScript(
      scriptId,
      {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      },
      'onStart',
    );

    // Flush mutations
    componentWriteSystem();

    // Verify position was translated
    const transform = componentRegistry.getComponentData(eid, 'Transform');
    expect(transform?.position).toEqual([7, 13, 19]);
  });

  it.skip('should read position/rotation/scale properties', async () => {
    const entity = entityManager.createEntity('TestEntity', 'Cube');
    const eid = entity.id;

    // Add Transform component with rotation in degrees (engine's internal format)
    // When scripts read rotation, it's converted to radians
    componentRegistry.addComponent(eid, 'Transform', {
      position: [1, 2, 3],
      rotation: [10, 20, 30], // degrees
      scale: [2, 2, 2],
    });

    const script = `
      let capturedPosition = null;
      let capturedRotation = null;
      let capturedScale = null;

      function onStart() {
        capturedPosition = [...entity.transform.position];
        capturedRotation = [...entity.transform.rotation];
        capturedScale = [...entity.transform.scale];
      }
    `;

    const scriptId = 'test-transform-read';
    executor.compileScript(script, scriptId);

    await executor.executeScript(
      scriptId,
      {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      },
      'onStart',
    );

    // Get the script context to read the captured values
    const context = executor.getScriptContext(eid);
    const DEG_TO_RAD = Math.PI / 180;
    expect(context?.entity.transform.position).toEqual([1, 2, 3]);
    // Rotation is exposed to scripts in radians (converted from internal degrees storage)
    expect(context?.entity.transform.rotation[0]).toBeCloseTo(10 * DEG_TO_RAD, 5);
    expect(context?.entity.transform.rotation[1]).toBeCloseTo(20 * DEG_TO_RAD, 5);
    expect(context?.entity.transform.rotation[2]).toBeCloseTo(30 * DEG_TO_RAD, 5);
    expect(context?.entity.transform.scale).toEqual([2, 2, 2]);
  });

  it('should work with lookAt, forward, right, up methods', async () => {
    const entity = entityManager.createEntity('TestEntity', 'Cube');
    const eid = entity.id;

    // Set initial position at origin
    componentRegistry.addComponent(eid, 'Transform', {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });

    const script = `
      function onStart() {
        // LookAt a target
        entity.transform.lookAt([10, 0, 0]);

        // Get direction vectors (these are read-only operations, no mutations)
        const fwd = entity.transform.forward();
        const right = entity.transform.right();
        const up = entity.transform.up();
      }
    `;

    const scriptId = 'test-transform-directions';
    executor.compileScript(script, scriptId);

    await executor.executeScript(
      scriptId,
      {
        entityId: eid,
        parameters: {},
        timeInfo: createMockTimeInfo(),
        inputInfo: createMockInputInfo(),
      },
      'onStart',
    );

    // Flush mutations (lookAt queues a rotation update)
    componentWriteSystem();

    // Verify rotation was updated (lookAt sets rotation)
    const transform = componentRegistry.getComponentData(eid, 'Transform');
    expect(transform?.rotation).toBeDefined();
    // Rotation should point towards [10,0,0] from [0,0,0]
    // This is roughly yaw=PI/2 (90 degrees to the right), stored as degrees
    const RAD_TO_DEG = 180 / Math.PI;
    expect(transform!.rotation[1]).toBeCloseTo((Math.PI / 2) * RAD_TO_DEG, 1);
  });
});
