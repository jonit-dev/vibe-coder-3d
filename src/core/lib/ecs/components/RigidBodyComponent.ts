export interface IRigidBodyData {
  type: string;
  mass: number;
  isStatic?: boolean;
  restitution?: number;
  friction?: number;
  enabled?: boolean;
  bodyType?: 'dynamic' | 'kinematic' | 'fixed';
  gravityScale?: number;
  canSleep?: boolean;
  material?: {
    friction?: number;
    restitution?: number;
    density?: number;
  };
}
