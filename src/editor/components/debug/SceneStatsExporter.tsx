import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * Component that exposes the Three.js scene to window for debugging
 * Allows external components to count triangles and inspect the scene
 */
export const SceneStatsExporter: React.FC = () => {
  const { scene } = useThree();

  useEffect(() => {
    // Expose scene to window for triangle counting
    (window as any).__r3fScene = scene;

    return () => {
      delete (window as any).__r3fScene;
    };
  }, [scene]);

  return null;
};
