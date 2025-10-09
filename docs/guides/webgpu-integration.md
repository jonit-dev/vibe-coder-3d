# WebGPU Integration Guide

This guide explains how to use WebGPU rendering in the Vibe Coder 3D engine.

## Overview

The engine now supports both **WebGL** and **WebGPU** rendering backends:

- **WebGL**: Default renderer, widely supported across all browsers
- **WebGPU**: Modern GPU API offering better performance and features (experimental)

WebGPU provides:
- Better performance for compute-heavy tasks
- Lower CPU overhead
- Modern GPU features (compute shaders)
- Better multi-threading support

## Browser Support

### WebGPU Requirements

| Browser | Version | Status |
|---------|---------|--------|
| Chrome/Edge | 113+ | ✅ Supported |
| Safari | 18+ | ✅ Supported |
| Firefox | 127+ | ⚠️ Behind flag (`dom.webgpu.enabled`) |

**Note**: WebGPU is still experimental in Three.js (as of v0.175.0), so the engine uses WebGL by default with WebGPU opt-in.

## Usage

### Basic Usage (Auto-detection)

The simplest way to enable WebGPU is to use the `useAdaptiveRenderer` prop:

```tsx
import { GameEngine } from '@core/components/GameEngine';

function App() {
  return (
    <GameEngine
      useAdaptiveRenderer={true}
      rendererType="auto"
    >
      {/* Your scene content */}
    </GameEngine>
  );
}
```

This will automatically detect WebGPU support and fall back to WebGL if unavailable.

### Explicit Renderer Selection

Force a specific renderer type:

```tsx
// Force WebGPU (will show error if not supported)
<GameEngine
  useAdaptiveRenderer={true}
  rendererType="webgpu"
>
  {/* scene content */}
</GameEngine>

// Force WebGL
<GameEngine
  useAdaptiveRenderer={false}
  rendererType="webgl"
>
  {/* scene content */}
</GameEngine>
```

### Using Engine Configuration

Configure rendering via the engine config:

```tsx
import { GameEngine } from '@core/components/GameEngine';
import { webgpuPreset } from '@core/configs/EngineConfig';

function App() {
  return (
    <GameEngine
      useAdaptiveRenderer={true}
      engineConfig={webgpuPreset}
    >
      {/* scene content */}
    </GameEngine>
  );
}
```

Available presets:
- `webgpuPreset` - Optimized for WebGPU
- `highQualityPreset` - Auto-detect with high quality settings
- `mobilePreset` - Optimized for mobile (WebGL only)

### Using AdaptiveCanvas Directly

For more control, use the `AdaptiveCanvas` component directly:

```tsx
import { AdaptiveCanvas } from '@core/components/AdaptiveCanvas';

function MyScene() {
  const handleRendererDetected = (type: 'webgl' | 'webgpu') => {
    console.log(`Using ${type} renderer`);
  };

  return (
    <AdaptiveCanvas
      rendererType="auto"
      fallbackToWebGL={true}
      onRendererDetected={handleRendererDetected}
    >
      {/* Your Three.js scene */}
    </AdaptiveCanvas>
  );
}
```

## Detection and Capabilities

### Check WebGPU Support

Use the `useWebGPUSupport` hook to check support:

```tsx
import { useWebGPUSupport } from '@core/hooks/useWebGPUSupport';

function RendererInfo() {
  const { isSupported, isChecking, browserSupport, capabilities } = useWebGPUSupport();

  if (isChecking) {
    return <div>Checking WebGPU support...</div>;
  }

  return (
    <div>
      <h3>WebGPU Status</h3>
      <p>Supported: {isSupported ? 'Yes' : 'No'}</p>
      <p>Browser: {browserSupport.message}</p>
      {capabilities && (
        <details>
          <summary>Capabilities</summary>
          <pre>{JSON.stringify(capabilities, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
```

### Using the Renderer Factory

For custom renderer setup:

```tsx
import { RendererFactory } from '@core/lib/rendering/RendererFactory';

async function setupRenderer() {
  // Auto-detect best renderer
  const result = await RendererFactory.create('auto');
  console.log(`Using ${result.type} renderer`);
  console.log('Capabilities:', result.capabilities);

  // Check if WebGPU is supported
  const isSupported = await RendererFactory.isWebGPUSupported();

  // Get recommended renderer
  const recommended = await RendererFactory.getRecommendedRendererType();
}
```

## Compatibility Warnings

### Display Warning Banner

Show users when WebGPU is not available:

```tsx
import { WebGPUCompatibilityBanner } from '@core/components/WebGPUCompatibilityBanner';

function App() {
  return (
    <>
      <WebGPUCompatibilityBanner
        position="top-right"
        autoDismiss={5000}
      />
      <GameEngine useAdaptiveRenderer={true}>
        {/* scene */}
      </GameEngine>
    </>
  );
}
```

### Compact Indicator

Use the compact indicator for minimal UI impact:

```tsx
import { WebGPUCompatibilityIndicator } from '@core/components/WebGPUCompatibilityBanner';

function App() {
  return (
    <>
      <WebGPUCompatibilityIndicator />
      <GameEngine useAdaptiveRenderer={true}>
        {/* scene */}
      </GameEngine>
    </>
  );
}
```

## Configuration Presets

### WebGPU Preset

Optimized for WebGPU with high-performance settings:

```tsx
import { mergeEngineConfig, webgpuPreset } from '@core/configs/EngineConfig';

const config = mergeEngineConfig(webgpuPreset);
// config.renderer.type === 'webgpu'
// config.performance.maxLights === 16
// config.performance.shadowMapSize === 2048
```

### Mobile Preset

Optimized for mobile devices (WebGL only):

```tsx
import { mergeEngineConfig, mobilePreset } from '@core/configs/EngineConfig';

const config = mergeEngineConfig(mobilePreset);
// config.renderer.type === 'webgl'
// config.renderer.antialias === false
// config.performance.shadowMapSize === 512
```

### Custom Configuration

Create your own configuration:

```tsx
import { mergeEngineConfig } from '@core/configs/EngineConfig';

const myConfig = mergeEngineConfig({
  renderer: {
    type: 'auto',
    antialias: true,
    toneMapping: 'aces',
    toneMappingExposure: 1.2,
  },
  performance: {
    enableFrustumCulling: true,
    maxLights: 12,
    shadowMapSize: 2048,
  },
});
```

## Detection Utilities

### Low-level WebGPU Detection

For advanced use cases:

```tsx
import {
  detectWebGPU,
  getWebGPUCapabilities,
  checkWebGPUBrowserSupport,
  initializeWebGPU
} from '@core/utils/webgpu';

// Simple detection
const isSupported = await detectWebGPU();

// Get detailed capabilities
const capabilities = await getWebGPUCapabilities();
console.log('Features:', capabilities.features);
console.log('Limits:', capabilities.limits);

// Check browser compatibility
const browserCheck = checkWebGPUBrowserSupport();
console.log(browserCheck.message);

// Initialize WebGPU manually
const canvas = document.querySelector('canvas');
const webgpu = await initializeWebGPU(canvas);
if (webgpu) {
  console.log('WebGPU initialized:', webgpu.device, webgpu.context);
}
```

## Current Limitations

⚠️ **Important Notes:**

1. **Three.js WebGPU is experimental** - The engine prepares for WebGPU but currently uses WebGL due to Three.js experimental status
2. **Fallback to WebGL** - Always ensure WebGL fallback is enabled for production
3. **Feature parity** - Some Three.js features may not work identically on WebGPU
4. **Browser support** - Limited to modern browsers (Chrome 113+, Safari 18+)

## Migration Path

We recommend the following approach:

1. **Phase 1 (Current)**: Use WebGL by default, add WebGPU detection infrastructure
2. **Phase 2**: Test WebGPU with opt-in flag (`useAdaptiveRenderer={true}`)
3. **Phase 3**: When Three.js WebGPU is stable, enable auto-detection by default
4. **Phase 4**: Gradually transition to WebGPU-first with WebGL fallback

## Testing WebGPU

### Enable in Your App

Test WebGPU support in your application:

```tsx
// In your main App.tsx or game entry point
<GameEngine
  useAdaptiveRenderer={true}
  rendererType="auto"
  engineConfig={{
    debug: {
      enabled: true,
      logRendererInfo: true,
    }
  }}
>
  {/* scene content */}
</GameEngine>
```

### Check Console Logs

The engine will log renderer information:

```
[WebGPU] Auto-detected WebGPU support, using WebGPU renderer
[RendererFactory] WebGL renderer created { capabilities: {...} }
```

## Future Work

- [ ] Enable Three.js WebGPU when stable
- [ ] Add WebGPU-specific optimizations
- [ ] Implement compute shader support
- [ ] Add WebGPU performance benchmarks
- [ ] Create WebGPU migration guide for existing projects

## See Also

- [Engine Configuration](../architecture/2-2-technical-stack.md)
- [Rendering Pipeline](../architecture/2-9-rendering-pipeline.md)
- [Performance Optimization](../PRDs/performance/)
