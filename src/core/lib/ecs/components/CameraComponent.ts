import { CameraPreset } from '@/core/components/cameras/DefaultCamera';

export interface ICameraData {
  /** Camera type/preset */
  preset: CameraPreset;
  /** Field of view (for perspective cameras) */
  fov: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
  /** Whether this camera is the main/active camera */
  isMain: boolean;
  /** Whether camera controls are enabled */
  enableControls: boolean;
  /** Target position to look at */
  target: [number, number, number];
  /** Camera projection type */
  projectionType: 'perspective' | 'orthographic';
  /** Orthographic camera bounds (for orthographic cameras) */
  orthographicSize?: number;
  /** Camera background color */
  backgroundColor?: string;
  /** Whether to clear the depth buffer */
  clearDepth?: boolean;
  /** Camera render priority */
  renderPriority?: number;
}
