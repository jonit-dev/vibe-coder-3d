import { useCallback, useEffect, useState } from 'react';

import { useComponentManager } from '@/editor/hooks/useComponentManager';

export interface IUseMesh {
  meshType: string;
  setMeshType: (type: string) => void;
  meshTypeEnumToString: (type: string | undefined) => string;
  meshTypeStringToEnum: (type: string) => string | undefined;
}

export const useMesh = (selectedEntity: number | null): IUseMesh => {
  const [meshType, setMeshTypeState] = useState<string>('unknown');
  const componentManager = useComponentManager();

  useEffect(() => {
    if (selectedEntity == null) {
      setMeshTypeState('unknown');
      return;
    }

    const updateMeshType = () => {
      const meshData = componentManager.getComponent(selectedEntity, 'mesh');
      if (meshData?.data && typeof meshData.data === 'object' && meshData.data !== null) {
        const meshTypeValue = (meshData.data as { meshType?: string }).meshType;
        if (meshTypeValue) {
          setMeshTypeState(meshTypeEnumToString(meshTypeValue));
        } else {
          setMeshTypeState('unknown');
        }
      } else {
        setMeshTypeState('unknown');
      }
    };

    // Initial load
    updateMeshType();

    // For now, poll for changes since we don't have an event system yet
    const interval = setInterval(updateMeshType, 100);

    return () => {
      clearInterval(interval);
    };
  }, [selectedEntity, componentManager]);

  const meshTypeEnumToString = useCallback((type: string | undefined): string => {
    switch (type) {
      case 'Cube':
        return 'Cube';
      case 'Sphere':
        return 'Sphere';
      case 'Cylinder':
        return 'Cylinder';
      case 'Cone':
        return 'Cone';
      case 'Torus':
        return 'Torus';
      case 'Plane':
        return 'Plane';
      default:
        return 'unknown';
    }
  }, []);

  const meshTypeStringToEnum = useCallback((type: string): string | undefined => {
    switch (type) {
      case 'Cube':
        return 'Cube';
      case 'Sphere':
        return 'Sphere';
      case 'Cylinder':
        return 'Cylinder';
      case 'Cone':
        return 'Cone';
      case 'Torus':
        return 'Torus';
      case 'Plane':
        return 'Plane';
      default:
        return undefined;
    }
  }, []);

  const setMeshType = useCallback(
    (type: string) => {
      if (selectedEntity == null) return;

      const meshTypeEnum = meshTypeStringToEnum(type);
      if (meshTypeEnum === undefined) {
        console.warn('[useMesh] Invalid mesh type:', type);
        return;
      }

      // Update through ComponentManager
      const currentMesh = componentManager.getComponent(selectedEntity, 'mesh');
      const meshData = currentMesh?.data || {};

      const updatedMesh = {
        ...meshData,
        meshType: meshTypeEnum,
      };

      if (currentMesh) {
        componentManager.updateComponent(selectedEntity, 'mesh', updatedMesh);
      } else {
        componentManager.addComponent(selectedEntity, 'mesh', updatedMesh);
      }

      setMeshTypeState(type);
    },
    [selectedEntity, meshTypeStringToEnum, componentManager],
  );

  return { meshType, setMeshType, meshTypeEnumToString, meshTypeStringToEnum };
};
