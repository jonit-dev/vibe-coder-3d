import type { ThreeEvent } from '@react-three/fiber';

// Component data interfaces
export interface IMeshRendererData {
  modelPath?: string;
}

export interface ICameraData {
  fov?: number;
  near?: number;
  far?: number;
}

export interface ILightData {
  lightType?: 'directional' | 'point' | 'spot' | 'ambient';
  color?: string | { r: number; g: number; b: number };
  intensity?: number;
  range?: number;
  angle?: number;
}

// Props interface
export interface IEntityMeshProps {
  meshRef: React.RefObject<any>;
  meshType: string | null;
  renderingContributions: any;
  entityColor: string;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  isPlaying?: boolean;
  entityComponents?: any[];
}
