import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import { GameEngine } from '@/core';

import { DemoSelector } from '../../components/DemoSelector';
import { MenuBackground } from '../../components/MenuBackground';
import { useDemo } from '../stores/demoStore';

import { AdvancedPhysicsDemo } from './AdvancedPhysicsDemo';
import { CameraDemo } from './CameraDemo';
import { EntityScene } from './EntityScene';
import { GameLoopDemo } from './GameLoopDemo';
import { PhysicsDemo } from './PhysicsDemo';

export const MainScene = () => {
  const { currentCategory, currentDemo } = useDemo();

  // Set camera based on the current demo
  const getCameraProps = () => {
    if (currentCategory === 'ecs' && currentDemo === 'entity') {
      return {
        position: [0, 2, 5] as [number, number, number],
        fov: 75,
      };
    }
    return {
      position: [-21.56, 3.02, 17.68] as [number, number, number],
      fov: 40,
    };
  };

  // Check if we need to use the core GameEngine for this scene
  const needsGameEngine = currentCategory === 'ecs';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Canvas
        shadows={currentCategory === 'ecs'}
        camera={getCameraProps()}
        style={{ background: '#000000' }}
      >
        <Suspense fallback={null}>
          {needsGameEngine ? (
            <GameEngine noCanvas>
              {currentCategory === 'ecs' && currentDemo === 'entity' && <EntityScene />}
            </GameEngine>
          ) : (
            <>
              {currentCategory === 'cameras' ? (
                <>
                  {currentDemo === 'orbit' && <CameraDemo type="orbit" />}
                  {currentDemo === 'thirdPerson' && <CameraDemo type="thirdPerson" />}
                  {currentDemo === 'firstPerson' && <CameraDemo type="firstPerson" />}
                  {currentDemo === 'fixed' && <CameraDemo type="fixed" />}
                  {currentDemo === 'cinematic' && <CameraDemo type="cinematic" />}

                  {/* Default scene elements */}
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <gridHelper args={[20, 20]} />
                  {!currentDemo && <OrbitControls />}
                </>
              ) : currentCategory === 'gameLoop' && currentDemo === 'basic' ? (
                <GameLoopDemo />
              ) : currentCategory === 'physics' ? (
                <>
                  {currentDemo === 'basic' && <PhysicsDemo />}
                  {currentDemo === 'advanced' && <AdvancedPhysicsDemo />}
                </>
              ) : (
                <>
                  <MenuBackground />
                  <OrbitControls
                    minDistance={15}
                    maxDistance={50}
                    enableDamping
                    dampingFactor={0.05}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI - Math.PI / 6}
                  />
                </>
              )}
            </>
          )}
        </Suspense>
      </Canvas>
      <DemoSelector />
    </div>
  );
};
