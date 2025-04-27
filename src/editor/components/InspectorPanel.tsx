import React, { useEffect, useState } from 'react';

import { getEntityMeshType } from '@/core/helpers/meshUtils';
import { MeshTypeEnum, Transform, updateMeshType } from '@/core/lib/ecs';

import { TransformFields } from './panels/InspectorPanel/TransformFields/TransformFields';

interface IInspectorPanelProps {
  selectedEntity: number | null;
}

export const InspectorPanel: React.FC<IInspectorPanelProps> = ({ selectedEntity }) => {
  const [meshType, setMeshType] = useState<string>('unknown');
  const [version, setVersion] = useState(0);
  const [entityName, setEntityName] = useState<string>('');
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1]);

  // Use interval to update the local state
  useEffect(() => {
    if (selectedEntity === null) return;

    // Initialize state
    const entityMeshType = getEntityMeshType(selectedEntity);
    setMeshType(entityMeshType);
    setEntityName(`Entity ${selectedEntity}`);
    setPosition([
      Transform.position[selectedEntity][0],
      Transform.position[selectedEntity][1],
      Transform.position[selectedEntity][2],
    ]);
    setRotation([
      Transform.rotation[selectedEntity][0],
      Transform.rotation[selectedEntity][1],
      Transform.rotation[selectedEntity][2],
    ]);
    setScale([
      Transform.scale[selectedEntity][0],
      Transform.scale[selectedEntity][1],
      Transform.scale[selectedEntity][2],
    ]);

    // Set up interval to check for changes
    const intervalId = setInterval(() => {
      setVersion((prev) => prev + 1);
      const currentMeshType = getEntityMeshType(selectedEntity);
      if (currentMeshType !== meshType) {
        setMeshType(currentMeshType);
      }
      setPosition([
        Transform.position[selectedEntity][0],
        Transform.position[selectedEntity][1],
        Transform.position[selectedEntity][2],
      ]);
      setRotation([
        Transform.rotation[selectedEntity][0],
        Transform.rotation[selectedEntity][1],
        Transform.rotation[selectedEntity][2],
      ]);
      setScale([
        Transform.scale[selectedEntity][0],
        Transform.scale[selectedEntity][1],
        Transform.scale[selectedEntity][2],
      ]);
    }, 16);

    return () => clearInterval(intervalId);
  }, [selectedEntity, meshType]);

  if (selectedEntity === null) {
    return (
      <div className="inspector-panel">
        <div className="p-4 text-base-content text-opacity-50">No entity selected</div>
      </div>
    );
  }

  const handleMeshTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    let meshTypeEnum: MeshTypeEnum;
    switch (newType) {
      case 'Cube':
        meshTypeEnum = MeshTypeEnum.Cube;
        break;
      case 'Sphere':
        meshTypeEnum = MeshTypeEnum.Sphere;
        break;
      default:
        return;
    }
    updateMeshType(selectedEntity, meshTypeEnum);
    setMeshType(newType);
  };

  const handlePositionChange = (next: [number, number, number]) => {
    setPosition(next);
    Transform.position[selectedEntity][0] = next[0];
    Transform.position[selectedEntity][1] = next[1];
    Transform.position[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
  };

  const handleRotationChange = (next: [number, number, number]) => {
    setRotation(next);
    // Store rotation in degrees in the ECS system
    Transform.rotation[selectedEntity][0] = next[0];
    Transform.rotation[selectedEntity][1] = next[1];
    Transform.rotation[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
  };

  const handleScaleChange = (next: [number, number, number]) => {
    setScale(next);
    Transform.scale[selectedEntity][0] = next[0];
    Transform.scale[selectedEntity][1] = next[1];
    Transform.scale[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
  };

  return (
    <div className="inspector-panel p-4 space-y-4 bg-base-200 rounded-box shadow-xl">
      <div className="text-lg font-bold mb-2">Inspector</div>
      <div className="text-sm text-base-content text-opacity-50">Updates: {version}</div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Entity ID</label>
        <div className="px-2 py-1 bg-base-300 rounded-box text-base-content">{selectedEntity}</div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Name</label>
        <div className="px-2 py-1 bg-base-300 rounded-box text-base-content">{entityName}</div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Mesh Type</label>
        <select
          value={meshType}
          onChange={handleMeshTypeChange}
          className="select select-bordered w-full bg-base-300 text-base-content"
        >
          <option value="unknown" disabled>
            Select mesh type
          </option>
          <option value="Cube">Cube</option>
          <option value="Sphere">Sphere</option>
        </select>
      </div>
      <TransformFields label="Position" value={position} onChange={handlePositionChange} />
      <TransformFields label="Rotation" value={rotation} onChange={handleRotationChange} />
      <TransformFields label="Scale" value={scale} onChange={handleScaleChange} />
    </div>
  );
};
