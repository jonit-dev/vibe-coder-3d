/**
 * QueryAPI Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQueryAPI } from '../QueryAPI';
import * as THREE from 'three';

describe('QueryAPI', () => {
  const entityId = 1;
  let queryAPI: ReturnType<typeof createQueryAPI>;
  let scene: THREE.Scene;

  beforeEach(() => {
    // Create a simple scene with some objects
    scene = new THREE.Scene();

    const mesh1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh1.position.set(0, 0, 0);
    mesh1.name = 'box1';
    scene.add(mesh1);

    const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial());
    mesh2.position.set(2, 0, 0);
    mesh2.name = 'sphere1';
    scene.add(mesh2);

    queryAPI = createQueryAPI(entityId, () => scene);
  });

  it('should create a query API instance', () => {
    expect(queryAPI).toBeDefined();
    expect(queryAPI.findByTag).toBeInstanceOf(Function);
    expect(queryAPI.raycastFirst).toBeInstanceOf(Function);
    expect(queryAPI.raycastAll).toBeInstanceOf(Function);
  });

  it('should raycast and find first hit', () => {
    const origin: [number, number, number] = [0, 5, 0];
    const direction: [number, number, number] = [0, -1, 0];

    const hit = queryAPI.raycastFirst(origin, direction);

    expect(hit).toBeTruthy();
    if (hit) {
      expect((hit as any).object).toBeDefined();
      expect((hit as any).distance).toBeGreaterThan(0);
    }
  });

  it('should raycast and find all hits', () => {
    const origin: [number, number, number] = [0, 5, 0];
    const direction: [number, number, number] = [0, -1, 0];

    const hits = queryAPI.raycastAll(origin, direction);

    expect(Array.isArray(hits)).toBe(true);
    expect(hits.length).toBeGreaterThan(0);
  });

  it('should return null when raycast misses', () => {
    // Raycast in direction with no objects
    const origin: [number, number, number] = [100, 100, 100];
    const direction: [number, number, number] = [0, 1, 0];

    const hit = queryAPI.raycastFirst(origin, direction);

    expect(hit).toBeNull();
  });

  it('should return empty array when raycast misses all objects', () => {
    // Raycast in direction with no objects
    const origin: [number, number, number] = [100, 100, 100];
    const direction: [number, number, number] = [0, 1, 0];

    const hits = queryAPI.raycastAll(origin, direction);

    expect(Array.isArray(hits)).toBe(true);
    expect(hits.length).toBe(0);
  });

  it('should handle missing scene gracefully', () => {
    const noSceneAPI = createQueryAPI(entityId, () => null);

    const hit = noSceneAPI.raycastFirst([0, 0, 0], [0, 1, 0]);
    expect(hit).toBeNull();

    const hits = noSceneAPI.raycastAll([0, 0, 0], [0, 1, 0]);
    expect(Array.isArray(hits)).toBe(true);
    expect(hits.length).toBe(0);
  });

  it('should find by tag (stub - returns empty for now)', () => {
    const entities = queryAPI.findByTag('player');

    expect(Array.isArray(entities)).toBe(true);
    expect(entities.length).toBe(0); // Stub implementation
  });

  it('should normalize raycast direction', () => {
    // Use non-normalized direction
    const origin: [number, number, number] = [0, 5, 0];
    const direction: [number, number, number] = [0, -10, 0]; // Not normalized

    const hit = queryAPI.raycastFirst(origin, direction);

    // Should still work because API normalizes
    expect(hit).toBeTruthy();
  });

  it('should raycast through multiple objects', () => {
    // Add another mesh above the first
    const mesh3 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh3.position.set(0, 2, 0);
    scene.add(mesh3);

    const origin: [number, number, number] = [0, 5, 0];
    const direction: [number, number, number] = [0, -1, 0];

    const hits = queryAPI.raycastAll(origin, direction);

    // Should hit multiple objects
    expect(hits.length).toBeGreaterThanOrEqual(2);

    // Hits should be ordered by distance
    if (hits.length >= 2) {
      const hit1 = hits[0] as any;
      const hit2 = hits[1] as any;
      expect(hit1.distance).toBeLessThan(hit2.distance);
    }
  });
});
