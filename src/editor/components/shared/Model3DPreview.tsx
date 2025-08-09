import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Environment } from '@react-three/drei';
import { FiRotateCcw, FiAlertCircle } from 'react-icons/fi';
import * as THREE from 'three';

interface IModel3DPreviewProps {
  modelPath: string;
  className?: string;
}

interface IModelSceneProps {
  modelPath: string;
  onError: (error: Error) => void;
  onLoad: (info: { triangles: number; materials: number }) => void;
}

const ModelScene: React.FC<IModelSceneProps> = ({ modelPath, onError, onLoad }) => {
  try {
    const { scene, materials } = useGLTF(modelPath);

    React.useEffect(() => {
      // Calculate triangle count
      let triangles = 0;
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry;
          if (geometry.index) {
            triangles += geometry.index.count / 3;
          } else {
            triangles += geometry.attributes.position.count / 3;
          }
        }
      });

      onLoad({
        triangles: Math.round(triangles),
        materials: Object.keys(materials).length,
      });
    }, [scene, materials, onLoad]);

    return (
      <Center>
        <primitive object={scene.clone()} />
      </Center>
    );
  } catch (error) {
    React.useEffect(() => {
      onError(error as Error);
    }, [error, onError]);
    return null;
  }
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-2">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] text-gray-400">Loading model...</span>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-full p-2 text-center">
    <FiAlertCircle className="text-red-400 mb-2" size={20} />
    <div className="text-[10px] text-red-400 mb-2">Failed to load model</div>
    <div className="text-[10px] text-gray-500 mb-2 break-all">{error}</div>
    <button
      onClick={onRetry}
      className="flex items-center gap-1 px-2 py-1 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
    >
      <FiRotateCcw size={10} />
      Retry
    </button>
  </div>
);

export const Model3DPreview: React.FC<IModel3DPreviewProps> = ({ modelPath, className = '' }) => {
  const [error, setError] = useState<string>('');
  const [modelInfo, setModelInfo] = useState<{ triangles: number; materials: number } | null>(null);
  const [key, setKey] = useState(0); // Force re-mount on retry

  const handleError = (err: Error) => {
    setError(err.message || 'Unknown error');
    setModelInfo(null);
  };

  const handleLoad = (info: { triangles: number; materials: number }) => {
    setError('');
    setModelInfo(info);
  };

  const handleRetry = () => {
    setError('');
    setModelInfo(null);
    setKey((prev) => prev + 1); // Force remount
  };

  if (error) {
    return (
      <div className={`bg-gray-800/50 rounded-md border border-gray-700/30 ${className}`}>
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800/50 rounded-md border border-gray-700/30 overflow-hidden ${className}`}
    >
      <div className="h-24 relative">
        <Canvas
          key={key}
          camera={{ position: [2, 2, 2], fov: 50 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'low-power', // Optimize for battery life
          }}
        >
          <Environment preset="studio" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />

          <Suspense fallback={null}>
            <ModelScene modelPath={modelPath} onError={handleError} onLoad={handleLoad} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            autoRotate={false}
            maxDistance={10}
            minDistance={0.5}
          />
        </Canvas>

        {!modelInfo && !error && (
          <div className="absolute inset-0 bg-gray-800/80 backdrop-blur-sm">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {/* Model Info */}
      {modelInfo && (
        <div className="px-2 py-1.5 bg-gray-900/50 border-t border-gray-700/30">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{modelInfo.triangles.toLocaleString()} tris</span>
            <span>
              {modelInfo.materials} mat{modelInfo.materials !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
