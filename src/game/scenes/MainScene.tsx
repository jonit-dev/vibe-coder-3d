import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import { DemoSelector } from '../../components/DemoSelector';
import { MenuBackground } from '../../components/MenuBackground';
import { useDemo } from '../stores/demoStore';

import { CameraDemo } from './CameraDemo';
import { GameLoopDemo } from './GameLoopDemo';
import { PhysicsDemo } from './PhysicsDemo';

export const MainScene = () => {
  const { currentCategory, currentDemo } = useDemo();

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
        camera={{ position: [-21.56, 3.02, 17.68], fov: 40 }}
        style={{ background: '#000000' }}
      >
        <Suspense fallback={null}>
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
            <PhysicsDemo />
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
        </Suspense>
      </Canvas>
      <DemoSelector />
    </div>
  );
};
