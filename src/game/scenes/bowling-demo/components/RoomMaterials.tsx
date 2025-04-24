import { FC } from 'react';

// Material properties interfaces
export interface IMaterialProps {
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

// Reusable material components with consistent properties
export const FloorMaterial: FC<IMaterialProps> = ({
  color = '#333333',
  roughness = 0.4,
  metalness = 0.2,
  emissive = '#000000',
  emissiveIntensity = 0,
}) => (
  <meshStandardMaterial
    color={color}
    roughness={roughness}
    metalness={metalness}
    emissive={emissive}
    emissiveIntensity={emissiveIntensity}
  />
);

export const CeilingMaterial: FC<IMaterialProps> = ({
  color = '#e2d7c1',
  roughness = 0.6,
  metalness = 0.1,
  emissive = '#000000',
  emissiveIntensity = 0,
}) => (
  <meshStandardMaterial
    color={color}
    roughness={roughness}
    metalness={metalness}
    emissive={emissive}
    emissiveIntensity={emissiveIntensity}
  />
);

export const WallMaterial: FC<IMaterialProps> = ({
  color = '#666666',
  roughness = 0.7,
  metalness = 0.1,
  emissive = '#000000',
  emissiveIntensity = 0,
}) => (
  <meshStandardMaterial
    color={color}
    roughness={roughness}
    metalness={metalness}
    emissive={emissive}
    emissiveIntensity={emissiveIntensity}
  />
);

export const BackWallMaterial: FC<IMaterialProps> = ({
  color = '#222222',
  roughness = 0.8,
  metalness = 0.2,
  emissive = '#000000',
  emissiveIntensity = 0,
}) => (
  <meshStandardMaterial
    color={color}
    roughness={roughness}
    metalness={metalness}
    emissive={emissive}
    emissiveIntensity={emissiveIntensity}
  />
);

export const FrontWallMaterial: FC<IMaterialProps> = ({
  color = '#151515',
  roughness = 0.7,
  metalness = 0.3,
  emissive = '#000000',
  emissiveIntensity = 0,
}) => (
  <meshStandardMaterial
    color={color}
    roughness={roughness}
    metalness={metalness}
    emissive={emissive}
    emissiveIntensity={emissiveIntensity}
  />
);
