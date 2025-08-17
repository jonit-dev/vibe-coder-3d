/**
 * Dependency Injection Container
 * Provides a structured way to manage dependencies and avoid singleton pattern
 */

export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T = any> = (...args: any[]) => T;

interface IServiceDefinition<T = any> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * Simple dependency injection container to replace singleton pattern
 */
export class Container {
  private services = new Map<string | Constructor<any>, IServiceDefinition>();

  /**
   * Register a service with the container
   */
  register<T>(
    token: string | Constructor<T>,
    factory: Factory<T>,
    options: { singleton?: boolean } = { singleton: true }
  ): void {
    this.services.set(token, {
      factory,
      singleton: options.singleton ?? true,
    });
  }

  /**
   * Register a class constructor as a service
   */
  registerClass<T>(
    constructor: Constructor<T>,
    options: { singleton?: boolean } = { singleton: true }
  ): void {
    this.register(constructor, () => new constructor(), options);
  }

  /**
   * Register an existing instance
   */
  registerInstance<T>(token: string | Constructor<T>, instance: T): void {
    this.services.set(token, {
      factory: () => instance,
      singleton: true,
      instance,
    });
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: string | Constructor<T>): T {
    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    if (service.singleton) {
      if (!service.instance) {
        service.instance = service.factory();
      }
      return service.instance;
    }

    return service.factory();
  }

  /**
   * Check if a service is registered
   */
  has(token: string | Constructor<any>): boolean {
    return this.services.has(token);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Create a child container that inherits from this one
   */
  createChild(): Container {
    const child = new Container();
    // Copy parent services to child
    for (const [token, service] of this.services) {
      child.services.set(token, { ...service });
    }
    return child;
  }
}

// Global container instance
export const container = new Container();