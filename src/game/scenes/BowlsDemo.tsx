import { PhysicsBall } from '@/core/components/physics/PhysicsBall';
import { CameraController } from '@core/components/controls/CameraController';
import { PhysicsWorld } from '@core/components/physics/PhysicsWorld';

import BowlingBallControls from './bowling-demo/BowlingBallControls';
import BowlingGameManager from './bowling-demo/BowlingGameManager';
import BowlingLane from './bowling-demo/BowlingLane';
import BowlingPinSetup from './bowling-demo/BowlingPinSetup';

/**
 * Main Bowling Demo component
 * Only contains 3D scene elements
 */
export const BowlsDemo = () => {
  return (
    <BowlingGameManager>
      {({
        handleShoot,
        activeBall,
        currentBall,
        pinsKey,
        ballRef,
        handlePinHit,
        handleFirstPinFallen,
      }) => (
        <PhysicsWorld
          lights={{
            ambientIntensity: 0.4,
            directionalLightProps: {
              position: [2, 10, 5],
              intensity: 0.8,
              castShadow: true,
              shadowMapSize: 2048,
              shadowCameraDistance: 50,
            },
            pointLights: [
              { position: [0, 2, -8], intensity: 0.5 },
              { position: [0, 2, 0], intensity: 0.5 },
              { position: [0, 2, 8], intensity: 0.5 },
            ],
          }}
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
      )}
    </BowlingGameManager>
  );
};

export { BowlsDemo as BowlingDemo };
