/**
 * WebGPU Integration Example
 *
 * This example demonstrates how to use WebGPU rendering in the Vibe Coder 3D engine.
 * The engine will automatically detect WebGPU support and fall back to WebGL if unavailable.
 */

import { GameEngine } from '@core/components/GameEngine';
import { WebGPUCompatibilityBanner } from '@core/components/WebGPUCompatibilityBanner';
import { useWebGPUSupport } from '@core/hooks/useWebGPUSupport';
import { webgpuPreset, highQualityPreset } from '@core/configs/EngineConfig';

/**
 * Example 1: Basic WebGPU with auto-detection
 */
export function BasicWebGPUExample() {
  return (
    <>
      <WebGPUCompatibilityBanner position="top-right" autoDismiss={5000} />
      <GameEngine
        useAdaptiveRenderer={true}
        rendererType="auto"
      >
        {/* Your scene content */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </GameEngine>
    </>
  );
}

/**
 * Example 2: Force WebGPU (will show error if not supported)
 */
export function ForceWebGPUExample() {
  return (
    <GameEngine
      useAdaptiveRenderer={true}
      rendererType="webgpu"
    >
      {/* Your scene content */}
    </GameEngine>
  );
}

/**
 * Example 3: Using engine configuration presets
 */
export function WebGPUWithPresetExample() {
  return (
    <GameEngine
      useAdaptiveRenderer={true}
      engineConfig={webgpuPreset}
    >
      {/* Scene will use WebGPU with optimized settings */}
    </GameEngine>
  );
}

/**
 * Example 4: High quality with auto-detection
 */
export function HighQualityExample() {
  return (
    <GameEngine
      useAdaptiveRenderer={true}
      engineConfig={highQualityPreset}
    >
      {/* Scene will use best available renderer with high quality settings */}
    </GameEngine>
  );
}

/**
 * Example 5: Display WebGPU support information
 */
export function WebGPUSupportInfo() {
  const { isSupported, isChecking, browserSupport, capabilities } = useWebGPUSupport();

  if (isChecking) {
    return <div className="p-4">Checking WebGPU support...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-2">WebGPU Support Status</h2>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Supported:</span>
            <span className={isSupported ? 'text-green-400' : 'text-red-400'}>
              {isSupported ? '✓ Yes' : '✗ No'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Browser:</span>
            <span className={browserSupport.supported ? 'text-green-400' : 'text-yellow-400'}>
              {browserSupport.message}
            </span>
          </div>

          {capabilities && capabilities.supported && (
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">GPU Capabilities</summary>
              <div className="mt-2 pl-4 space-y-1">
                <div>
                  <strong>Features:</strong>
                  <ul className="list-disc list-inside pl-2">
                    {capabilities.features.map((feature) => (
                      <li key={feature} className="text-sm">{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2">
                  <strong>Limits:</strong>
                  <pre className="text-xs bg-gray-900 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(capabilities.limits, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-bold mb-2">Usage Recommendation</h3>
        <p className="text-sm text-gray-300">
          {isSupported
            ? 'Your browser supports WebGPU! Use useAdaptiveRenderer={true} for best performance.'
            : 'WebGPU is not available. The engine will use WebGL renderer.'}
        </p>
      </div>
    </div>
  );
}

/**
 * Example 6: Conditional rendering based on WebGPU support
 */
export function ConditionalRenderExample() {
  const { isSupported } = useWebGPUSupport();

  return (
    <GameEngine
      useAdaptiveRenderer={true}
      engineConfig={{
        renderer: {
          type: isSupported ? 'webgpu' : 'webgl',
          // Adjust quality based on available renderer
          shadowMapSize: isSupported ? 2048 : 1024,
        },
        performance: {
          maxLights: isSupported ? 16 : 8,
        },
      }}
    >
      {/* Scene content */}
    </GameEngine>
  );
}

/**
 * Example 7: Using callback for renderer detection
 */
export function CallbackExample() {
  const handleRendererDetected = (type: 'webgl' | 'webgpu') => {
    console.log(`Renderer detected: ${type}`);
    // Adjust scene quality, enable/disable features, etc.
  };

  return (
    <GameEngine
      useAdaptiveRenderer={true}
      rendererType="auto"
      canvasProps={{
        onCreated: ({ gl }) => {
          console.log('Canvas created with renderer:', gl);
        },
      }}
    >
      {/* Scene content */}
    </GameEngine>
  );
}

/**
 * Example 8: Complete application with WebGPU
 */
export function CompleteWebGPUApp() {
  return (
    <div className="w-full h-screen relative">
      {/* Compatibility banner */}
      <WebGPUCompatibilityBanner position="top-right" autoDismiss={5000} />

      {/* Main game engine */}
      <GameEngine
        useAdaptiveRenderer={true}
        rendererType="auto"
        engineConfig={{
          renderer: {
            type: 'auto',
            antialias: true,
            toneMapping: 'aces',
            toneMappingExposure: 1.2,
            shadows: {
              enabled: true,
              type: 'pcfsoft',
            },
          },
          performance: {
            enableFrustumCulling: true,
            shadowMapSize: 2048,
            anisotropy: 16,
          },
          debug: {
            enabled: true,
            logRendererInfo: true,
          },
        }}
      >
        {/* Environment */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Scene objects */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="lightgray" />
        </mesh>
      </GameEngine>
    </div>
  );
}
