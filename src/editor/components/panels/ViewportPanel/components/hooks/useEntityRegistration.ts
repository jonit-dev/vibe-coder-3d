import { threeJSEntityRegistry } from '@/core/lib/scripting/ThreeJSEntityRegistry';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export const useEntityRegistration = (meshRef: React.RefObject<any>, entityId: number) => {
  const { scene } = useThree();

  // Register/unregister entity with ThreeJSEntityRegistry for script access
  useEffect(() => {
    if (meshRef?.current && entityId && scene) {
      console.log('[EntityMesh] Registering entity with ThreeJSEntityRegistry:', {
        entityId,
        objectType: meshRef.current.type,
        objectId: meshRef.current.id,
      });

      threeJSEntityRegistry.registerEntity(entityId, meshRef.current, scene);

      // Cleanup on unmount or when object changes
      return () => {
        console.log('[EntityMesh] Unregistering entity from ThreeJSEntityRegistry:', {
          entityId,
        });
        threeJSEntityRegistry.unregisterEntity(entityId);
      };
    }
  }, [meshRef?.current, entityId, scene]);

  // Update registry when meshRef.current changes
  useEffect(() => {
    if (meshRef?.current && entityId && scene && threeJSEntityRegistry.hasEntity(entityId)) {
      console.log('[EntityMesh] Updating entity in ThreeJSEntityRegistry:', {
        entityId,
        newObjectType: meshRef.current.type,
      });
      threeJSEntityRegistry.updateEntity(entityId, meshRef.current, scene);
    }
  }, [meshRef?.current]);
};
