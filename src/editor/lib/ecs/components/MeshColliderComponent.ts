export interface IMeshColliderData {
  enabled: boolean;
  colliderType: 'box' | 'sphere' | 'capsule' | 'convex' | 'mesh';
  isTrigger: boolean;
  center: [number, number, number];
  size: {
    width: number;
    height: number;
    depth: number;
    radius: number;
    capsuleRadius: number;
    capsuleHeight: number;
  };
  physicsMaterial: {
    friction: number;
    restitution: number;
    density: number;
  };
  // Legacy properties for compatibility
  type?: string;
  meshId?: string;
}
