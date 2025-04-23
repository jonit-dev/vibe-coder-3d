// Game Loop Demo Scene
// Demonstrates the game engine loop with controls
import { EntityMesh, GameEngine, useGameEngine } from '@core/index';
import { useGameLoop } from '@core/lib/gameLoop';
import { OrbitControls } from '@react-three/drei';

// Debug UI with controls to start, stop, pause, resume the engine
function DebugUI() {
  const { isRunning, isPaused, fps, frameCount, deltaTime } = useGameLoop();
  const { startEngine, stopEngine, pauseEngine, resumeEngine, resetEngine } = useGameEngine();

  return (
    <div className="debug-ui" style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '15px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      zIndex: 1000,
      width: '300px',
    }}>
      <h3 style={{ marginTop: 0 }}>Game Loop Controls</h3>

      <div style={{ marginBottom: '10px' }}>
        <div>Status: {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}</div>
        <div>FPS: {fps}</div>
        <div>Frame Count: {frameCount}</div>
        <div>Delta Time: {deltaTime.toFixed(4)}s</div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={startEngine}
          disabled={isRunning}
          style={{
            padding: '8px 12px',
            background: !isRunning ? '#4CAF50' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'default' : 'pointer',
            opacity: isRunning ? 0.7 : 1,
          }}
        >
          Start
        </button>

        <button
          onClick={stopEngine}
          disabled={!isRunning}
          style={{
            padding: '8px 12px',
            background: isRunning ? '#F44336' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isRunning ? 'default' : 'pointer',
            opacity: !isRunning ? 0.7 : 1,
          }}
        >
          Stop
        </button>

        <button
          onClick={isPaused ? resumeEngine : pauseEngine}
          disabled={!isRunning}
          style={{
            padding: '8px 12px',
            background: isRunning ? '#2196F3' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isRunning ? 'default' : 'pointer',
            opacity: !isRunning ? 0.7 : 1,
          }}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <button
          onClick={resetEngine}
          style={{
            padding: '8px 12px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4 style={{ marginBottom: '5px' }}>About this demo</h4>
        <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
          This demo showcases the game engine loop using a Zustand store.
          The loop powers entity updates and enables deterministic simulation.
        </p>
      </div>
    </div>
  );
}

// Main Game Loop demo scene component
export function GameLoopDemo() {
  // Auto-start is false so we can control via UI
  return (
    <>
      <DebugUI />

      <GameEngine
        autoStart={false}
        canvasProps={{
          style: { background: 'linear-gradient(to bottom, #1e3c72, #2a5298)' },
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
          <meshStandardMaterial color="#2c3e50" />
        </EntityMesh>

        {/* Demo objects - different colors and positions */}
        <EntityMesh
          position={[-3, 1, -3]}
          rotation={[0, 0, 0, 1]}
          castShadow
        >
          <boxGeometry />
          <meshStandardMaterial color="#e74c3c" />
        </EntityMesh>

        <EntityMesh
          position={[0, 1, 0]}
          rotation={[0, 0, 0, 1]}
          castShadow
        >
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color="#3498db" metalness={0.5} roughness={0.2} />
        </EntityMesh>

        <EntityMesh
          position={[3, 1, 3]}
          rotation={[0, 0, 0, 1]}
          castShadow
        >
          <torusKnotGeometry args={[0.5, 0.2, 64, 8]} />
          <meshStandardMaterial color="#2ecc71" />
        </EntityMesh>
      </GameEngine>
    </>
  );
} 
