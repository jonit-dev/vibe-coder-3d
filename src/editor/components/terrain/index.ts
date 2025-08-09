// Terrain UI Components Exports
// 🎨 React components for terrain creation and management

// Preview components
export { TerrainPreview, ColoredTerrainPreview } from './TerrainPreview';

// Terrain creation wizard
export { TerrainWizard } from './TerrainWizard';

// Usage Examples:
//
// 1. Add terrain preview to UI:
// <TerrainPreview terrain={terrainConfig} size={128} />
// <ColoredTerrainPreview terrain={terrainConfig} size={128} />
//
// 2. Use terrain creation wizard:
// <TerrainWizard
//   onComplete={(config) => createTerrain(config)}
//   onCancel={() => setShowWizard(false)}
//   initialConfig={existingConfig}
// />
