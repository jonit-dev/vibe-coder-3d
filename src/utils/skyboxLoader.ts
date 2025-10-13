/**
 * Skybox loading utilities
 * Dynamically loads skybox textures from public/assets/skyboxes
 */

export interface ISkyboxAsset {
  name: string;
  path: string;
  extension: string;
}

// Use Vite's import.meta.glob to get all skybox files at build time
const allSkyboxes = import.meta.glob('/public/assets/skyboxes/*', {
  query: '?url',
  import: 'default',
  eager: false,
});

/**
 * Loads all available skybox textures from the assets directory
 * @returns Promise resolving to array of skybox assets
 */
export const loadAvailableSkyboxes = async (): Promise<ISkyboxAsset[]> => {
  const skyboxes: ISkyboxAsset[] = [];

  for (const assetPath in allSkyboxes) {
    // Convert from /public/assets/skyboxes/... to /assets/skyboxes/...
    const webPath = assetPath.replace('/public', '');

    // Extract filename and extension
    const filename = assetPath.split('/').pop() || '';
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    // Only include image files
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'hdr', 'exr'];
    if (validExtensions.includes(extension)) {
      skyboxes.push({
        name: filename.replace(`.${extension}`, ''),
        path: webPath,
        extension,
      });
    }
  }

  // Sort by name
  return skyboxes.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Gets all skybox paths synchronously (for component defaults)
 * @returns Array of skybox paths
 */
export const getSkyboxPaths = (): string[] => {
  const paths: string[] = [''];  // Empty string for "none"

  for (const assetPath in allSkyboxes) {
    const webPath = assetPath.replace('/public', '');
    const extension = assetPath.split('.').pop()?.toLowerCase() || '';

    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'hdr', 'exr'];
    if (validExtensions.includes(extension)) {
      paths.push(webPath);
    }
  }

  return paths.sort();
};
