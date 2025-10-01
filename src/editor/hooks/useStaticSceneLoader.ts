import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import { usePrefabsStore } from '@/editor/store/prefabsStore';
import { SceneLoader } from '@core/lib/serialization/SceneLoader';

/**
 * Hook to load static scene data
 * All loading logic is here - scene files just provide data
 */
export function useStaticSceneLoader(
  entities: unknown[],
  materials: unknown[],
  prefabs: unknown[]
) {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const materialsStore = useMaterialsStore();
  const prefabsStore = usePrefabsStore();

  useEffect(() => {
    const loadScene = async () => {
      const sceneLoader = new SceneLoader();

      await sceneLoader.loadStatic(
        entities,
        materials,
        prefabs,
        entityManager,
        componentManager,
        {
          refreshMaterials: () => materialsStore._refreshMaterials(),
          refreshPrefabs: () => prefabsStore._refreshPrefabs()
        }
      );
    };

    loadScene();
  }, [entities, materials, prefabs, entityManager, componentManager, materialsStore, prefabsStore]);
}
