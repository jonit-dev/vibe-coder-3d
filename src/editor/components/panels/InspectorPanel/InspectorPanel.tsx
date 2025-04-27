import React, { useEffect, useState } from 'react';

import { MeshType, MeshTypeEnum, Transform, updateMeshType } from '@core/lib/ecs';

import { TransformFields } from './TransformFields/TransformFields';

export interface IInspectorPanelProps {
  entityId: number;
  onTransformChange: (transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
}

const sectionTitle =
  'text-xs uppercase text-gray-400 font-semibold pb-1 mb-3 border-b border-gray-700';
const fieldLabel = 'text-xs text-gray-300 w-20 mb-1';

export const InspectorPanel: React.FC<IInspectorPanelProps> = ({ entityId, onTransformChange }) => {
  // Store local copies of ECS data to detect changes
  const [localState, setLocalState] = useState({
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    meshType: MeshTypeEnum.Cube,
  });

  // Force re-render frequently to catch ECS changes
  const [version, setVersion] = useState(0);

  // Use an interval to update local state instead of useFrame (which can only be used in Canvas)
  useEffect(() => {
    // Read from ECS once on mount and when entityId changes
    updateLocalStateFromECS();

    // Set up an interval to poll for changes
    const intervalId = setInterval(() => {
      setVersion((v) => v + 1);
      updateLocalStateFromECS();
    }, 100); // 10 times per second is plenty for editor UI

    return () => clearInterval(intervalId);
  }, [entityId]);

  const updateLocalStateFromECS = () => {
    const newPosition: [number, number, number] = [
      Transform.position[entityId][0],
      Transform.position[entityId][1],
      Transform.position[entityId][2],
    ];
    const newRotation: [number, number, number] = [
      Transform.rotation[entityId][0],
      Transform.rotation[entityId][1],
      Transform.rotation[entityId][2],
    ];
    const newScale: [number, number, number] = [
      Transform.scale[entityId][0],
      Transform.scale[entityId][1],
      Transform.scale[entityId][2],
    ];
    const newMeshType = MeshType.type[entityId];

    // Update local state if ECS data changed
    if (
      newPosition[0] !== localState.position[0] ||
      newPosition[1] !== localState.position[1] ||
      newPosition[2] !== localState.position[2] ||
      newRotation[0] !== localState.rotation[0] ||
      newRotation[1] !== localState.rotation[1] ||
      newRotation[2] !== localState.rotation[2] ||
      newScale[0] !== localState.scale[0] ||
      newScale[1] !== localState.scale[1] ||
      newScale[2] !== localState.scale[2] ||
      newMeshType !== localState.meshType
    ) {
      setLocalState({
        position: newPosition,
        rotation: newRotation,
        scale: newScale,
        meshType: newMeshType,
      });
    }
  };

  // Update ECS when changing mesh type
  const handleMeshTypeChange = (newType: MeshTypeEnum) => {
    updateMeshType(entityId, newType);
    setLocalState({ ...localState, meshType: newType });
  };

  return (
    <aside className="w-80 bg-[#23272e] flex-shrink-0 flex flex-col h-full border-l border-[#181a1b]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#23272e]">
        <div className="text-xs uppercase tracking-wider font-bold text-gray-300">Inspector</div>
      </div>
      <div className="px-3 py-2 border-b border-[#333] flex items-center bg-[#2d2d2d]">
        <div className="flex-1">
          <div className="font-bold text-sm text-white">Entity {entityId}</div>
          <div className="text-xs opacity-50">ID: {entityId}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#23272e]">
        <div className="p-4">
          <div className={sectionTitle}>Mesh Type</div>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <label className={fieldLabel}>Type</label>
              <select
                className="bg-[#383838] border border-[#555] rounded px-2 py-1 text-xs text-white w-full"
                value={localState.meshType}
                onChange={(e) => handleMeshTypeChange(parseInt(e.target.value, 10) as MeshTypeEnum)}
              >
                <option value={MeshTypeEnum.Cube}>Cube</option>
                <option value={MeshTypeEnum.Sphere}>Sphere</option>
              </select>
            </div>
          </div>

          <div className={sectionTitle}>Transform</div>
          <TransformFields
            label="Position"
            value={localState.position}
            onChange={(next: [number, number, number]) => {
              onTransformChange({
                position: next,
                rotation: localState.rotation,
                scale: localState.scale,
              });
              setLocalState({ ...localState, position: next });
            }}
          />
          <TransformFields
            label="Rotation"
            value={localState.rotation}
            onChange={(next: [number, number, number]) => {
              onTransformChange({
                position: localState.position,
                rotation: next,
                scale: localState.scale,
              });
              setLocalState({ ...localState, rotation: next });
            }}
          />
          <TransformFields
            label="Scale"
            value={localState.scale}
            onChange={(next: [number, number, number]) => {
              onTransformChange({
                position: localState.position,
                rotation: localState.rotation,
                scale: next,
              });
              setLocalState({ ...localState, scale: next });
            }}
          />
        </div>
      </div>
      <div className="p-3 border-t border-[#333] bg-[#23272e] flex justify-between">
        <div className="text-xs text-gray-400">Updates: {version}</div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white px-3 py-1 rounded"
          onClick={() => updateLocalStateFromECS()}
        >
          Refresh
        </button>
      </div>
    </aside>
  );
};
