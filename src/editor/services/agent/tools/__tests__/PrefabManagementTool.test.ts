/**
 * Tests for Prefab Management Tool
 * Ensures prefabs are created and instantiated correctly
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { executePrefabManagement } from '../PrefabManagementTool';

describe('PrefabManagementTool - create_from_primitives', () => {
  let dispatchedEvents: CustomEvent[] = [];

  beforeEach(() => {
    dispatchedEvents = [];

    // Mock window.dispatchEvent to capture events
    vi.spyOn(window, 'dispatchEvent').mockImplementation((event: Event) => {
      if (event instanceof CustomEvent) {
        dispatchedEvents.push(event);
      }
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should dispatch create-prefab-from-primitives event with correct data', async () => {
    const primitives = [
      {
        type: 'Cylinder',
        position: { x: 0, y: 0.5, z: 0 },
        scale: { x: 0.2, y: 1, z: 0.2 },
        name: 'Trunk',
        material: { color: '#8B4513' },
      },
      {
        type: 'Cone',
        position: { x: 0, y: 1.5, z: 0 },
        scale: { x: 1.5, y: 2, z: 1.5 },
        name: 'Foliage',
        material: { color: '#228B22' },
      },
    ];

    const result = await executePrefabManagement({
      action: 'create_from_primitives',
      name: 'Pine Tree',
      primitives,
    });

    // Check that the event was dispatched
    const createEvent = dispatchedEvents.find(
      (e) => e.type === 'agent:create-prefab-from-primitives',
    );

    expect(createEvent).toBeDefined();
    expect(createEvent?.detail).toEqual({
      name: 'Pine Tree',
      primitives,
    });

    // Check the return message
    expect(result).toContain('Created prefab "Pine Tree"');
    expect(result).toContain('id: "pine-tree"');
    expect(result).toContain('2 primitives');
    expect(result).toContain('Use the instantiate action');
    expect(result).toContain('prefab_id="pine-tree"');
  });

  it('should require name parameter', async () => {
    const result = await executePrefabManagement({
      action: 'create_from_primitives',
      primitives: [{ type: 'Cube' }],
    });

    expect(result).toContain('Error');
    expect(result).toContain('name');
  });

  it('should require primitives array', async () => {
    const result = await executePrefabManagement({
      action: 'create_from_primitives',
      name: 'Test',
    });

    expect(result).toContain('Error');
    expect(result).toContain('primitives');
  });

  it('should generate kebab-case prefab ID from name', async () => {
    await executePrefabManagement({
      action: 'create_from_primitives',
      name: 'My Cool Prefab',
      primitives: [{ type: 'Cube' }],
    });

    const result = await executePrefabManagement({
      action: 'create_from_primitives',
      name: 'My Cool Prefab',
      primitives: [{ type: 'Cube' }],
    });

    expect(result).toContain('id: "my-cool-prefab"');
  });
});

describe('PrefabManagementTool - instantiate', () => {
  let dispatchedEvents: CustomEvent[] = [];

  beforeEach(() => {
    dispatchedEvents = [];
    vi.spyOn(window, 'dispatchEvent').mockImplementation((event: Event) => {
      if (event instanceof CustomEvent) {
        dispatchedEvents.push(event);
      }
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should dispatch instantiate-prefab event with position', async () => {
    const result = await executePrefabManagement({
      action: 'instantiate',
      prefab_id: 'pine-tree',
      position: { x: 5, y: 0, z: 10 },
    });

    const instantiateEvent = dispatchedEvents.find((e) => e.type === 'agent:instantiate-prefab');

    expect(instantiateEvent).toBeDefined();
    expect(instantiateEvent?.detail).toEqual({
      prefabId: 'pine-tree',
      position: [5, 0, 10],
    });

    expect(result).toContain('Instantiated prefab "pine-tree"');
    expect(result).toContain('at (5, 0, 10)');
  });

  it('should use origin as default position', async () => {
    await executePrefabManagement({
      action: 'instantiate',
      prefab_id: 'pine-tree',
    });

    const instantiateEvent = dispatchedEvents.find((e) => e.type === 'agent:instantiate-prefab');

    expect(instantiateEvent?.detail.position).toEqual([0, 0, 0]);
  });

  it('should require prefab_id', async () => {
    const result = await executePrefabManagement({
      action: 'instantiate',
    });

    expect(result).toContain('Error');
    expect(result).toContain('prefab_id');
  });
});

describe('PrefabManagementTool - list_prefabs', () => {
  let dispatchedEvents: CustomEvent[] = [];
  const eventListeners: Map<string, EventListener> = new Map();

  beforeEach(() => {
    dispatchedEvents = [];
    eventListeners.clear();

    // Mock addEventListener to track listeners
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (type: string, listener: EventListener) => {
        eventListeners.set(type, listener);
      },
    );

    // Mock dispatchEvent to trigger result event
    vi.spyOn(window, 'dispatchEvent').mockImplementation((event: Event) => {
      if (event instanceof CustomEvent) {
        dispatchedEvents.push(event);

        // Simulate response for list-prefabs
        if (event.type === 'agent:list-prefabs') {
          const resultListener = eventListeners.get('agent:prefab-list-result');
          if (resultListener) {
            const resultEvent = new CustomEvent('agent:prefab-list-result', {
              detail: {
                prefabs: [
                  { id: 'pine-tree', name: 'Pine Tree', tags: ['nature', 'tree'] },
                  { id: 'rock', name: 'Rock', tags: ['nature'] },
                ],
              },
            });
            resultListener(resultEvent);
          }
        }
      }
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should list prefabs with tags', async () => {
    const result = await executePrefabManagement({
      action: 'list_prefabs',
    });

    expect(result).toContain('Pine Tree');
    expect(result).toContain('id: "pine-tree"');
    expect(result).toContain('tags: nature, tree');
    expect(result).toContain('Rock');
    expect(result).toContain('id: "rock"');
  });
});

describe('PrefabManagementTool - duplication prevention', () => {
  it('should explain how to instantiate manually to avoid duplicates', async () => {
    const primitives = [
      {
        type: 'Cube',
        position: { x: 0, y: 0, z: 0 },
        name: 'Part1',
      },
      {
        type: 'Sphere',
        position: { x: 1, y: 0, z: 0 },
        name: 'Part2',
      },
    ];

    const result = await executePrefabManagement({
      action: 'create_from_primitives',
      name: 'Test Prefab',
      primitives,
    });

    // The result should explain how to instantiate manually to prevent duplicates
    expect(result).toContain('Use the instantiate action');
    expect(result).toContain('prefab_id="test-prefab"');
    expect(result).toContain('place instances in the scene');
  });
});
