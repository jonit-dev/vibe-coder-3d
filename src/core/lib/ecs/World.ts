import { createWorld } from 'bitecs';

// BitECS world is just a plain object, so we'll type it accordingly
interface IWorld {
  time?: {
    delta: number;
    elapsed: number;
    then: number;
  };
  [key: string]: any;
}

export class ECSWorld {
  private static instance: ECSWorld;
  private world: IWorld;

  private constructor() {
    this.world = createWorld();
    this.world.time = { delta: 0, elapsed: 0, then: performance.now() };
  }

  public static getInstance(): ECSWorld {
    if (!ECSWorld.instance) {
      ECSWorld.instance = new ECSWorld();
    }
    return ECSWorld.instance;
  }

  public getWorld(): IWorld {
    return this.world;
  }

  public reset(): void {
    this.world = createWorld();
    this.world.time = { delta: 0, elapsed: 0, then: performance.now() };
  }
}

export { ECSWorld as World };
