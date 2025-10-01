import { threeJSEntityRegistry } from '@/core/lib/scripting/ThreeJSEntityRegistry';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export const useEntityRegistration = (meshRef: React.RefObject<any>, entityId: number) => {
  const { scene } = useThree();

  // Register/unregister entity with ThreeJSEntityRegistry for script access
  useEffect(() => {
    if (meshRef?.current && entityId && scene) {
      threeJSEntityRegistry.registerEntity(entityId, meshRef.current, scene);

      // Cleanup on unmount or when object changes
      return () => {
        threeJSEntityRegistry.unregisterEntity(entityId);
      };
    }
  }, [meshRef?.current, entityId, scene]);

  // Update registry when meshRef.current changes
  useEffect(() => {
    if (meshRef?.current && entityId && scene && threeJSEntityRegistry.hasEntity(entityId)) {
      threeJSEntityRegistry.updateEntity(entityId, meshRef.current, scene);
    }
  }, [meshRef?.current]);
};
