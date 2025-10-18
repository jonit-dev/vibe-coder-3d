import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mesh, BoxGeometry, MeshStandardMaterial, PerspectiveCamera, Scene } from 'three';
import { BVHManager } from '../BVHManager';

describe('BVHManager', () => {
  let bvhManager: BVHManager;
  let scene: Scene;
  let camera: PerspectiveCamera;
  let mesh: Mesh;

  beforeEach(() => {
    // Create a fresh BVH manager for each test
    bvhManager = new BVHManager({
      enableFrustumCulling: true,
      enableRaycastAcceleration: true,
      updateInterval: 1000,
      maxLeafTris: 10,
      strategy: 'SAH',
    });

    // Create test scene and camera
    scene = new Scene();
    camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Create test mesh
    const geometry = new BoxGeometry(1, 1, 1);
    geometry.computeBoundingSphere(); // CRITICAL: Ensure bounding sphere is computed for frustum culling
    const material = new MeshStandardMaterial();
    mesh = new Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.updateMatrixWorld();

    scene.add(mesh);
  });

  describe('Frustum Culling with Layers', () => {
    it('should use layers.disable() instead of visible=false for culled objects', () => {
      // Position mesh outside camera frustum
      mesh.position.set(1000, 0, 0);
      mesh.updateMatrixWorld();

      // Perform frustum culling
      bvhManager.performFrustumCulling(scene, camera);

      // CRITICAL: mesh.visible should still be true (physics can run)
      expect(mesh.visible).toBe(true);

      // But mesh should not be on layer 0 (won't render)
      expect(mesh.layers.test(camera.layers)).toBe(false);
    });

    it('should use layers.enable() for objects inside frustum', () => {
      // Position mesh inside camera frustum
      mesh.position.set(0, 0, 0);
      mesh.updateMatrixWorld();

      // Ensure layer 0 is initially disabled
      mesh.layers.disableAll();
      mesh.layers.enable(1); // Some other layer

      // Perform frustum culling
      bvhManager.performFrustumCulling(scene, camera);

      // mesh.visible should remain true
      expect(mesh.visible).toBe(true);

      // Mesh should be on layer 0 (will render)
      expect(mesh.layers.isEnabled(0)).toBe(true);
    });

    it('should preserve physics simulation for culled objects', () => {
      // Position mesh outside frustum
      mesh.position.set(1000, 0, 0);
      mesh.updateMatrixWorld();

      // Mark mesh as having physics (userData convention)
      mesh.userData.hasPhysics = true;

      // Perform culling
      bvhManager.performFrustumCulling(scene, camera);

      // Even though culled, mesh.visible is true so physics can simulate
      expect(mesh.visible).toBe(true);

      // Should be able to simulate physics (move the mesh)
      mesh.position.set(0, 0, 0); // Physics would update this
      expect(mesh.position.x).toBe(0); // Proves object can still be manipulated
    });

    it('should restore layer 0 when object moves back into frustum', () => {
      // Start outside frustum
      mesh.position.set(1000, 0, 0);
      mesh.updateMatrixWorld();

      bvhManager.performFrustumCulling(scene, camera);
      expect(mesh.layers.isEnabled(0)).toBe(false);

      // Simulate physics moving object back into view
      mesh.position.set(0, 0, 0);
      mesh.updateMatrixWorld();

      bvhManager.performFrustumCulling(scene, camera);

      // Should now be on layer 0 again
      expect(mesh.layers.isEnabled(0)).toBe(true);
      expect(mesh.visible).toBe(true);
    });
  });

  describe('Culling Statistics', () => {
    it('should track culled vs visible objects correctly', () => {
      // Create multiple meshes - some inside, some outside frustum
      const mesh2 = mesh.clone();
      mesh2.position.set(1000, 0, 0); // Outside
      scene.add(mesh2);

      const mesh3 = mesh.clone();
      mesh3.position.set(0, 1, 0); // Inside
      scene.add(mesh3);

      scene.traverse((obj) => obj.updateMatrixWorld());

      const stats = bvhManager.performFrustumCulling(scene, camera);

      expect(stats.totalObjects).toBeGreaterThan(0);
      expect(stats.culledObjects).toBeGreaterThan(0);
      expect(stats.visibleObjects).toBeGreaterThan(0);
      expect(stats.culledObjects + stats.visibleObjects).toBe(stats.totalObjects);
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing code that checks mesh.visible', () => {
      // Position outside frustum
      mesh.position.set(1000, 0, 0);
      mesh.updateMatrixWorld();

      bvhManager.performFrustumCulling(scene, camera);

      // Old code checking mesh.visible should still see true
      // (This is critical for physics and other systems)
      if (mesh.visible) {
        // Physics simulation, audio, AI, etc. should still run
        expect(true).toBe(true);
      } else {
        // This branch should NEVER be hit
        expect.fail('mesh.visible should always be true with layers-based culling');
      }
    });
  });
});
