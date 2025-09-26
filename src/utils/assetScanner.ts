interface IAssetFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
}

// Use Vite's import.meta.glob to get all asset files at build time
const allAssets = import.meta.glob('/public/assets/**/*', {
  query: '?url',
  import: 'default',
  eager: false,
});

/**
 * Scans a directory path for assets using Vite's glob imports
 * This approach automatically discovers all assets without manual manifest maintenance
 */
export const scanAssetsDirectory = async (path: string): Promise<IAssetFile[]> => {
  const assets: IAssetFile[] = [];
  const processedFolders = new Set<string>();

  // Get all matching asset paths
  for (const assetPath in allAssets) {
    // Convert from /public/assets/... to /assets/...
    const webPath = assetPath.replace('/public', '');

    // Check if this asset belongs to the current directory
    const isInCurrentDir =
      path === '/assets'
        ? webPath.startsWith('/assets/') && webPath !== '/assets/'
        : webPath.startsWith(`${path}/`);

    if (!isInCurrentDir) continue;

    // Get the relative path from current directory
    const relativePath =
      path === '/assets' ? webPath.replace('/assets/', '') : webPath.replace(`${path}/`, '');

    // If it contains a slash, it's in a subdirectory
    if (relativePath.includes('/')) {
      const folderName = relativePath.split('/')[0];
      if (!processedFolders.has(folderName)) {
        processedFolders.add(folderName);
        assets.push({
          name: folderName,
          path: `${path}/${folderName}`,
          type: 'folder',
        });
      }
    } else {
      // It's a file in the current directory
      const extension = relativePath.split('.').pop()?.toLowerCase();
      assets.push({
        name: relativePath,
        path: webPath,
        type: 'file',
        extension: extension || undefined,
      });
    }
  }

  // Sort: folders first, then files
  return assets.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};
