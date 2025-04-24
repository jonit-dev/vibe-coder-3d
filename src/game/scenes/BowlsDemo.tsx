import { Environment } from '@react-three/drei';
import { useEffect } from 'react';

import { PhysicsBall } from '@/core/components/physics/PhysicsBall';
import { CameraController } from '@core/components/controls/CameraController';
import { PhysicsWorld } from '@core/components/physics/PhysicsWorld';

import BowlingBallControls from './bowling-demo/BowlingBallControls';
import BowlingGameManager from './bowling-demo/BowlingGameManager';
import BowlingLane from './bowling-demo/BowlingLane';
import BowlingPinSetup from './bowling-demo/BowlingPinSetup';
import BowlingRoom from './bowling-demo/BowlingRoom';

interface IBowlsDemoProps {
  onResetHandler?: (resetFn: () => void) => void;
  shadowQuality?: 'low' | 'medium' | 'high';
  maxSubSteps?: number;
}

/**
 * Main Bowling Demo component
 * Only contains 3D scene elements
 */
export const BowlsDemo = ({
  onResetHandler,
  shadowQuality = 'medium',
  maxSubSteps = 5,
}: IBowlsDemoProps = {}) => {
  return (
    <BowlingGameManager>
      {({
        handleShoot,
        activeBall,
        currentBall,
        pinsKey,
        ballRef,
        score,
        handlePinHit,
        handleFirstPinFallen,
        handleReset,
      }) => {
        // Send handleReset up to parent component if requested
        useEffect(() => {
          if (onResetHandler) {
            onResetHandler(handleReset);
          }
        }, [handleReset, onResetHandler]);

        return (
          <PhysicsWorld
            lights={{
              ambientIntensity: 0.3,
              directionalLightProps: {
                position: [3, 12, 6],
                intensity: 0.7,
                castShadow: true,
                shadowMapSize: 2048,
                shadowCameraDistance: 50,
              },
              pointLights: [
                { position: [0, 5, -8], intensity: 0.4 },
                { position: [0, 5, 2], intensity: 0.3 },
                { position: [0, 5, 8], intensity: 0.4 },
              ],
            }}
            interpolate={true}
            maxSubSteps={maxSubSteps}
            shadowQuality={shadowQuality}
          >
            {/* Environment map for reflections */}
            <Environment preset="studio" />

            {/* Spotlight for pins */}
            <spotLight
              position={[0, 8, 0]}
              angle={0.4}
              penumbra={0.5}
              intensity={0.8}
              distance={25}
              castShadow={shadowQuality !== 'low'}
            />

            <CameraController
              initialPosition={[0, 4, -15]}
              lookAt={[0, 0, 0]}
              minDistance={3}
              maxDistance={25}
              minPolarAngle={0.2}
              maxPolarAngle={Math.PI / 2.5}
            />

            {/* Room environment - must come before lane so it doesn't overlap */}
            <BowlingRoom shadowQuality={shadowQuality} />

            {/* Individual lane */}
            <group position={[0, 0, 0]}>
              <BowlingLane />
            </group>

            <BowlingPinSetup
              key={pinsKey}
              onPinHit={handlePinHit}
              onFirstPinFallen={handleFirstPinFallen}
            />

            <BowlingBallControls onShoot={handleShoot} active={activeBall} />

            {currentBall && (
              <PhysicsBall
                key={currentBall.id}
                position={currentBall.position}
                velocity={currentBall.velocity}
                ref={ballRef}
                mass={10}
                radius={0.3}
                color="#fe4a49"
              />
            )}
          </PhysicsWorld>
        );
      }}
    </BowlingGameManager>
  );
};

export { BowlsDemo as BowlingDemo };
