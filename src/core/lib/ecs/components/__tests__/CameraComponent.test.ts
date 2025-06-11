import { describe, it, expect } from 'vitest';
import type { ICameraData } from '../CameraComponent';

describe('CameraComponent', () => {
  describe('ICameraData interface', () => {
    it('should have required perspective camera properties', () => {
      const perspectiveCamera: ICameraData = {
        fov: 75,
        near: 0.1,
        far: 1000,
        projectionType: 'perspective',
        orthographicSize: 0,
        depth: 0,
        isMain: true,
      };

      expect(perspectiveCamera.fov).toBe(75);
      expect(perspectiveCamera.near).toBe(0.1);
      expect(perspectiveCamera.far).toBe(1000);
      expect(perspectiveCamera.projectionType).toBe('perspective');
      expect(perspectiveCamera.isMain).toBe(true);
    });

    it('should have required orthographic camera properties', () => {
      const orthographicCamera: ICameraData = {
        fov: 0,
        near: 0.1,
        far: 1000,
        projectionType: 'orthographic',
        orthographicSize: 10,
        depth: 1,
        isMain: false,
      };

      expect(orthographicCamera.projectionType).toBe('orthographic');
      expect(orthographicCamera.orthographicSize).toBe(10);
      expect(orthographicCamera.depth).toBe(1);
      expect(orthographicCamera.isMain).toBe(false);
    });

    it('should support valid projection types', () => {
      const validProjectionTypes: ICameraData['projectionType'][] = ['perspective', 'orthographic'];

      validProjectionTypes.forEach((type) => {
        const camera: ICameraData = {
          fov: 75,
          near: 0.1,
          far: 1000,
          projectionType: type,
          orthographicSize: 10,
          depth: 0,
          isMain: true,
        };

        expect(['perspective', 'orthographic']).toContain(camera.projectionType);
      });
    });

    it('should handle depth ordering correctly', () => {
      const cameras: ICameraData[] = [
        {
          fov: 75,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
          orthographicSize: 0,
          depth: 2,
          isMain: false,
        },
        {
          fov: 60,
          near: 0.1,
          far: 500,
          projectionType: 'perspective',
          orthographicSize: 0,
          depth: 0,
          isMain: true,
        },
        {
          fov: 45,
          near: 0.1,
          far: 100,
          projectionType: 'orthographic',
          orthographicSize: 5,
          depth: 1,
          isMain: false,
        },
      ];

      const sortedByDepth = cameras.sort((a, b) => a.depth - b.depth);
      expect(sortedByDepth[0].depth).toBe(0);
      expect(sortedByDepth[1].depth).toBe(1);
      expect(sortedByDepth[2].depth).toBe(2);
    });

    it('should handle main camera selection', () => {
      const cameras: ICameraData[] = [
        {
          fov: 75,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
          orthographicSize: 0,
          depth: 0,
          isMain: true,
        },
        {
          fov: 60,
          near: 0.1,
          far: 500,
          projectionType: 'perspective',
          orthographicSize: 0,
          depth: 1,
          isMain: false,
        },
      ];

      const mainCameras = cameras.filter((cam) => cam.isMain);
      expect(mainCameras).toHaveLength(1);
      expect(mainCameras[0].depth).toBe(0);
    });

    it('should validate clipping plane values', () => {
      const camera: ICameraData = {
        fov: 75,
        near: 0.1,
        far: 1000,
        projectionType: 'perspective',
        orthographicSize: 0,
        depth: 0,
        isMain: true,
      };

      expect(camera.near).toBeGreaterThan(0);
      expect(camera.far).toBeGreaterThan(camera.near);
    });
  });
});
