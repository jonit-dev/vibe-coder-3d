export interface IRigidBodyData {
  type: string;
  mass: number;
  isStatic?: boolean;
  restitution?: number;
  friction?: number;
  enabled?: boolean;
  bodyType?: 'dynamic' | 'kinematic' | 'static';
  gravityScale?: number;
  canSleep?: boolean;
  material?: {
    friction?: number;
    restitution?: number;
    density?: number;
  };
}
