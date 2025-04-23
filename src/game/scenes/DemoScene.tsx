// Demo Scene
// A simple demo scene to test the game engine
import { EntityMesh, GameEngine } from '@core/index';
import { useGameLoop } from '@core/lib/gameLoop';
import { OrbitControls } from '@react-three/drei';

// Debug UI to show game loop state
function DebugUI() {
  const { isRunning, isPaused, fps, frameCount } = useGameLoop();

  return (
    <div className="debug-ui" style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      zIndex: 1000,
    }}>
      <h3>Engine Stats</h3>
      <div>Status: {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}</div>
      <div>FPS: {fps}</div>
      <div>Frame: {frameCount}</div>
    </div>
  );
}

// A simple rotating cube component
function RotatingCube({ position = [0, 0, 0], color = 'red' }) {
  return (
    <EntityMesh
      position={position as [number, number, number]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </EntityMesh>
  );
}

// Main demo scene component
export function DemoScene() {
  return (
    <>
      {/* Debug UI is outside the Canvas/GameEngine */}
      <DebugUI />

      <GameEngine
        canvasProps={{
          style: { background: '#222' },
          camera: { position: [0, 5, 10], fov: 50 }
        }}
      >
        {/* Camera controls */}
        <OrbitControls />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        {/* Ground plane */}
        <EntityMesh
          position={[0, -0.5, 0]}
          scale={[20, 1, 20]}
          rotation={[0, 0, 0, 1]}
          receiveShadow
        >
          <boxGeometry />
          <meshStandardMaterial color="#444" />
        </EntityMesh>

        {/* Demo objects */}
        <RotatingCube position={[-2, 1, 0]} color="red" />
        <RotatingCube position={[0, 1, 0]} color="green" />
        <RotatingCube position={[2, 1, 0]} color="blue" />
      </GameEngine>
    </>
  );
} 
