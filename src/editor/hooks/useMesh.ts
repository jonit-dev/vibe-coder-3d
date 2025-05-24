import { useCallback, useEffect, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';
import { MeshTypeEnum } from '@core/lib/ecs';

export interface IUseMesh {
  meshType: string;
  setMeshType: (type: string) => void;
  meshTypeEnumToString: (type: MeshTypeEnum | undefined) => string;
  meshTypeStringToEnum: (type: string) => MeshTypeEnum | undefined;
}

export const useMesh = (selectedEntity: number | null): IUseMesh => {
  const [meshType, setMeshTypeState] = useState<string>('unknown');

  useEffect(() => {
    if (selectedEntity == null) {
      setMeshTypeState('unknown');
      return;
    }

    const updateMeshType = () => {
      const meshTypeData = componentManager.getComponentData(selectedEntity, 'meshType');
      if (meshTypeData?.type !== undefined) {
        setMeshTypeState(meshTypeEnumToString(meshTypeData.type));
      } else {
        setMeshTypeState('unknown');
      }
    };

    // Initial load
    updateMeshType();

    // Listen for component changes
    const handleComponentChange = (event: any) => {
      if (event.entityId === selectedEntity && event.componentId === 'meshType') {
        updateMeshType();
      }
    };

    componentManager.addEventListener(handleComponentChange);

    return () => {
      componentManager.removeEventListener(handleComponentChange);
    };
  }, [selectedEntity]);

  const meshTypeEnumToString = useCallback((type: MeshTypeEnum | undefined): string => {
    switch (type) {
      case MeshTypeEnum.Cube:
        return 'Cube';
      case MeshTypeEnum.Sphere:
        return 'Sphere';
      case MeshTypeEnum.Cylinder:
        return 'Cylinder';
      case MeshTypeEnum.Cone:
        return 'Cone';
      case MeshTypeEnum.Torus:
        return 'Torus';
      case MeshTypeEnum.Plane:
        return 'Plane';
      default:
        return 'unknown';
    }
  }, []);

  const meshTypeStringToEnum = useCallback((type: string): MeshTypeEnum | undefined => {
    switch (type) {
      case 'Cube':
        return MeshTypeEnum.Cube;
      case 'Sphere':
        return MeshTypeEnum.Sphere;
      case 'Cylinder':
        return MeshTypeEnum.Cylinder;
      case 'Cone':
        return MeshTypeEnum.Cone;
      case 'Torus':
        return MeshTypeEnum.Torus;
      case 'Plane':
        return MeshTypeEnum.Plane;
      default:
        return undefined;
    }
  }, []);

  const setMeshType = useCallback(
    async (type: string) => {
      if (selectedEntity == null) return;

      const meshTypeEnum = meshTypeStringToEnum(type);
      if (meshTypeEnum === undefined) {
        console.warn('[useMesh] Invalid mesh type:', type);
        return;
      }

      const result = await componentManager.updateComponent(selectedEntity, 'meshType', {
        type: meshTypeEnum,
      });

      if (result.valid) {
        setMeshTypeState(type);
      } else {
        console.warn('[useMesh] Failed to update mesh type:', result.errors);
      }
    },
    [selectedEntity, meshTypeStringToEnum],
  );

  return { meshType, setMeshType, meshTypeEnumToString, meshTypeStringToEnum };
};
