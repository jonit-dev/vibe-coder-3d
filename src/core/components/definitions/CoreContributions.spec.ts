import { describe, it, expect } from 'vitest';

// Import Actual Manifests
import transformManifest from '@core/components/definitions/transform';
import meshRendererManifest from '@core/components/definitions/meshRenderer';
import rigidBodyManifest from '@core/components/definitions/rigidBody';
import meshColliderManifest from '@core/components/definitions/meshCollider';
import cameraManifest from '@core/components/definitions/camera';

// Import Data Types and Contribution Interfaces
import { IRenderingContributions, IPhysicsContributions } from '@core/components/types';
import { TransformData } from './transform'; // Assuming transform.ts exports TransformData
import { MeshRendererData } from './meshRenderer'; // Assuming meshRenderer.ts exports MeshRendererData
import { RigidBodyData } from './rigidBody'; // Assuming rigidBody.ts exports RigidBodyData
import { MeshColliderData } from './meshCollider'; // Assuming meshCollider.ts exports MeshColliderData
import { CameraData } from './camera'; // Assuming camera.ts exports CameraData

describe('Core Component Manifest Contributions', () => {

  describe(transformManifest.id + ' Contributions', () => {
    it('should not have getRenderingContributions defined', () => {
      expect(transformManifest.getRenderingContributions).toBeUndefined();
    });

    it('should not have getPhysicsContributions defined', () => {
      expect(transformManifest.getPhysicsContributions).toBeUndefined();
    });
  });

  describe(meshRendererManifest.id + ' Contributions', () => {
    it('should return correct rendering contributions with default data', () => {
      const defaultData = meshRendererManifest.getDefaultData();
      // Manifest guarantees getRenderingContributions exists
      const contributions = meshRendererManifest.getRenderingContributions!(defaultData);
      
      expect(contributions.meshType).toBe('Cube'); // Default meshId is 'cube'
      expect(contributions.visible).toBe(true); // Default enabled is true
      expect(contributions.castShadow).toBe(true); // Default castShadows is true
      expect(contributions.receiveShadow).toBe(true); // Default receiveShadows is true
      expect(contributions.material?.color).toBe('#3399ff'); // Default color
      expect(contributions.material?.metalness).toBe(0.0);
      expect(contributions.material?.roughness).toBe(0.5);
      expect(contributions.material?.emissive).toBe('#000000');
      expect(contributions.material?.emissiveIntensity).toBe(0.0);
    });

    it('should reflect custom data in rendering contributions', () => {
      const customData: MeshRendererData = {
        meshId: 'sphere',
        materialId: 'customMat',
        enabled: false,
        castShadows: false,
        receiveShadows: false,
        material: { color: '#FF0000', metalness: 0.8, roughness: 0.2, emissive: '#00FF00', emissiveIntensity: 0.5 },
      };
      const contributions = meshRendererManifest.getRenderingContributions!(customData);

      expect(contributions.meshType).toBe('Sphere');
      expect(contributions.visible).toBe(false);
      expect(contributions.castShadow).toBe(false);
      expect(contributions.receiveShadow).toBe(false); // Based on castShadows: false, receiveShadows: false
      expect(contributions.material?.color).toBe('#FF0000');
      expect(contributions.material?.metalness).toBe(0.8);
      expect(contributions.material?.roughness).toBe(0.2);
      expect(contributions.material?.emissive).toBe('#00FF00');
      expect(contributions.material?.emissiveIntensity).toBe(0.5);
    });
  });

  describe(rigidBodyManifest.id + ' Contributions', () => {
    it('should return correct physics contributions with default data', () => {
      const defaultData = rigidBodyManifest.getDefaultData();
      const contributions = rigidBodyManifest.getPhysicsContributions!(defaultData);

      expect(contributions.enabled).toBe(true);
      expect(contributions.rigidBodyProps?.type).toBe('dynamic');
      expect(contributions.rigidBodyProps?.mass).toBe(1);
      expect(contributions.rigidBodyProps?.gravityScale).toBe(1);
      expect(contributions.rigidBodyProps?.canSleep).toBe(true);
      expect(contributions.rigidBodyProps?.linearDamping).toBe(0);
      expect(contributions.rigidBodyProps?.angularDamping).toBe(0);
      expect(contributions.rigidBodyProps?.friction).toBe(0.7);
      expect(contributions.rigidBodyProps?.restitution).toBe(0.3);
      expect(contributions.rigidBodyProps?.density).toBe(1);
    });

    it('should reflect custom data in physics contributions', () => {
      const customData: RigidBodyData = {
        bodyType: 'static',
        mass: 100,
        enabled: false,
        gravityScale: 0,
        canSleep: false,
        linearDamping: 0.5,
        angularDamping: 0.5,
        material: { friction: 0.2, restitution: 0.8, density: 2 },
      };
      const contributions = rigidBodyManifest.getPhysicsContributions!(customData);

      expect(contributions.enabled).toBe(false);
      expect(contributions.rigidBodyProps?.type).toBe('static');
      expect(contributions.rigidBodyProps?.mass).toBe(100);
      expect(contributions.rigidBodyProps?.gravityScale).toBe(0);
      expect(contributions.rigidBodyProps?.canSleep).toBe(false);
      expect(contributions.rigidBodyProps?.linearDamping).toBe(0.5);
      expect(contributions.rigidBodyProps?.angularDamping).toBe(0.5);
      expect(contributions.rigidBodyProps?.friction).toBe(0.2);
      expect(contributions.rigidBodyProps?.restitution).toBe(0.8);
      expect(contributions.rigidBodyProps?.density).toBe(2);
    });
  });

  describe(meshColliderManifest.id + ' Contributions', () => {
    it('should return correct physics contributions with default data', () => {
      const defaultData = meshColliderManifest.getDefaultData();
      const contributions = meshColliderManifest.getPhysicsContributions!(defaultData);

      expect(contributions.enabled).toBe(true);
      // MeshCollider primarily contributes material properties to rigidBodyProps
      expect(contributions.rigidBodyProps?.friction).toBe(0.7);
      expect(contributions.rigidBodyProps?.restitution).toBe(0.3);
      expect(contributions.rigidBodyProps?.density).toBe(1);
      // It doesn't define body type or mass itself
      expect(contributions.rigidBodyProps?.type).toBeUndefined();
      expect(contributions.rigidBodyProps?.mass).toBeUndefined();
    });

    it('should reflect custom data in physics contributions', () => {
      const customData: MeshColliderData = {
        enabled: false,
        colliderType: 'sphere', // This doesn't directly affect contributions structure here
        isTrigger: true,      // This also doesn't directly affect contributions structure here
        center: [0,0,0],
        size: { radius: 1 },
        physicsMaterial: { friction: 0.1, restitution: 0.9, density: 0.5 },
      };
      const contributions = meshColliderManifest.getPhysicsContributions!(customData);
      
      expect(contributions.enabled).toBe(false);
      expect(contributions.rigidBodyProps?.friction).toBe(0.1);
      expect(contributions.rigidBodyProps?.restitution).toBe(0.9);
      expect(contributions.rigidBodyProps?.density).toBe(0.5);
    });

    it('should return enabled: false if data.enabled is false', () => {
        const customData: MeshColliderData = {
            ...meshColliderManifest.getDefaultData(),
            enabled: false,
        };
        const contributions = meshColliderManifest.getPhysicsContributions!(customData);
        expect(contributions.enabled).toBe(false);
        // rigidBodyProps might be undefined or empty if enabled is false,
        // depending on implementation, current implementation still returns them.
        // Let's check they are still there based on current manifest logic.
        expect(contributions.rigidBodyProps?.friction).toBe(0.7);
    });
  });

  describe(cameraManifest.id + ' Contributions', () => {
    it('should return correct rendering contributions with default data', () => {
      const defaultData = cameraManifest.getDefaultData();
      const contributions = cameraManifest.getRenderingContributions!(defaultData);

      expect(contributions.meshType).toBe('CameraGizmo');
      expect(contributions.visible).toBe(true);
      expect(contributions.castShadow).toBe(false);
      expect(contributions.receiveShadow).toBe(false);
    });

    // Camera's getRenderingContributions is not data-dependent, so one test is sufficient.
    // If it became data-dependent, more tests would be needed.
  });
});
