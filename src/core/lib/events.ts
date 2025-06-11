import mitt, { Emitter } from 'mitt';

// Example event types (expand as needed)
export type CoreEvents = {
  'physics:collision': { entityA: number; entityB: number; point?: number[]; position?: any };
  'asset:loaded': { url?: string; assetId?: string; asset: unknown };
  'scene:loaded': { sceneName: string };
  'input:actionPressed': { action: string };
  'input:actionReleased': { action: string };
  'game:playerDamaged': { damage: number };
  'game:scoreChanged': { newScore: number };
  'game:itemCollected': { itemType: string; entity: number };
  'ui:buttonClicked': { buttonId: string };

  // Entity events
  'entity:created': { entityId: number; componentId?: string };
  'entity:destroyed': { entityId: number };

  // Component system events
  'component:added': { entityId: number; componentId: string; data: any };
  'component:removed': { entityId: number; componentId: string };
  'component:updated': { entityId: number; componentId: string; data: any };
};

export const emitter: Emitter<CoreEvents> = mitt<CoreEvents>();

export function emit<Key extends keyof CoreEvents>(type: Key, event: CoreEvents[Key]) {
  emitter.emit(type, event);
}

export function on<Key extends keyof CoreEvents>(
  type: Key,
  handler: (event: CoreEvents[Key]) => void,
) {
  const wrappedHandler = (event: CoreEvents[Key]) => {
    try {
      handler(event);
    } catch (error) {
      console.error(`Error in event handler for ${type}:`, error);
    }
  };

  emitter.on(type, wrappedHandler);
  return () => emitter.off(type, wrappedHandler);
}

export function off<Key extends keyof CoreEvents>(
  type: Key,
  handler: (event: CoreEvents[Key]) => void,
) {
  emitter.off(type, handler);
}
