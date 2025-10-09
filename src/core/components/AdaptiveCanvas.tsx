import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { z } from 'zod';

import { Logger } from '@core/lib/logger';
import { RendererFactory, type RendererType } from '@core/lib/rendering/RendererFactory';
import { checkWebGPUBrowserSupport, detectWebGPU } from '@core/utils/webgpu';
import type { IEngineConfig } from '@core/configs/EngineConfig';

const logger = Logger.create('AdaptiveCanvas');

// Schema for AdaptiveCanvas props
export const AdaptiveCanvasPropsSchema = z.object({
  rendererType: z.enum(['webgl', 'webgpu', 'auto']).default('auto'),
  fallbackToWebGL: z.boolean().default(true),
  onRendererDetected: z.function().args(z.enum(['webgl', 'webgpu'])).returns(z.void()).optional(),
  children: z.any().optional(),
  canvasProps: z.record(z.unknown()).optional(),
  engineConfig: z.record(z.unknown()).optional(),
});

export interface IAdaptiveCanvasProps {
  /** Renderer type preference: 'webgl', 'webgpu', or 'auto' */
  rendererType?: RendererType;

  /** Whether to fallback to WebGL if WebGPU is not available */
  fallbackToWebGL?: boolean;

  /** Callback when renderer is detected/created */
  onRendererDetected?: (type: 'webgl' | 'webgpu') => void;

  /** Scene content */
  children?: React.ReactNode;

  /** Additional Canvas props */
  canvasProps?: React.ComponentProps<typeof Canvas>;

  /** Engine configuration to drive renderer behavior */
  engineConfig?: Partial<IEngineConfig>;
}

/**
 * AdaptiveCanvas - Automatically selects WebGL or WebGPU renderer
 * based on browser support and user preference
 */
export function AdaptiveCanvas({
  rendererType = 'auto',
  fallbackToWebGL = true,
  onRendererDetected,
  children,
  canvasProps,
  engineConfig,
}: IAdaptiveCanvasProps) {
  const [detectedRenderer, setDetectedRenderer] = useState<'webgl' | 'webgpu' | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const detectRenderer = async () => {
      try {
        // Check browser support
        const browserSupport = checkWebGPUBrowserSupport();
        if (!browserSupport.supported && rendererType === 'webgpu') {
          logger.warn(browserSupport.message);
          setWarningMessage(browserSupport.message);
        }

        // Determine which renderer to use
        let finalRenderer: 'webgl' | 'webgpu' = 'webgl';

        if (rendererType === 'webgpu') {
          const webgpuAvailable = await detectWebGPU();
          if (webgpuAvailable) {
            finalRenderer = 'webgpu';
            logger.info('Using WebGPU renderer');
          } else if (fallbackToWebGL) {
            logger.info('WebGPU not available, falling back to WebGL');
            setWarningMessage('WebGPU not available, using WebGL fallback');
          } else {
            logger.error('WebGPU not available and fallback disabled');
            setWarningMessage('WebGPU not available');
          }
        } else if (rendererType === 'auto') {
          const webgpuAvailable = await detectWebGPU();
          finalRenderer = webgpuAvailable ? 'webgpu' : 'webgl';
          logger.info(`Auto-detected renderer: ${finalRenderer}`);
        } else {
          finalRenderer = 'webgl';
          logger.info('Using WebGL renderer (explicit)');
        }

        if (mounted) {
          setDetectedRenderer(finalRenderer);
          setIsChecking(false);
          onRendererDetected?.(finalRenderer);
        }
      } catch (error) {
        logger.error('Error detecting renderer', { error });
        if (mounted) {
          setDetectedRenderer('webgl');
          setIsChecking(false);
          setWarningMessage('Error detecting renderer, using WebGL');
        }
      }
    };

    detectRenderer();

    return () => {
      mounted = false;
    };
  }, [rendererType, fallbackToWebGL, onRendererDetected]);

  // Derive Canvas gl parameters from engineConfig
  const glParams: Partial<THREE.WebGLRendererParameters> | undefined = engineConfig?.renderer
    ? {
        antialias: engineConfig.renderer.antialias,
        alpha: engineConfig.renderer.alpha,
        powerPreference: engineConfig.renderer.powerPreference,
        stencil: engineConfig.renderer.stencil,
        depth: engineConfig.renderer.depth,
        logarithmicDepthBuffer: engineConfig.renderer.logarithmicDepthBuffer,
      }
    : undefined;

  // Map config tone mapping string to THREE constant
  const getToneMapping = (tm?: IEngineConfig['renderer']['toneMapping']): THREE.ToneMapping => {
    switch (tm) {
      case 'none':
        return THREE.NoToneMapping;
      case 'linear':
        return THREE.LinearToneMapping;
      case 'reinhard':
        return THREE.ReinhardToneMapping;
      case 'cineon':
        return THREE.CineonToneMapping;
      case 'neutral':
        return THREE.NeutralToneMapping as unknown as THREE.ToneMapping;
      case 'aces':
      default:
        return THREE.ACESFilmicToneMapping;
    }
  };

  const getShadowType = (
    type?: IEngineConfig['renderer']['shadows']['type']
  ): THREE.ShadowMapType => {
    switch (type) {
      case 'basic':
        return THREE.BasicShadowMap;
      case 'pcf':
        return THREE.PCFShadowMap;
      case 'vsm':
        return THREE.VSMShadowMap;
      case 'pcfsoft':
      default:
        return THREE.PCFSoftShadowMap;
    }
  };

  // Show loading state while detecting
  if (isChecking) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: '#fff',
        }}
      >
        <div>Initializing renderer...</div>
      </div>
    );
  }

  // Show warning if needed
  if (warningMessage && rendererType === 'webgpu' && !fallbackToWebGL) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: '#ff6b6b',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Renderer Error</div>
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>{warningMessage}</div>
      </div>
    );
  }

  // Render canvas
  return (
    <>
      {warningMessage && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 193, 7, 0.9)',
            color: '#000',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
            maxWidth: '300px',
          }}
        >
          {warningMessage}
        </div>
      )}
      <Canvas
        {...canvasProps}
        dpr={engineConfig?.renderer?.pixelRatio ?? canvasProps?.dpr}
        // Note: Three.js WebGPU support is experimental
        // When available, we'll pass custom renderer via gl prop
        gl={glParams}
        onCreated={(state) => {
          const renderer = state.gl as THREE.WebGLRenderer;
          // Configure renderer according to engineConfig
          const outputSpace = engineConfig?.renderer?.outputColorSpace === 'linear'
            ? THREE.LinearSRGBColorSpace
            : THREE.SRGBColorSpace;
          renderer.outputColorSpace = outputSpace;
          renderer.toneMapping = getToneMapping(engineConfig?.renderer?.toneMapping);
          if (typeof engineConfig?.renderer?.toneMappingExposure === 'number') {
            renderer.toneMappingExposure = engineConfig.renderer.toneMappingExposure;
          }
          const shadowsEnabled = engineConfig?.renderer?.shadows?.enabled ?? true;
          renderer.shadowMap.enabled = shadowsEnabled;
          renderer.shadowMap.type = getShadowType(engineConfig?.renderer?.shadows?.type);
          if (engineConfig?.renderer?.pixelRatio) {
            renderer.setPixelRatio(engineConfig.renderer.pixelRatio);
          } else if (!canvasProps?.dpr) {
            renderer.setPixelRatio(window.devicePixelRatio);
          }

          // Optional debug logging
          if (engineConfig?.debug?.logRendererInfo) {
            const caps = (renderer.capabilities as any) ?? {};
            logger.info('Renderer created', {
              detectedRenderer,
              capabilities: {
                maxTextures: caps.maxTextures,
                maxVertexTextures: caps.maxVertexTextures,
                maxTextureSize: caps.maxTextureSize,
                maxCubemapSize: caps.maxCubemapSize,
                maxAttributes: caps.maxAttributes,
                maxVertexUniforms: caps.maxVertexUniforms,
                maxFragmentUniforms: caps.maxFragmentUniforms,
                maxSamples: caps.maxSamples,
              },
            });
          }

          // Call any provided onCreated handler
          if (canvasProps && typeof canvasProps.onCreated === 'function') {
            canvasProps.onCreated(state);
          }
        }}
      >
        {children}
      </Canvas>
    </>
  );
}

/**
 * Hook to get current renderer type
 */
export function useRendererType(): 'webgl' | 'webgpu' | 'unknown' {
  const [rendererType, setRendererType] = useState<'webgl' | 'webgpu' | 'unknown'>('unknown');

  useEffect(() => {
    detectWebGPU().then((supported) => {
      setRendererType(supported ? 'webgpu' : 'webgl');
    });
  }, []);

  return rendererType;
}
