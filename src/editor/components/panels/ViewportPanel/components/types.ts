import type { ThreeEvent } from '@react-three/fiber';
import type { Group, Mesh, Object3D } from 'three';
import type {
  IEntityComponent,
  IRenderingContributions,
  IMeshRendererData,
  ICameraData,
  ILightData,
} from '@/core/types/entities';

// Re-export for backward compatibility
export type { IMeshRendererData, ICameraData, ILightData };

// Enhanced props interface with proper typing
export interface IEntityMeshProps {
  meshRef: React.RefObject<Group | Mesh | Object3D>;
  meshType: string | null;
  renderingContributions: IRenderingContributions;
  entityColor: string;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  isPlaying?: boolean;
  entityComponents?: IEntityComponent[];
}
