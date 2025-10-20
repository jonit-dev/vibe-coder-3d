import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { parseMetaToBufferGeometry } from '@/core/lib/geometry/metadata/parseMetaToBufferGeometry';
import { type IGeometryMeta } from '@/core/lib/geometry/metadata/IGeometryMeta';

interface IGeometryPreviewProps {
  meta: IGeometryMeta;
  className?: string;
}

const RotatingGeometry: React.FC<{ geometry: THREE.BufferGeometry }> = ({ geometry }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x = Math.PI * 0.1;
    }
  });

  // Compute bounding sphere to auto-scale the geometry
  const scale = useMemo(() => {
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }
    const radius = geometry.boundingSphere?.radius ?? 1;
    // Scale to fit nicely in view (target radius of ~1.2)
    return radius > 0 ? 1.2 / radius : 1;
  }, [geometry]);

  return (
    <mesh ref={meshRef} geometry={geometry} scale={scale}>
      <meshStandardMaterial
        color="#8b5cf6"
        metalness={0.3}
        roughness={0.6}
        flatShading={!geometry.attributes.normal}
      />
    </mesh>
  );
};

export const GeometryPreview: React.FC<IGeometryPreviewProps> = React.memo(({ meta, className = '' }) => {
  const geometry = useMemo(() => {
    try {
      return parseMetaToBufferGeometry(meta);
    } catch (error) {
      console.error('Failed to parse geometry metadata:', error);
      return null;
    }
  }, [meta]);

  if (!geometry) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <p className="text-xs text-gray-500">Preview unavailable</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <directionalLight position={[-5, -5, -5]} intensity={0.2} />
        <RotatingGeometry geometry={geometry} />
      </Canvas>
    </div>
  );
});

GeometryPreview.displayName = 'GeometryPreview';
