export interface ICameraData {
  /** Field of view (for perspective cameras only) */
  fov: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
  /** Camera projection type */
  projectionType: 'perspective' | 'orthographic';
  /** Orthographic camera size (for orthographic cameras only) */
  orthographicSize: number;
  /** Camera render depth/priority (lower renders first) */
  depth: number;
  /** Whether this camera is the main/active camera */
  isMain: boolean;
}
