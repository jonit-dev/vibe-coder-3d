import mitt, { Emitter } from 'mitt';

// Example event types (expand as needed)
export type CoreEvents = {
  'physics:collision': { entityA: number; entityB: number; position: any };
  'asset:loaded': { url: string; asset: unknown };
  'scene:loaded': { sceneName: string };
  'input:actionPressed': { action: string };
  'input:actionReleased': { action: string };
  'game:playerDamaged': { damage: number };
  'game:scoreChanged': { newScore: number };
  'game:itemCollected': { itemType: string; entity: number };
  'ui:buttonClicked': { buttonId: string };

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
  emitter.on(type, handler);
  return () => emitter.off(type, handler);
}

export function off<Key extends keyof CoreEvents>(
  type: Key,
  handler: (event: CoreEvents[Key]) => void,
) {
  emitter.off(type, handler);
}
