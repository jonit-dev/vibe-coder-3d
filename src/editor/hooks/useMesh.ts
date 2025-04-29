import { useCallback, useEffect, useState } from 'react';

import { MeshType, MeshTypeEnum, updateMeshType } from '@core/lib/ecs';

export interface IUseMesh {
  meshType: string;
  setMeshType: (type: string) => void;
  meshTypeEnumToString: (type: MeshTypeEnum | undefined) => string;
  meshTypeStringToEnum: (type: string) => MeshTypeEnum | undefined;
}

export const useMesh = (selectedEntity: number | null): IUseMesh => {
  const [meshType, setMeshTypeState] = useState<string>('unknown');

  useEffect(() => {
    if (selectedEntity == null) return;
    setMeshTypeState(meshTypeEnumToString(MeshType.type[selectedEntity]));
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
    (type: string) => {
      if (selectedEntity == null) return;
      const meshTypeEnum = meshTypeStringToEnum(type);
      if (meshTypeEnum === undefined) return;
      updateMeshType(selectedEntity, meshTypeEnum);
      setMeshTypeState(type);
    },
    [selectedEntity, meshTypeStringToEnum],
  );

  return { meshType, setMeshType, meshTypeEnumToString, meshTypeStringToEnum };
};
