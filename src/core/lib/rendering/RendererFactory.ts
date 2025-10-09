import * as THREE from 'three';
import { Logger } from '@core/lib/logger';
import { detectWebGPU } from '@core/utils/webgpu';

const logger = Logger.create('RendererFactory');

export type RendererType = 'webgl' | 'webgpu' | 'auto';

export interface IRendererOptions {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'high-performance' | 'low-power' | 'default';
  stencil?: boolean;
  depth?: boolean;
  logarithmicDepthBuffer?: boolean;
}

export interface IRendererResult {
  renderer: THREE.WebGLRenderer;
  type: 'webgl' | 'webgpu';
  capabilities: {
    maxTextures: number;
    maxVertexTextures: number;
    maxTextureSize: number;
    maxCubemapSize: number;
    maxAttributes: number;
    maxVertexUniforms: number;
    maxFragmentUniforms: number;
    maxSamples: number;
  };
}

/**
 * Factory for creating WebGL or WebGPU renderers
 */
export class RendererFactory {
  /**
   * Create a renderer based on the specified type
   * @param type - 'webgl', 'webgpu', or 'auto' (auto-detect best available)
   * @param options - Renderer configuration options
   */
  static async create(
    type: RendererType = 'auto',
    options: IRendererOptions = {}
  ): Promise<IRendererResult> {
    const {
      canvas,
      antialias = true,
      alpha = false,
      powerPreference = 'high-performance',
      stencil = true,
      depth = true,
      logarithmicDepthBuffer = false,
    } = options;

    // Determine which renderer to use
    let useWebGPU = false;
    if (type === 'webgpu') {
      useWebGPU = true;
    } else if (type === 'auto') {
      useWebGPU = await detectWebGPU();
      if (useWebGPU) {
        logger.info('Auto-detected WebGPU support, using WebGPU renderer');
      } else {
        logger.info('WebGPU not available, falling back to WebGL');
      }
    }

    // Try to create WebGPU renderer
    if (useWebGPU) {
      try {
        const webgpuResult = await this.createWebGPURenderer();
        if (webgpuResult) {
          return webgpuResult;
        }
        logger.warn('WebGPU renderer creation failed, falling back to WebGL');
      } catch (error) {
        logger.error('WebGPU renderer error, falling back to WebGL', { error });
      }
    }

    // Fallback to WebGL
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias,
      alpha,
      powerPreference,
      stencil,
      depth,
      logarithmicDepthBuffer,
    });

    // Configure WebGL renderer
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const capabilities = this.extractWebGLCapabilities(renderer);

    logger.info('WebGL renderer created', { capabilities });

    return {
      renderer,
      type: 'webgl',
      capabilities,
    };
  }

  /**
   * Create a WebGPU renderer (experimental Three.js WebGPU support)
   * Note: Three.js WebGPU is still experimental as of v0.175.0
   */
  private static async createWebGPURenderer(): Promise<IRendererResult | null> {
    try {
      // Check if WebGPU is available
      if (!navigator.gpu) {
        logger.debug('Navigator.gpu not available');
        return null;
      }

      // Three.js r160+ has experimental WebGPU support via three/webgpu
      // However, as of v0.175.0, it's still experimental
      // For now, we'll prepare the infrastructure but fall back to WebGL

      logger.warn(
        'WebGPU renderer requested but Three.js WebGPU is experimental. Using WebGL.'
      );

      // TODO: When Three.js WebGPU is stable, implement like this:
      // const WebGPURenderer = (await import('three/webgpu')).WebGPURenderer;
      // const renderer = new WebGPURenderer({ canvas: options.canvas });
      // await renderer.init();

      return null;
    } catch (error) {
      logger.error('Failed to create WebGPU renderer', { error });
      return null;
    }
  }

  /**
   * Extract capabilities from WebGL renderer
   */
  private static extractWebGLCapabilities(
    renderer: THREE.WebGLRenderer
  ): IRendererResult['capabilities'] {
    const capabilities = renderer.capabilities;

    return {
      maxTextures: capabilities.maxTextures,
      maxVertexTextures: capabilities.maxVertexTextures,
      maxTextureSize: capabilities.maxTextureSize,
      maxCubemapSize: capabilities.maxCubemapSize,
      maxAttributes: capabilities.maxAttributes,
      maxVertexUniforms: capabilities.maxVertexUniforms,
      maxFragmentUniforms: capabilities.maxFragmentUniforms,
      maxSamples: capabilities.maxSamples,
    };
  }

  /**
   * Check if WebGPU is supported
   */
  static async isWebGPUSupported(): Promise<boolean> {
    return detectWebGPU();
  }

  /**
   * Get recommended renderer type for the current environment
   */
  static async getRecommendedRendererType(): Promise<'webgl' | 'webgpu'> {
    const webgpuSupported = await detectWebGPU();
    return webgpuSupported ? 'webgpu' : 'webgl';
  }
}
