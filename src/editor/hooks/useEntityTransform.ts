import { Transform } from '@/core/lib/ecs';

export const useEntityTransform = (entityId: number) => {
  // Read transform from ECS
  const position: [number, number, number] = [
    Transform.position[entityId][0],
    Transform.position[entityId][1],
    Transform.position[entityId][2],
  ];

  const rotation: [number, number, number] = [
    Transform.rotation[entityId][0],
    Transform.rotation[entityId][1],
    Transform.rotation[entityId][2],
  ];

  const scale: [number, number, number] = [
    Transform.scale[entityId][0],
    Transform.scale[entityId][1],
    Transform.scale[entityId][2],
  ];

  return {
    position,
    rotation,
    scale,
    // Helper for rotation in radians
    rotationRadians: [
      rotation[0] * (Math.PI / 180),
      rotation[1] * (Math.PI / 180),
      rotation[2] * (Math.PI / 180),
    ] as [number, number, number],
  };
};
