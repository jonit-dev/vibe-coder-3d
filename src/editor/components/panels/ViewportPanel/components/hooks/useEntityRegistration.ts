import { threeJSEntityRegistry } from '@/core/lib/scripting/ThreeJSEntityRegistry';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Logger } from '@/core/lib/logger';

export const useEntityRegistration = (meshRef: React.RefObject<any>, entityId: number) => {
  const logger = Logger.create('EntityRegistration');
  const { scene } = useThree();

  // Register/unregister entity with ThreeJSEntityRegistry for script access
  useEffect(() => {
    if (meshRef?.current && entityId && scene) {
      logger.debug('Registering entity with ThreeJSEntityRegistry:', {
        entityId,
        objectType: meshRef.current.type,
        objectId: meshRef.current.id,
      });

      threeJSEntityRegistry.registerEntity(entityId, meshRef.current, scene);

      // Cleanup on unmount or when object changes
      return () => {
        logger.debug('Unregistering entity from ThreeJSEntityRegistry:', {
          entityId,
        });
        threeJSEntityRegistry.unregisterEntity(entityId);
      };
    }
  }, [meshRef?.current, entityId, scene]);

  // Update registry when meshRef.current changes
  useEffect(() => {
    if (meshRef?.current && entityId && scene && threeJSEntityRegistry.hasEntity(entityId)) {
      logger.debug('Updating entity in ThreeJSEntityRegistry:', {
        entityId,
        newObjectType: meshRef.current.type,
      });
      threeJSEntityRegistry.updateEntity(entityId, meshRef.current, scene);
    }
  }, [meshRef?.current]);
};
