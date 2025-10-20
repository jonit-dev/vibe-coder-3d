import { Logger } from '@core/lib/logger';

const logger = Logger.create('LODManager');

export type LODQuality = 'original' | 'high_fidelity' | 'low_fidelity';

export interface ILODConfig {
  quality: LODQuality;
  autoSwitch: boolean;
  distanceThresholds?: {
    high: number;
    low: number;
  };
}

/**
 * LOD Manager - Manages Level of Detail switching for 3D models
 *
 * Quality Levels:
 * - original: Base optimized model (60% ratio)
 * - high_fidelity: 75% triangle count, 0.0005 error
 * - low_fidelity: 35% triangle count, 0.002 error
 */
class LODManagerClass {
  private static instance: LODManagerClass;
  private config: ILODConfig = {
    quality: 'original',
    autoSwitch: false,
    distanceThresholds: {
      high: 50,
      low: 100,
    },
  };

  private constructor() {}

  static getInstance(): LODManagerClass {
    if (!LODManagerClass.instance) {
      LODManagerClass.instance = new LODManagerClass();
    }
    return LODManagerClass.instance;
  }

  /**
   * Set global LOD quality
   * NOTE: When manually setting quality, auto-switch is disabled to ensure the manual setting takes precedence
   */
  setQuality(quality: LODQuality): void {
    this.config.quality = quality;

    // Disable auto-switch when manually setting quality
    // This ensures manual quality selection overrides distance-based switching
    if (this.config.autoSwitch) {
      this.config.autoSwitch = false;
    }
  }

  /**
   * Get current LOD quality
   */
  getQuality(): LODQuality {
    return this.config.quality;
  }

  /**
   * Enable/disable automatic LOD switching based on distance
   */
  setAutoSwitch(enabled: boolean): void {
    this.config.autoSwitch = enabled;
  }

  /**
   * Set distance thresholds for automatic LOD switching
   */
  setDistanceThresholds(high: number, low: number): void {
    this.config.distanceThresholds = { high, low };
    logger.debug('Distance thresholds updated', { high, low });
  }

  /**
   * Get LOD quality for a given distance (if auto-switch enabled)
   */
  getQualityForDistance(distance: number): LODQuality {
    logger.debug('📏 getQualityForDistance called', {
      distance,
      autoSwitch: this.config.autoSwitch,
      thresholds: this.config.distanceThresholds,
      currentQuality: this.config.quality,
    });

    if (!this.config.autoSwitch) {
      logger.debug('❌ Auto-switch disabled, returning global quality', {
        quality: this.config.quality,
      });
      return this.config.quality;
    }

    const { high, low } = this.config.distanceThresholds!;

    let quality: LODQuality;
    if (distance < high) {
      quality = 'original';
    } else if (distance < low) {
      quality = 'high_fidelity';
    } else {
      quality = 'low_fidelity';
    }

    logger.debug('✅ Distance-based quality determined', {
      distance,
      quality,
      thresholds: { high, low },
      logic: `distance(${distance}) < high(${high}) ? original : < low(${low}) ? high_fidelity : low_fidelity`,
    });

    return quality;
  }

  /**
   * Get the model path with LOD suffix
   */
  getLODPath(basePath: string, quality: LODQuality = this.config.quality): string {
    logger.debug('🗺️ getLODPath called', {
      basePath,
      quality,
      defaultQuality: this.config.quality,
    });

    if (quality === 'original') {
      logger.debug('✅ Original quality, returning basePath unchanged', {
        result: basePath,
      });
      return basePath;
    }

    // Check if the path already contains an LOD quality suffix
    const hasHighFidelity = basePath.includes('.high_fidelity.');
    const hasLowFidelity = basePath.includes('.low_fidelity.');
    const hasOriginalInLod = basePath.includes('/lod/') && !hasHighFidelity && !hasLowFidelity;

    if (hasHighFidelity || hasLowFidelity) {
      // Path already has a quality suffix - replace it with the new quality
      logger.debug('🔄 Path already has LOD quality, replacing', {
        basePath,
        currentQuality: hasHighFidelity ? 'high_fidelity' : 'low_fidelity',
        newQuality: quality,
      });

      const result = basePath
        .replace('.high_fidelity.', `.${quality}.`)
        .replace('.low_fidelity.', `.${quality}.`);

      logger.info('✅ LOD path resolved (quality replaced)', {
        basePath,
        quality,
        result,
        transform: `${basePath} -> ${result}`,
      });

      return result;
    }

    // Handle two path patterns:
    // 1. /models/Model/glb/Model.glb -> /models/Model/lod/Model.high_fidelity.glb
    // 2. /models/Model/Model.glb -> /models/Model/lod/Model.high_fidelity.glb

    let path: string;

    if (basePath.includes('/glb/')) {
      // Pattern 1: Has /glb/ subdirectory
      path = basePath.replace('/glb/', '/lod/');
    } else if (hasOriginalInLod) {
      // Pattern 3: Already in /lod/ directory but no quality suffix (original quality)
      path = basePath;
    } else {
      // Pattern 2: No /glb/ subdirectory - insert /lod/ before filename
      const lastSlash = basePath.lastIndexOf('/');
      const dir = basePath.substring(0, lastSlash);
      const filename = basePath.substring(lastSlash + 1);
      path = `${dir}/lod/${filename}`;
    }

    const ext = path.substring(path.lastIndexOf('.'));
    const withoutExt = path.substring(0, path.lastIndexOf('.'));
    const result = `${withoutExt}.${quality}${ext}`;

    return result;
  }

  /**
   * Get all available LOD paths for a model
   */
  getAllLODPaths(basePath: string): Record<LODQuality, string> {
    return {
      original: basePath,
      high_fidelity: this.getLODPath(basePath, 'high_fidelity'),
      low_fidelity: this.getLODPath(basePath, 'low_fidelity'),
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): ILODConfig {
    return { ...this.config };
  }
}

export const lodManager = LODManagerClass.getInstance();
