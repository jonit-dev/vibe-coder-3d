import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../Container';

// Test classes and services
class TestService {
  constructor(public value: string = 'test') {}
}

class DependentService {
  constructor(public dependency: TestService) {}
}

describe('DI Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe('register', () => {
    it('should register a service with a factory function', () => {
      container.register('testService', () => new TestService('hello'));

      const service = container.resolve<TestService>('testService');
      expect(service).toBeInstanceOf(TestService);
      expect(service.value).toBe('hello');
    });

    it('should default to singleton', () => {
      let counter = 0;
      container.register('counter', () => ({ id: ++counter }));

      const service1 = container.resolve('counter');
      const service2 = container.resolve('counter');

      expect(service1).toBe(service2);
      expect(service1.id).toBe(1);
    });

    it('should support non-singleton (transient) services', () => {
      let counter = 0;
      container.register('counter', () => ({ id: ++counter }), {
        singleton: false,
      });

      const service1 = container.resolve('counter');
      const service2 = container.resolve('counter');

      expect(service1).not.toBe(service2);
      expect(service1.id).toBe(1);
      expect(service2.id).toBe(2);
    });

    it('should support class constructors as tokens', () => {
      container.register(TestService, () => new TestService('test'));

      const service = container.resolve(TestService);
      expect(service).toBeInstanceOf(TestService);
    });
  });

  describe('registerClass', () => {
    it('should register a class constructor', () => {
      container.registerClass(TestService);

      const service = container.resolve(TestService);
      expect(service).toBeInstanceOf(TestService);
      expect(service.value).toBe('test');
    });

    it('should default to singleton for classes', () => {
      container.registerClass(TestService);

      const service1 = container.resolve(TestService);
      const service2 = container.resolve(TestService);

      expect(service1).toBe(service2);
    });

    it('should support non-singleton classes', () => {
      container.registerClass(TestService, { singleton: false });

      const service1 = container.resolve(TestService);
      const service2 = container.resolve(TestService);

      expect(service1).not.toBe(service2);
      expect(service1).toBeInstanceOf(TestService);
      expect(service2).toBeInstanceOf(TestService);
    });
  });

  describe('registerInstance', () => {
    it('should register an existing instance', () => {
      const instance = new TestService('existing');
      container.registerInstance('testService', instance);

      const resolved = container.resolve<TestService>('testService');
      expect(resolved).toBe(instance);
      expect(resolved.value).toBe('existing');
    });

    it('should always return the same instance', () => {
      const instance = new TestService('existing');
      container.registerInstance(TestService, instance);

      const resolved1 = container.resolve(TestService);
      const resolved2 = container.resolve(TestService);

      expect(resolved1).toBe(instance);
      expect(resolved2).toBe(instance);
    });
  });

  describe('resolve', () => {
    it('should throw error for unregistered service', () => {
      expect(() => container.resolve('unknown')).toThrow('Service not registered: unknown');
    });

    it('should resolve registered services', () => {
      container.register('service', () => ({ name: 'test' }));

      const service = container.resolve<{ name: string }>('service');
      expect(service.name).toBe('test');
    });

    it('should create singleton instances on first resolve', () => {
      let callCount = 0;
      container.register('service', () => {
        callCount++;
        return { id: callCount };
      });

      const service1 = container.resolve('service');
      const service2 = container.resolve('service');

      expect(callCount).toBe(1); // Factory called only once
      expect(service1).toBe(service2);
    });

    it('should create new instances for transient services', () => {
      let callCount = 0;
      container.register(
        'service',
        () => {
          callCount++;
          return { id: callCount };
        },
        { singleton: false },
      );

      const service1 = container.resolve('service');
      const service2 = container.resolve('service');

      expect(callCount).toBe(2); // Factory called twice
      expect(service1.id).toBe(1);
      expect(service2.id).toBe(2);
    });
  });

  describe('has', () => {
    it('should return true for registered services', () => {
      container.register('test', () => ({}));

      expect(container.has('test')).toBe(true);
    });

    it('should return false for unregistered services', () => {
      expect(container.has('unknown')).toBe(false);
    });

    it('should work with class constructors', () => {
      container.registerClass(TestService);

      expect(container.has(TestService)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all registered services', () => {
      container.register('service1', () => ({}));
      container.register('service2', () => ({}));

      container.clear();

      expect(container.has('service1')).toBe(false);
      expect(container.has('service2')).toBe(false);
    });

    it('should allow re-registration after clear', () => {
      container.register('service', () => ({ value: 1 }));
      container.clear();
      container.register('service', () => ({ value: 2 }));

      const service = container.resolve<{ value: number }>('service');
      expect(service.value).toBe(2);
    });
  });

  describe('Child Containers', () => {
    it('should create child container', () => {
      const child = container.createChild();

      expect(child).toBeInstanceOf(Container);
      expect(child).not.toBe(container);
    });

    it('should inherit parent services', () => {
      container.register('parentService', () => ({ name: 'parent' }));

      const child = container.createChild();
      const service = child.resolve<{ name: string }>('parentService');

      expect(service.name).toBe('parent');
    });

    it('should allow child to override parent services', () => {
      container.register('service', () => ({ value: 'parent' }));

      const child = container.createChild();
      child.register('service', () => ({ value: 'child' }));

      const parentService = container.resolve<{ value: string }>('service');
      const childService = child.resolve<{ value: string }>('service');

      expect(parentService.value).toBe('parent');
      expect(childService.value).toBe('child');
    });

    it('should not affect parent when registering in child', () => {
      const child = container.createChild();
      child.register('childOnly', () => ({ value: 'child' }));

      expect(child.has('childOnly')).toBe(true);
      expect(container.has('childOnly')).toBe(false);
    });

    it('should throw error when service not in child or parent', () => {
      const child = container.createChild();

      expect(() => child.resolve('unknown')).toThrow('Service not registered: unknown');
    });

    it('should support multiple levels of inheritance', () => {
      container.register('root', () => ({ level: 'root' }));

      const child = container.createChild();
      child.register('child', () => ({ level: 'child' }));

      const grandchild = child.createChild();
      grandchild.register('grandchild', () => ({ level: 'grandchild' }));

      expect(grandchild.resolve<{ level: string }>('root').level).toBe('root');
      expect(grandchild.resolve<{ level: string }>('child').level).toBe('child');
      expect(grandchild.resolve<{ level: string }>('grandchild').level).toBe('grandchild');
    });
  });

  describe('Dependency Injection Patterns', () => {
    it('should support manual dependency injection', () => {
      container.registerClass(TestService);
      container.register('dependent', () => {
        const dependency = container.resolve(TestService);
        return new DependentService(dependency);
      });

      const service = container.resolve<DependentService>('dependent');
      expect(service.dependency).toBeInstanceOf(TestService);
    });

    it('should support service factories with dependencies', () => {
      container.register('config', () => ({ apiKey: 'test-key' }));
      container.register('apiClient', () => {
        const config = container.resolve<{ apiKey: string }>('config');
        return { key: config.apiKey, name: 'client' };
      });

      const client = container.resolve<{ key: string; name: string }>('apiClient');
      expect(client.key).toBe('test-key');
      expect(client.name).toBe('client');
    });

    it('should support replacing services for testing', () => {
      container.register('dataService', () => ({ getData: () => 'real data' }));

      // Create test container
      const testContainer = new Container();
      testContainer.register('dataService', () => ({ getData: () => 'mock data' }));

      const realService = container.resolve<{ getData: () => string }>('dataService');
      const mockService = testContainer.resolve<{ getData: () => string }>('dataService');

      expect(realService.getData()).toBe('real data');
      expect(mockService.getData()).toBe('mock data');
    });
  });
});
