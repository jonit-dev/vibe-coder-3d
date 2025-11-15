import * as THREE from 'three';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('RendererFactory');

export type RendererType = 'webgl';

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
  type: 'webgl';
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
 * Factory for creating WebGL renderers
 */
export class RendererFactory {
  /**
   * Create a renderer
   * @param type - 'webgl' (only WebGL is supported)
   * @param options - Renderer configuration options
   */
  static async create(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _type: RendererType = 'webgl',
    options: IRendererOptions = {},
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

    // Create WebGL renderer
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
   * Extract capabilities from WebGL renderer
   */
  private static extractWebGLCapabilities(
    renderer: THREE.WebGLRenderer,
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
}
