import * as fs from 'fs/promises';
import * as path from 'path';
import { ASSET_EXTENSIONS, ASSET_DEFINE_FUNCTIONS, type AssetType } from '../../core/lib/serialization/assets/AssetTypes';
import { omitDefaults } from '../../core/lib/serialization/utils/DefaultOmitter';
import { MATERIAL_DEFAULTS } from '../../core/lib/serialization/defaults/MaterialDefaults';
import type {
  IAssetStore,
  IAssetFileMeta,
  ISaveAssetRequest,
  ISaveAssetResult,
  ILoadAssetRequest,
  ILoadAssetResult,
  IListAssetsRequest,
} from './IAssetStore';

/**
 * Filesystem-based asset store implementation
 */
export class FsAssetStore implements IAssetStore {
  constructor(
    private libraryRoot: string, // e.g., 'src/game/assets'
    private scenesRoot: string = 'src/game/scenes',
  ) {}

  /**
   * Save an asset to the filesystem
   */
  async save(request: ISaveAssetRequest): Promise<ISaveAssetResult> {
    const { path: assetPath, payload, type } = request;

    // Determine file path
    const filePath = this.resolveAssetPath(assetPath, type);

    // Generate asset file content
    const content = this.generateAssetFile(payload, type);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, 'utf-8');

    // Get file stats
    const stats = await fs.stat(filePath);

    return {
      filename: path.basename(filePath),
      path: assetPath,
      size: stats.size,
    };
  }

  /**
   * Load an asset from the filesystem
   */
  async load(request: ILoadAssetRequest): Promise<ILoadAssetResult> {
    const { path: assetPath, type } = request;

    // Resolve file path
    const filePath = this.resolveAssetPath(assetPath, type);

    // Read file
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse asset
    const payload = this.parseAssetFile(content, type);

    return {
      filename: path.basename(filePath),
      payload,
    };
  }

  /**
   * List all assets of a specific type
   */
  async list(request: IListAssetsRequest): Promise<IAssetFileMeta[]> {
    const { type, scope = 'library', sceneName } = request;
    const assets: IAssetFileMeta[] = [];

    if (scope === 'library') {
      // List library assets
      const typeDir = path.join(this.libraryRoot, `${type}s`);
      const files = await this.findAssetFiles(typeDir, type);

      for (const file of files) {
        const stats = await fs.stat(file);
        const relativePath = path.relative(this.libraryRoot, file);
        const assetPath = `@/${relativePath.replace(ASSET_EXTENSIONS[type], '')}`;

        assets.push({
          filename: path.basename(file),
          path: assetPath,
          size: stats.size,
          type,
        });
      }
    } else if (scope === 'scene' && sceneName) {
      // List scene-local assets
      const sceneDir = path.join(this.scenesRoot, sceneName);
      const sceneAssetFile = path.join(sceneDir, `${sceneName}.${type}s.tsx`);

      try {
        const stats = await fs.stat(sceneAssetFile);
        assets.push({
          filename: path.basename(sceneAssetFile),
          path: `./${type}s/${sceneName}`,
          size: stats.size,
          type,
        });
      } catch {
        // File doesn't exist, return empty
      }
    }

    return assets;
  }

  /**
   * Delete an asset
   */
  async delete(request: { path: string; type: AssetType }): Promise<void> {
    const filePath = this.resolveAssetPath(request.path, request.type);
    await fs.unlink(filePath);
  }

  /**
   * Resolve asset path to filesystem path
   */
  private resolveAssetPath(assetPath: string, type: AssetType): string {
    const extension = ASSET_EXTENSIONS[type];

    if (assetPath.startsWith('@/')) {
      // Library asset: @/materials/common/Stone
      const relativePath = assetPath.replace('@/', '');
      return path.join(this.libraryRoot, `${relativePath}${extension}`);
    } else if (assetPath.startsWith('./')) {
      // Scene-relative asset: ./materials/TreeGreen
      // Extract scene name and asset ID
      const parts = assetPath.split('/');
      const sceneName = parts[1]; // Assumes format: ./materials/TreeGreen
      const sceneDir = path.join(this.scenesRoot, sceneName);
      return path.join(sceneDir, `${sceneName}.${type}s.tsx`);
    } else {
      throw new Error(`Invalid asset path: ${assetPath}. Must start with '@/' or './'`);
    }
  }

  /**
   * Find all asset files in a directory recursively
   */
  private async findAssetFiles(dir: string, type: AssetType): Promise<string[]> {
    const results: string[] = [];
    const extension = ASSET_EXTENSIONS[type];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findAssetFiles(fullPath, type);
          results.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return results;
  }

  /**
   * Generate asset file content
   */
  private generateAssetFile(payload: unknown, type: AssetType): string {
    const { single, plural } = ASSET_DEFINE_FUNCTIONS[type];

    // Determine import path based on type
    const importMap: Record<AssetType, string> = {
      material: '@core/lib/serialization/assets/defineMaterials',
      prefab: '@core/lib/serialization/assets/definePrefabs',
      input: '@core/lib/serialization/assets/defineInputAssets',
      script: '@core/lib/serialization/assets/defineScripts',
    };

    const importPath = importMap[type];
    const isSingle = !Array.isArray(payload);
    const defineFn = isSingle ? single : plural;
    const importFn = isSingle ? single : plural;

    // Add required imports for input assets
    const additionalImports = type === 'input'
      ? `\nimport { ActionType, ControlType, DeviceType, CompositeType } from '@core';`
      : '';

    // Omit default values for materials to reduce file size
    let processedPayload = payload;
    if (type === 'material') {
      if (isSingle) {
        processedPayload = this.cleanMaterialForSave(omitDefaults(payload as Record<string, unknown>, MATERIAL_DEFAULTS));
      } else if (Array.isArray(payload)) {
        processedPayload = payload.map(item => this.cleanMaterialForSave(omitDefaults(item as Record<string, unknown>, MATERIAL_DEFAULTS)));
      }
    }

    return `import { ${importFn} } from '${importPath}';${additionalImports}

export default ${defineFn}(${JSON.stringify(processedPayload, null, 2)});
`;
  }

  /**
   * Clean material by removing empty texture strings (convert to undefined)
   * This ensures optional texture fields are truly optional and not just empty strings
   */
  private cleanMaterialForSave(material: Partial<Record<string, unknown>>): Partial<Record<string, unknown>> {
    const textureFields = ['albedoTexture', 'normalTexture', 'metallicTexture', 'roughnessTexture', 'emissiveTexture', 'occlusionTexture'];
    const cleaned = { ...material };

    for (const field of textureFields) {
      if (field in cleaned && cleaned[field] === '') {
        delete cleaned[field];
      }
    }

    return cleaned;
  }

  /**
   * Parse asset file and extract payload
   */
  private parseAssetFile(content: string, type: AssetType): unknown {
    const { single, plural } = ASSET_DEFINE_FUNCTIONS[type];

    // Try array format first
    const arrayPattern = new RegExp(`${plural}\\(\\s*(\\[[\\s\\S]*?\\])\\s*\\);?\\s*$`, 'm');
    let match = content.match(arrayPattern);

    if (match) {
      const jsonStr = this.sanitizeForJson(match[1]);
      return JSON.parse(jsonStr);
    }

    // Try single format
    const singlePattern = new RegExp(`${single}\\(\\s*({[\\s\\S]*?})\\s*\\);?\\s*$`, 'm');
    match = content.match(singlePattern);

    if (match) {
      const jsonStr = this.sanitizeForJson(match[1]);
      return JSON.parse(jsonStr);
    }

    throw new Error(`Could not parse asset file: no ${single} or ${plural} found`);
  }

  /**
   * Sanitize TypeScript object notation to JSON
   */
  private sanitizeForJson(str: string): string {
    // Remove comments
    str = str.replace(/\/\/.*$/gm, '');
    str = str.replace(/\/\*[\s\S]*?\*\//g, '');

    // Replace unquoted keys with quoted keys
    str = str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Replace single quotes with double quotes
    str = str.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

    // Remove trailing commas
    str = str.replace(/,(\\s*[}\]])/g, '$1');

    return str;
  }
}
