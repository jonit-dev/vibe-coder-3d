import { useEffect } from 'react';

import { PhysicsBall } from '@/core/components/physics/PhysicsBall';
import { CameraController } from '@core/components/controls/CameraController';
import { PhysicsWorld } from '@core/components/physics/PhysicsWorld';

import BowlingBallControls from './bowling-demo/BowlingBallControls';
import BowlingGameManager from './bowling-demo/BowlingGameManager';
import BowlingLane from './bowling-demo/BowlingLane';
import BowlingPinSetup from './bowling-demo/BowlingPinSetup';

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
              ambientIntensity: 0.4,
              directionalLightProps: {
                position: [2, 10, 5],
                intensity: 0.8,
                castShadow: true,
              },
              pointLights: [
                { position: [0, 2, -8], intensity: 0.5 },
                { position: [0, 2, 0], intensity: 0.5 },
                { position: [0, 2, 8], intensity: 0.5 },
              ],
            }}
            interpolate={true}
            maxSubSteps={maxSubSteps}
            shadowQuality={shadowQuality}
          >
            <CameraController
              initialPosition={[0, 3, -12]}
              lookAt={[0, 0, 0]}
              minDistance={2}
              maxDistance={20}
              minPolarAngle={0.2}
              maxPolarAngle={Math.PI / 2.2}
            />

            <BowlingLane />

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
