import { z } from 'zod';
import type { RendererType } from '@core/lib/rendering/RendererFactory';

/**
 * Engine configuration schema
 */
export const EngineConfigSchema = z.object({
  renderer: z
    .object({
      type: z.enum(['webgl', 'webgpu', 'auto']).default('auto'),
      antialias: z.boolean().default(true),
      alpha: z.boolean().default(false),
      powerPreference: z.enum(['high-performance', 'low-power', 'default']).default('high-performance'),
      stencil: z.boolean().default(true),
      depth: z.boolean().default(true),
      logarithmicDepthBuffer: z.boolean().default(false),
      pixelRatio: z.number().min(0.5).max(3).optional(),
      outputColorSpace: z.enum(['srgb', 'linear']).default('srgb'),
      toneMapping: z
        .enum(['none', 'linear', 'reinhard', 'cineon', 'aces', 'neutral'])
        .default('aces'),
      toneMappingExposure: z.number().min(0).max(10).default(1.0),
      shadows: z
        .object({
          enabled: z.boolean().default(true),
          type: z.enum(['basic', 'pcf', 'pcfsoft', 'vsm']).default('pcfsoft'),
          autoUpdate: z.boolean().default(true),
        })
        .default({}),
    })
    .default({}),

  physics: z
    .object({
      enabled: z.boolean().default(true),
      gravity: z.tuple([z.number(), z.number(), z.number()]).default([0, -9.81, 0]),
      timeStep: z.number().min(1 / 120).max(1 / 30).default(1 / 60),
      substeps: z.number().int().min(1).max(10).default(1),
    })
    .default({}),

  performance: z
    .object({
      enableFrustumCulling: z.boolean().default(true),
      enableOcclusionCulling: z.boolean().default(false),
      maxLights: z.number().int().min(1).max(16).default(8),
      shadowMapSize: z.number().int().min(256).max(4096).default(1024),
      anisotropy: z.number().int().min(1).max(16).default(4),
    })
    .default({}),

  debug: z
    .object({
      enabled: z.boolean().default(false),
      showStats: z.boolean().default(false),
      showGrid: z.boolean().default(false),
      showPhysics: z.boolean().default(false),
      logRendererInfo: z.boolean().default(false),
    })
    .default({}),
});

/**
 * Engine configuration interface
 */
export interface IEngineConfig extends z.infer<typeof EngineConfigSchema> {}

/**
 * Default engine configuration
 */
export const defaultEngineConfig: IEngineConfig = {
  renderer: {
    type: 'auto',
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: true,
    depth: true,
    logarithmicDepthBuffer: false,
    outputColorSpace: 'srgb',
    toneMapping: 'aces',
    toneMappingExposure: 1.0,
    shadows: {
      enabled: true,
      type: 'pcfsoft',
      autoUpdate: true,
    },
  },
  physics: {
    enabled: true,
    gravity: [0, -9.81, 0],
    timeStep: 1 / 60,
    substeps: 1,
  },
  performance: {
    enableFrustumCulling: true,
    enableOcclusionCulling: false,
    maxLights: 8,
    shadowMapSize: 1024,
    anisotropy: 4,
  },
  debug: {
    enabled: false,
    showStats: false,
    showGrid: false,
    showPhysics: false,
    logRendererInfo: false,
  },
};

/**
 * Validate engine configuration
 */
export function validateEngineConfig(config: unknown): IEngineConfig {
  return EngineConfigSchema.parse(config);
}

/**
 * Merge user config with defaults
 */
export function mergeEngineConfig(userConfig: Partial<IEngineConfig>): IEngineConfig {
  return EngineConfigSchema.parse({
    ...defaultEngineConfig,
    ...userConfig,
  });
}

/**
 * WebGPU-optimized configuration preset
 */
export const webgpuPreset: Partial<IEngineConfig> = {
  renderer: {
    type: 'webgpu',
    powerPreference: 'high-performance',
    antialias: true,
    alpha: false,
    depth: true,
    stencil: true,
    logarithmicDepthBuffer: false,
    outputColorSpace: 'srgb',
    toneMapping: 'aces',
    toneMappingExposure: 1.0,
    shadows: {
      enabled: true,
      type: 'pcfsoft',
      autoUpdate: true,
    },
  },
  performance: {
    enableFrustumCulling: true,
    enableOcclusionCulling: false,
    maxLights: 16,
    shadowMapSize: 2048,
    anisotropy: 16,
  },
};

/**
 * Mobile-optimized configuration preset
 */
export const mobilePreset: Partial<IEngineConfig> = {
  renderer: {
    type: 'webgl',
    antialias: false,
    powerPreference: 'default',
    alpha: false,
    depth: true,
    stencil: true,
    logarithmicDepthBuffer: false,
    outputColorSpace: 'srgb',
    toneMapping: 'aces',
    toneMappingExposure: 1.0,
    shadows: {
      enabled: true,
      type: 'basic',
      autoUpdate: true,
    },
  },
  performance: {
    enableFrustumCulling: true,
    enableOcclusionCulling: false,
    maxLights: 4,
    shadowMapSize: 512,
    anisotropy: 2,
  },
};

/**
 * High-quality configuration preset
 */
export const highQualityPreset: Partial<IEngineConfig> = {
  renderer: {
    type: 'auto',
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
    depth: true,
    stencil: true,
    logarithmicDepthBuffer: false,
    outputColorSpace: 'srgb',
    toneMapping: 'aces',
    toneMappingExposure: 1.2,
    shadows: {
      enabled: true,
      type: 'pcfsoft',
      autoUpdate: true,
    },
  },
  performance: {
    enableFrustumCulling: true,
    enableOcclusionCulling: false,
    maxLights: 16,
    shadowMapSize: 4096,
    anisotropy: 16,
  },
};
