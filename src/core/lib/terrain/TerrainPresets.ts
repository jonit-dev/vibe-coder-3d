import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';

export interface ITerrainPreset {
  id: string;
  name: string;
  description: string;
  category: 'landscapes' | 'environments' | 'procedural' | 'geometric';
  icon: string; // Emoji or icon class
  config: Omit<TerrainData, 'size' | 'segments'>;
  previewImage?: string;
}

export const terrainPresets: ITerrainPreset[] = [
  // Landscapes Category
  {
    id: 'rolling-hills',
    name: 'Rolling Hills',
    description: 'Gentle rolling terrain perfect for peaceful landscapes',
    category: 'landscapes',
    icon: '🌾',
    config: {
      heightScale: 15,
      noiseEnabled: true,
      noiseSeed: 42,
      noiseFrequency: 2.5,
      noiseOctaves: 4,
      noisePersistence: 0.5,
      noiseLacunarity: 2.0,
    },
  },
  {
    id: 'mountain-peaks',
    name: 'Mountain Peaks',
    description: 'Dramatic mountain ranges with steep peaks and valleys',
    category: 'landscapes',
    icon: '🏔️',
    config: {
      heightScale: 80,
      noiseEnabled: true,
      noiseSeed: 137,
      noiseFrequency: 1.2,
      noiseOctaves: 6,
      noisePersistence: 0.7,
      noiseLacunarity: 2.2,
    },
  },
  {
    id: 'river-valley',
    name: 'River Valley',
    description: 'Carved valley with river-like depression through the center',
    category: 'landscapes',
    icon: '🏞️',
    config: {
      heightScale: 25,
      noiseEnabled: true,
      noiseSeed: 89,
      noiseFrequency: 3.0,
      noiseOctaves: 5,
      noisePersistence: 0.4,
      noiseLacunarity: 1.8,
    },
  },
  {
    id: 'plateau',
    name: 'Mesa Plateau',
    description: 'Flat-topped elevated terrain with steep sides',
    category: 'landscapes',
    icon: '🏜️',
    config: {
      heightScale: 40,
      noiseEnabled: true,
      noiseSeed: 256,
      noiseFrequency: 1.8,
      noiseOctaves: 3,
      noisePersistence: 0.8,
      noiseLacunarity: 2.5,
    },
  },

  // Environments Category
  {
    id: 'desert-dunes',
    name: 'Desert Dunes',
    description: 'Smooth sandy dunes with flowing curves',
    category: 'environments',
    icon: '🏖️',
    config: {
      heightScale: 12,
      noiseEnabled: true,
      noiseSeed: 314,
      noiseFrequency: 4.0,
      noiseOctaves: 3,
      noisePersistence: 0.3,
      noiseLacunarity: 1.5,
    },
  },
  {
    id: 'arctic-tundra',
    name: 'Arctic Tundra',
    description: 'Frozen wasteland with subtle undulations',
    category: 'environments',
    icon: '🧊',
    config: {
      heightScale: 8,
      noiseEnabled: true,
      noiseSeed: 666,
      noiseFrequency: 2.8,
      noiseOctaves: 4,
      noisePersistence: 0.35,
      noiseLacunarity: 2.1,
    },
  },
  {
    id: 'tropical-island',
    name: 'Tropical Island',
    description: 'Island-like terrain with elevated center and coastal plains',
    category: 'environments',
    icon: '🏝️',
    config: {
      heightScale: 35,
      noiseEnabled: true,
      noiseSeed: 123,
      noiseFrequency: 2.2,
      noiseOctaves: 5,
      noisePersistence: 0.6,
      noiseLacunarity: 2.0,
    },
  },
  {
    id: 'volcanic-crater',
    name: 'Volcanic Crater',
    description: 'Crater-like formation with raised rim and depressed center',
    category: 'environments',
    icon: '🌋',
    config: {
      heightScale: 60,
      noiseEnabled: true,
      noiseSeed: 777,
      noiseFrequency: 1.5,
      noiseOctaves: 4,
      noisePersistence: 0.75,
      noiseLacunarity: 2.3,
    },
  },

  // Procedural Category
  {
    id: 'high-frequency',
    name: 'High Frequency',
    description: 'Detailed terrain with lots of small features',
    category: 'procedural',
    icon: '📊',
    config: {
      heightScale: 20,
      noiseEnabled: true,
      noiseSeed: 999,
      noiseFrequency: 6.0,
      noiseOctaves: 6,
      noisePersistence: 0.5,
      noiseLacunarity: 2.0,
    },
  },
  {
    id: 'low-frequency',
    name: 'Low Frequency',
    description: 'Large-scale terrain features with broad shapes',
    category: 'procedural',
    icon: '🌊',
    config: {
      heightScale: 50,
      noiseEnabled: true,
      noiseSeed: 111,
      noiseFrequency: 0.8,
      noiseOctaves: 3,
      noisePersistence: 0.7,
      noiseLacunarity: 2.5,
    },
  },
  {
    id: 'fractal-detail',
    name: 'Fractal Detail',
    description: 'Complex fractal terrain with maximum detail',
    category: 'procedural',
    icon: '🔍',
    config: {
      heightScale: 30,
      noiseEnabled: true,
      noiseSeed: 555,
      noiseFrequency: 3.5,
      noiseOctaves: 8,
      noisePersistence: 0.6,
      noiseLacunarity: 2.1,
    },
  },
  {
    id: 'smooth-organic',
    name: 'Smooth Organic',
    description: 'Organic-looking terrain with smooth transitions',
    category: 'procedural',
    icon: '🍃',
    config: {
      heightScale: 18,
      noiseEnabled: true,
      noiseSeed: 222,
      noiseFrequency: 2.0,
      noiseOctaves: 4,
      noisePersistence: 0.4,
      noiseLacunarity: 1.8,
    },
  },

  // Geometric Category
  {
    id: 'flat-plane',
    name: 'Flat Plane',
    description: 'Completely flat terrain - perfect starting point',
    category: 'geometric',
    icon: '⬜',
    config: {
      heightScale: 0,
      noiseEnabled: false,
      noiseSeed: 0,
      noiseFrequency: 1.0,
      noiseOctaves: 1,
      noisePersistence: 0.5,
      noiseLacunarity: 2.0,
    },
  },
  {
    id: 'stepped-terraces',
    name: 'Stepped Terraces',
    description: 'Terraced terrain with distinct elevation levels',
    category: 'geometric',
    icon: '🪜',
    config: {
      heightScale: 30,
      noiseEnabled: true,
      noiseSeed: 888,
      noiseFrequency: 1.5,
      noiseOctaves: 2,
      noisePersistence: 0.9,
      noiseLacunarity: 3.0,
    },
  },
];

// Preset categories with metadata
export const presetCategories = {
  landscapes: {
    name: 'Landscapes',
    description: 'Natural terrain formations for realistic environments',
    icon: '🌄',
    color: 'green',
  },
  environments: {
    name: 'Environments',
    description: 'Biome-specific terrains for different climates',
    icon: '🌍',
    color: 'blue',
  },
  procedural: {
    name: 'Procedural',
    description: 'Different noise configurations for various effects',
    icon: '🎲',
    color: 'purple',
  },
  geometric: {
    name: 'Geometric',
    description: 'Mathematical and structured terrain patterns',
    icon: '📐',
    color: 'orange',
  },
};

// Utility functions
export class TerrainPresetManager {
  static getAllPresets(): ITerrainPreset[] {
    return [...terrainPresets];
  }

  static getPresetsByCategory(category: string): ITerrainPreset[] {
    return terrainPresets.filter((preset) => preset.category === category);
  }

  static getPresetById(id: string): ITerrainPreset | undefined {
    return terrainPresets.find((preset) => preset.id === id);
  }

  static getRandomPreset(category?: string): ITerrainPreset {
    const presets = category ? this.getPresetsByCategory(category) : terrainPresets;

    const randomIndex = Math.floor(Math.random() * presets.length);
    return presets[randomIndex];
  }

  // Create terrain props from preset with custom size/segments
  static createTerrainProps(
    preset: ITerrainPreset,
    size: [number, number] = [100, 100],
    segments: [number, number] = [129, 129],
  ): TerrainData {
    return {
      ...preset.config,
      size,
      segments,
    };
  }

  // Blend two presets together
  static blendPresets(
    preset1: ITerrainPreset,
    preset2: ITerrainPreset,
    blendFactor: number = 0.5,
  ): Omit<TerrainData, 'size' | 'segments'> {
    const t = Math.max(0, Math.min(1, blendFactor));

    return {
      heightScale: preset1.config.heightScale * (1 - t) + preset2.config.heightScale * t,
      noiseEnabled: preset1.config.noiseEnabled || preset2.config.noiseEnabled,
      noiseSeed: Math.floor(preset1.config.noiseSeed * (1 - t) + preset2.config.noiseSeed * t),
      noiseFrequency: preset1.config.noiseFrequency * (1 - t) + preset2.config.noiseFrequency * t,
      noiseOctaves: Math.round(
        preset1.config.noiseOctaves * (1 - t) + preset2.config.noiseOctaves * t,
      ),
      noisePersistence:
        preset1.config.noisePersistence * (1 - t) + preset2.config.noisePersistence * t,
      noiseLacunarity:
        preset1.config.noiseLacunarity * (1 - t) + preset2.config.noiseLacunarity * t,
    };
  }

  // Generate variations of a preset
  static generateVariations(
    preset: ITerrainPreset,
    count: number = 3,
    variationAmount: number = 0.2,
  ): Array<Omit<TerrainData, 'size' | 'segments'>> {
    const variations = [];

    for (let i = 0; i < count; i++) {
      const v = variationAmount;
      variations.push({
        ...preset.config,
        noiseSeed: preset.config.noiseSeed + i * 100,
        heightScale: preset.config.heightScale * (1 + (Math.random() - 0.5) * v),
        noiseFrequency: preset.config.noiseFrequency * (1 + (Math.random() - 0.5) * v),
        noisePersistence: Math.max(
          0.1,
          Math.min(1.0, preset.config.noisePersistence + (Math.random() - 0.5) * v),
        ),
      });
    }

    return variations;
  }

  // Search presets by name or description
  static searchPresets(query: string): ITerrainPreset[] {
    const lowerQuery = query.toLowerCase();
    return terrainPresets.filter(
      (preset) =>
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.description.toLowerCase().includes(lowerQuery),
    );
  }
}
