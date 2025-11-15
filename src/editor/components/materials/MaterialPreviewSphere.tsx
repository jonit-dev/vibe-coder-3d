import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Color, MeshBasicMaterial, MeshStandardMaterial, Texture, TextureLoader } from 'three';
import * as THREE from 'three';

import type { IMaterialDefinition } from '@/core/materials/Material.types';

export interface IMaterialPreviewSphereProps {
  material: IMaterialDefinition;
  size?: number; // Size in pixels (width/height)
  showControls?: boolean;
  className?: string;
}

interface IPreviewSphereProps {
  material: IMaterialDefinition;
}

const PreviewSphere: React.FC<IPreviewSphereProps> = ({ material }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureLoader = useMemo(() => new TextureLoader(), []);
  const [textures, setTextures] = useState<Record<string, Texture | null>>({});

  // Load textures asynchronously
  useEffect(() => {
    const loadedTextures: Record<string, Texture | null> = {};
    const promises: Promise<void>[] = [];

    const loadTexture = (key: string, url: string | undefined) => {
      if (!url) return;

      const promise = new Promise<void>((resolve) => {
        textureLoader.load(
          url,
          (texture) => {
            loadedTextures[key] = texture;
            resolve();
          },
          undefined,
          () => {
            loadedTextures[key] = null;
            resolve();
          },
        );
      });
      promises.push(promise);
    };

    loadTexture('albedo', material.albedoTexture);
    loadTexture('normal', material.normalTexture);
    loadTexture('metallic', material.metallicTexture);
    loadTexture('roughness', material.roughnessTexture);
    loadTexture('emissive', material.emissiveTexture);
    loadTexture('occlusion', material.occlusionTexture);

    Promise.all(promises).then(() => {
      setTextures(loadedTextures);
    });

    return () => {
      // Cleanup textures on unmount
      Object.values(loadedTextures).forEach((texture) => {
        texture?.dispose();
      });
    };
  }, [material, textureLoader]);

  // Create Three.js material based on definition
  const threeMaterial = useMemo(() => {
    if (material.shader === 'standard') {
      const mat = new MeshStandardMaterial();

      // Set base color
      const color = new Color(material.color);
      mat.color = color;

      // Set PBR properties
      mat.metalness = material.metalness;
      mat.roughness = material.roughness;

      // Set emissive properties
      const emissiveColor = new Color(material.emissive);
      mat.emissive = emissiveColor;
      mat.emissiveIntensity = material.emissiveIntensity;

      // Apply textures
      if (textures.albedo) {
        mat.map = textures.albedo;
        // When texture is present, set color to white and let texture control color
        mat.color.setHex(0xffffff);
      }

      if (textures.normal) {
        mat.normalMap = textures.normal;
        mat.normalScale.set(material.normalScale, material.normalScale);
      }

      if (textures.metallic) {
        mat.metalnessMap = textures.metallic;
      }

      if (textures.roughness) {
        mat.roughnessMap = textures.roughness;
      }

      if (textures.emissive) {
        mat.emissiveMap = textures.emissive;
      }

      if (textures.occlusion) {
        mat.aoMap = textures.occlusion;
        mat.aoMapIntensity = material.occlusionStrength;
      }

      // Apply texture offset
      if (mat.map) {
        mat.map.offset.set(material.textureOffsetX, material.textureOffsetY);
      }

      return mat;
    } else {
      // Unlit shader
      const mat = new MeshBasicMaterial();

      // Set base color
      const color = new Color(material.color);
      mat.color = color;

      // Apply albedo texture if available
      if (textures.albedo) {
        mat.map = textures.albedo;
        mat.color.setHex(0xffffff);
      }

      // Apply texture offset
      if (mat.map) {
        mat.map.offset.set(material.textureOffsetX, material.textureOffsetY);
      }

      return mat;
    }
  }, [material, textures]);

  return (
    <>
      {/* Lighting for PBR materials */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Sphere mesh - reduced geometry segments for faster rendering */}
      <mesh ref={meshRef} material={threeMaterial}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
    </>
  );
};

export const MaterialPreviewSphere: React.FC<IMaterialPreviewSphereProps> = ({
  material,
  size = 120,
  showControls = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-gray-800 border border-gray-600 rounded ${className}`}
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{
          position: [0, 0, 3.5],
          fov: 40,
        }}
        gl={{
          antialias: false, // Disable antialiasing for faster rendering
          alpha: true,
        }}
        dpr={1} // Lock pixel ratio to 1 for consistent performance
        frameloop="demand" // Only render when needed
      >
        <Suspense
          fallback={
            <mesh>
              <sphereGeometry args={[1, 16, 8]} />
              <meshBasicMaterial color="#666666" wireframe />
            </mesh>
          }
        >
          <PreviewSphere material={material} />
          {showControls && (
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              minDistance={2.5}
              maxDistance={6}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};
