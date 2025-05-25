import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export type CameraPreset =
  | 'unity-default'
  | 'perspective-game'
  | 'perspective-film'
  | 'orthographic-top'
  | 'orthographic-front'
  | 'isometric';

export interface IDefaultCameraProps {
  /** Camera preset type, defaults to Unity-like settings */
  preset?: CameraPreset;
  /** Override camera position */
  position?: [number, number, number];
  /** Override camera rotation */
  rotation?: [number, number, number];
  /** Override field of view (for perspective cameras) */
  fov?: number;
  /** Override near clipping plane */
  near?: number;
  /** Override far clipping plane */
  far?: number;
  /** Whether to enable orbit controls */
  enableControls?: boolean;
  /** Target object to look at */
  target?: [number, number, number];
  /** Whether this camera should be the default */
  makeDefault?: boolean;
  /** Children components */
  children?: React.ReactNode;
}

/**
 * Unity-like camera presets
 */
const CAMERA_PRESETS: Record<
  CameraPreset,
  Partial<IDefaultCameraProps> & { type: 'perspective' | 'orthographic' }
> = {
  'unity-default': {
    type: 'perspective',
    position: [0, 1, -10],
    target: [0, 0, 0],
    fov: 30, // Updated default FOV
    near: 0.1, // Better near plane
    far: 10, // Updated default far
    enableControls: true,
  },
  'perspective-game': {
    type: 'perspective',
    position: [0, 5, 10],
    target: [0, 0, 0],
    fov: 75,
    near: 0.1,
    far: 1000,
    enableControls: true,
  },
  'perspective-film': {
    type: 'perspective',
    position: [0, 2, 8],
    target: [0, 0, 0],
    fov: 35, // Cinematic FOV
    near: 0.1,
    far: 1000,
    enableControls: true,
  },
  'orthographic-top': {
    type: 'orthographic',
    position: [0, 20, 0],
    rotation: [-Math.PI / 2, 0, 0],
    target: [0, 0, 0],
    near: 0.1,
    far: 1000,
    enableControls: true,
  },
  'orthographic-front': {
    type: 'orthographic',
    position: [0, 0, 20],
    target: [0, 0, 0],
    near: 0.1,
    far: 1000,
    enableControls: true,
  },
  isometric: {
    type: 'orthographic',
    position: [10, 10, 10],
    target: [0, 0, 0],
    near: 0.1,
    far: 1000,
    enableControls: true,
  },
};

/**
 * DefaultCamera component that provides Unity-like camera behavior with presets
 */
export const DefaultCamera: React.FC<IDefaultCameraProps> = ({
  preset = 'unity-default',
  position,
  rotation,
  fov,
  near,
  far,
  enableControls = true,
  target = [0, 0, 0],
  makeDefault = true,
  children,
}) => {
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera>(null);
  const presetConfig = CAMERA_PRESETS[preset];

  // Merge preset with props (props take precedence)
  const finalConfig = {
    position: position || presetConfig.position || [0, 1, -10],
    rotation: rotation || presetConfig.rotation,
    fov: fov || presetConfig.fov || 60,
    near: near || presetConfig.near || 0.3,
    far: far || presetConfig.far || 1000,
    target,
  };

  // Update camera to look at target on each frame if needed
  useFrame(() => {
    if (cameraRef.current && !enableControls) {
      // Only auto-look if controls are disabled (controls handle this otherwise)
      cameraRef.current.lookAt(new THREE.Vector3(...target));
    }
  });

  if (presetConfig.type === 'orthographic') {
    return (
      <>
        <OrthographicCamera
          ref={cameraRef as React.RefObject<THREE.OrthographicCamera>}
          makeDefault={makeDefault}
          position={finalConfig.position}
          rotation={finalConfig.rotation}
          near={finalConfig.near}
          far={finalConfig.far}
          zoom={1}
        />
        {enableControls && <OrbitControls target={target} enableDamping dampingFactor={0.05} />}
        {children}
      </>
    );
  }

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef as React.RefObject<THREE.PerspectiveCamera>}
        makeDefault={makeDefault}
        position={finalConfig.position}
        fov={finalConfig.fov}
        near={finalConfig.near}
        far={finalConfig.far}
        rotation={finalConfig.rotation}
      />
      {enableControls && <OrbitControls target={target} enableDamping dampingFactor={0.05} />}
      {children}
    </>
  );
};

/**
 * Hook to get available camera presets
 */
export const useCameraPresets = () => {
  return {
    presets: CAMERA_PRESETS,
    presetNames: Object.keys(CAMERA_PRESETS) as CameraPreset[],
    getPresetConfig: (preset: CameraPreset) => CAMERA_PRESETS[preset],
  };
};

export default DefaultCamera;
