import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

// Extend the Window interface for debugging
interface IDebugWindow extends Window {
  __r3fScene?: THREE.Scene;
}

/**
 * Component that exposes the Three.js scene to window for debugging
 * Allows external components to count triangles and inspect the scene
 */
export const SceneStatsExporter: React.FC = () => {
  const { scene } = useThree();

  useEffect(() => {
    // Expose scene to window for triangle counting
    const debugWindow = window as IDebugWindow;
    debugWindow.__r3fScene = scene;

    return () => {
      delete debugWindow.__r3fScene;
    };
  }, [scene]);

  return null;
};
