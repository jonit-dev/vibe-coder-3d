import { describe, it, expect } from 'vitest';
import { Container } from '@core/lib/di/Container';

import { createEngineInstance, isEngineInstance } from '../createEngineInstance';

describe('createEngineInstance', () => {
  it('should create isolated engine instances', () => {
    const instanceA = createEngineInstance();
    const instanceB = createEngineInstance();

    expect(instanceA).toBeDefined();
    expect(instanceB).toBeDefined();
    expect(instanceA).not.toBe(instanceB);

    // Verify each instance has required properties
    expect(instanceA.world).toBeDefined();
    expect(instanceA.entityManager).toBeDefined();
    expect(instanceA.componentRegistry).toBeDefined();
    expect(instanceA.container).toBeDefined();
    expect(instanceA.dispose).toBeDefined();

    // Verify instances are different
    expect(instanceA.world).not.toBe(instanceB.world);
    expect(instanceA.container).not.toBe(instanceB.container);
  });

  it('should create child container when parent provided', () => {
    const parentContainer = new Container();
    parentContainer.register('testService', () => 'test-value');

    const instance = createEngineInstance(parentContainer);

    // Should be able to resolve parent services
    expect(instance.container.resolve('testService')).toBe('test-value');

    // Should be a different container instance
    expect(instance.container).not.toBe(parentContainer);
  });

  it('should register services in container', () => {
    const instance = createEngineInstance();

    expect(instance.container.has('ECSWorld')).toBe(true);
    expect(instance.container.has('EntityManager')).toBe(true);
    expect(instance.container.has('ComponentRegistry')).toBe(true);

    expect(instance.container.resolve('ECSWorld')).toBe(instance.world);
    expect(instance.container.resolve('EntityManager')).toBe(instance.entityManager);
    expect(instance.container.resolve('ComponentRegistry')).toBe(instance.componentRegistry);
  });

  it('should cleanup properly on dispose', () => {
    const instance = createEngineInstance();

    expect(instance.world).toBeDefined();

    instance.dispose();

    // After dispose, container should be cleared
    expect(instance.container.has('ECSWorld')).toBe(false);
  });

  it('should work with type guard', () => {
    const instance = createEngineInstance();
    const notAnInstance = { some: 'object' };

    expect(isEngineInstance(instance)).toBe(true);
    expect(isEngineInstance(notAnInstance)).toBe(false);
    expect(isEngineInstance(null)).toBe(false);
    expect(isEngineInstance(undefined)).toBe(false);
  });
});
