// Enhanced Terrain System Exports
// 🏔️ Complete terrain generation and management system with Web Worker support

// Core terrain worker and data types
export {
  terrainWorker,
  type ITerrainWorkerMessage,
  type ITerrainWorkerResponse,
  type ITerrainGeometryData,
} from './TerrainWorker';

// Performance monitoring and profiling
export { terrainProfiler, type IPerformanceMetrics, type IFrameData } from './TerrainProfiler';

// Intelligent caching system
export { terrainCache } from './TerrainCache';

// Terrain presets and management
export {
  TerrainPresetManager,
  terrainPresets,
  presetCategories,
  type ITerrainPreset,
} from './TerrainPresets';

// Usage Examples:
//
// 1. Generate terrain with web worker:
// const data = await terrainWorker.generateTerrain(terrainProps);
//
// 2. Monitor performance:
// terrainProfiler.enable();
// terrainProfiler.startProfile('terrain_generation');
// // ... terrain operations
// terrainProfiler.endProfile('terrain_generation');
// terrainProfiler.logPerformance();
//
// 3. Use presets:
// const mountainPreset = TerrainPresetManager.getPresetById('mountain-peaks');
// const terrainProps = TerrainPresetManager.createTerrainProps(mountainPreset, [200, 200], [257, 257]);
//
// 4. Cache terrain data:
// const cached = terrainCache.get(terrainProps);
// if (!cached) {
//   const generated = await terrainWorker.generateTerrain(terrainProps);
//   terrainCache.set(terrainProps, generated);
// }
