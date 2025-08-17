import { useCallback, useRef } from 'react';

import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';

interface IBackupTransform {
  entityId: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/**
 * Hook to manage entity transform state backup and restoration for play mode.
 * 
 * When entering play mode, saves current transform states of all entities.
 * When exiting play mode, restores original transform states.
 * 
 * This ensures that any physics or script modifications during play mode
 * are reverted when the user stops the simulation.
 */
export const usePlayModeState = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  
  // Store backup transform data
  const backupData = useRef<Map<number, IBackupTransform>>(new Map());
  
  /**
   * Backup current transform states of all entities with Transform components
   */
  const backupTransforms = useCallback(() => {
    const backupMap = new Map<number, IBackupTransform>();
    
    // Get all entities
    const allEntities = entityManager.getAllEntities();
    
    for (const entity of allEntities) {
      // Check if entity has a Transform component
      const transformData = componentManager.getComponentData(
        entity.id, 
        KnownComponentTypes.TRANSFORM
      ) as ITransformData | null;
      
      if (transformData) {
        // Store backup of current transform state
        backupMap.set(entity.id, {
          entityId: entity.id,
          position: [...transformData.position] as [number, number, number],
          rotation: [...transformData.rotation] as [number, number, number],
          scale: [...transformData.scale] as [number, number, number],
        });
      }
    }
    
    backupData.current = backupMap;
    console.log(`[PlayModeState] Backed up transforms for ${backupMap.size} entities`);
  }, [entityManager, componentManager]);
  
  /**
   * Restore backed up transform states to all entities
   */
  const restoreTransforms = useCallback(() => {
    let restoredCount = 0;
    
    for (const [entityId, backup] of Array.from(backupData.current.entries())) {
      // Check if entity still exists
      const entity = entityManager.getEntity(entityId);
      if (!entity) {
        console.warn(`[PlayModeState] Entity ${entityId} no longer exists, skipping restore`);
        continue;
      }
      
      // Check if entity still has Transform component
      const currentTransform = componentManager.getComponentData(
        entityId,
        KnownComponentTypes.TRANSFORM
      ) as ITransformData | null;
      
      if (currentTransform) {
        // Restore the backed up transform data
        const restoredTransform: ITransformData = {
          position: backup.position,
          rotation: backup.rotation,
          scale: backup.scale,
        };
        
        componentManager.updateComponent(
          entityId,
          KnownComponentTypes.TRANSFORM,
          restoredTransform
        );
        
        restoredCount++;
      } else {
        console.warn(`[PlayModeState] Entity ${entityId} no longer has Transform component, skipping restore`);
      }
    }
    
    console.log(`[PlayModeState] Restored transforms for ${restoredCount} entities`);
  }, [entityManager, componentManager]);
  
  /**
   * Clear backup data (called when backup is no longer needed)
   */
  const clearBackup = useCallback(() => {
    backupData.current.clear();
    console.log('[PlayModeState] Cleared transform backups');
  }, []);
  
  /**
   * Check if backup data exists
   */
  const hasBackup = useCallback(() => {
    return backupData.current.size > 0;
  }, []);
  
  return {
    backupTransforms,
    restoreTransforms,
    clearBackup,
    hasBackup,
  };
};