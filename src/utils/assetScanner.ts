interface IAssetFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
}

/**
 * Scans a directory path for assets by attempting to fetch the directory listing
 * Falls back to known structure if direct scanning fails
 */
export const scanAssetsDirectory = async (path: string): Promise<IAssetFile[]> => {
  try {
    // In web environment, we can't directly access the filesystem
    // Try to use fetch to get directory listing if the dev server supports it
    const response = await fetch(path);

    if (response.ok) {
      const html = await response.text();
      return parseDirectoryListing(html, path);
    }
  } catch {
    // Fetch failed, fallback to scanning known structure
  }

  // Fallback: build asset structure by attempting to fetch known files
  return await buildAssetStructureFromAttempts(path);
};

/**
 * Parse HTML directory listing (if available)
 */
const parseDirectoryListing = (html: string, basePath: string): IAssetFile[] => {
  const assets: IAssetFile[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Look for links that represent files/folders
  const links = doc.querySelectorAll('a[href]');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '../' || href.startsWith('http')) return;

    const name = href.endsWith('/') ? href.slice(0, -1) : href;
    const isFolder = href.endsWith('/');
    const fullPath = `${basePath}/${name}`.replace('//', '/');

    assets.push({
      name,
      path: fullPath,
      type: isFolder ? 'folder' : 'file',
      extension: isFolder ? undefined : name.split('.').pop()?.toLowerCase(),
    });
  });

  return assets.sort((a, b) => {
    // Folders first, then files
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};

/**
 * Build asset structure by attempting to fetch known files/folders
 */
const buildAssetStructureFromAttempts = async (path: string): Promise<IAssetFile[]> => {
  const assets: IAssetFile[] = [];

  // Known folder structure to check
  const knownStructure: Record<
    string,
    { folders?: string[]; files?: Array<{ name: string; ext: string }> }
  > = {
    '/assets': {
      folders: ['models', 'skyboxes', 'textures'],
    },
    '/assets/skyboxes': {
      files: [
        { name: 'city_night', ext: 'jpg' },
        { name: 'desert_dusk', ext: 'jpg' },
        { name: 'forest_day', ext: 'jpg' },
        { name: 'mountain_sunset', ext: 'jpg' },
        { name: 'ocean_horizon', ext: 'jpg' },
      ],
    },
    '/assets/textures': {
      files: [{ name: 'crate-texture', ext: 'png' }],
    },
    '/assets/models': {
      folders: ['NightStalker'],
    },
    '/assets/models/NightStalker': {
      folders: ['animations', 'glb', 'textures'],
    },
    '/assets/models/NightStalker/animations': {
      files: [{ name: 'NightStalker_Standing_Idle', ext: 'glb' }],
    },
    '/assets/models/NightStalker/glb': {
      files: [{ name: 'NightStalker_Night_Stalker', ext: 'glb' }],
    },
    '/assets/models/NightStalker/textures': {
      files: [{ name: 'NightStalker_texture', ext: 'png' }],
    },
  };

  const structure = knownStructure[path];
  if (!structure) return assets;

  // Check folders
  if (structure.folders) {
    for (const folder of structure.folders) {
      const folderPath = `${path}/${folder}`.replace('//', '/');
      assets.push({
        name: folder,
        path: folderPath,
        type: 'folder',
      });
    }
  }

  // Check files
  if (structure.files) {
    for (const file of structure.files) {
      const fileName = `${file.name}.${file.ext}`;
      const filePath = `${path}/${fileName}`.replace('//', '/');

      // Attempt to verify file exists by making a HEAD request
      try {
        const response = await fetch(filePath, { method: 'HEAD' });
        if (response.ok) {
          assets.push({
            name: fileName,
            path: filePath,
            type: 'file',
            extension: file.ext,
          });
        }
      } catch {
        // File doesn't exist or can't be accessed, add it anyway for now
        // In development, some files might not be accessible via HEAD requests
        assets.push({
          name: fileName,
          path: filePath,
          type: 'file',
          extension: file.ext,
        });
      }
    }
  }

  return assets.sort((a, b) => {
    // Folders first, then files
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};
