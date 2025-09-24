import { getCurrentProjectConfig } from '../extension/GameExtensionPoints';

interface IAssetFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
}

/**
 * Project-aware asset service that respects the current game project's asset base path
 */
export class ProjectAssetService {
  private static instance: ProjectAssetService;

  private constructor() {}

  public static getInstance(): ProjectAssetService {
    if (!ProjectAssetService.instance) {
      ProjectAssetService.instance = new ProjectAssetService();
    }
    return ProjectAssetService.instance;
  }

  /**
   * Gets the current project's asset base path
   */
  public getAssetBasePath(): string {
    const config = getCurrentProjectConfig();
    return config?.assetBasePath || '/assets';
  }

  /**
   * Resolves an asset path relative to the current project's base path
   */
  public resolveAssetPath(relativePath: string): string {
    const basePath = this.getAssetBasePath();

    // Remove leading slash from relative path if present
    const cleanRelativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

    // Combine base path with relative path
    return `${basePath}/${cleanRelativePath}`.replace(/\/+/g, '/');
  }

  /**
   * Gets the public path for assets (where Vite looks for static assets)
   */
  public getPublicAssetPath(): string {
    const basePath = this.getAssetBasePath();
    return `/public${basePath}`;
  }

  /**
   * Scans the current project's asset directory
   * Note: For now, this still uses the hardcoded glob pattern
   * A more advanced implementation could use dynamic imports or a server-side API
   */
  public async scanProjectAssets(relativePath = ''): Promise<IAssetFile[]> {
    const basePath = this.getAssetBasePath();
    const fullPath = relativePath ? `${basePath}/${relativePath}` : basePath;

    // For now, delegate to the existing asset scanner
    // TODO: Make this truly project-aware when we add multi-project support
    const { scanAssetsDirectory } = await import('../../../utils/assetScanner');
    return scanAssetsDirectory(fullPath);
  }

  /**
   * Validates that an asset path is within the current project's allowed paths
   */
  public isValidAssetPath(assetPath: string): boolean {
    const basePath = this.getAssetBasePath();
    return assetPath.startsWith(basePath);
  }

  /**
   * Normalizes an asset path to prevent directory traversal attacks
   */
  public normalizeAssetPath(assetPath: string): string {
    // Remove any .. or . path segments and multiple slashes
    const normalized = assetPath
      .split('/')
      .filter((segment) => segment && segment !== '.' && segment !== '..')
      .join('/');

    return `/${normalized}`;
  }
}
