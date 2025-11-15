import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ActionType,
  CompositeType,
  ControlType,
  DeviceType,
  InputActionsAssetSchema,
} from '../../core/lib/input/inputTypes';
import {
  ASSET_DEFINE_FUNCTIONS,
  ASSET_EXTENSIONS,
  type AssetType,
} from '../../core/lib/serialization/assets/AssetTypes';
import { ScriptDefinitionSchema } from '../../core/lib/serialization/assets/defineScripts';
import { AnimationAssetSchema } from '../../core/animation/assets/defineAnimations';
import { omitDefaults } from '../../core/lib/serialization/utils/DefaultOmitter';
import { toCamelCase } from '../../core/lib/utils/idGenerator';
import { MaterialDefinitionSchema } from '../../core/materials/Material.types';
import { PrefabDefinitionSchema } from '../../core/prefabs/Prefab.types';
import type {
  IAssetFileMeta,
  IAssetStore,
  IListAssetsRequest,
  ILoadAssetRequest,
  ILoadAssetResult,
  ISaveAssetRequest,
  ISaveAssetResult,
} from './IAssetStore';

/**
 * Serialize input assets with enum values instead of strings
 * This ensures the generated .input.tsx files use TypeScript enum references
 */
const serializeInputAssets = (inputAssets: unknown): string => {
  // Handle both single assets and arrays
  const assetsToSerialize = Array.isArray(inputAssets) ? inputAssets : [inputAssets];
  let json = JSON.stringify(assetsToSerialize, null, 2);

  // Replace string values with enum references for TypeScript compilation
  json = json.replace(/"deviceType":\s*"keyboard"/g, `"deviceType": "${DeviceType.Keyboard}"`);
  json = json.replace(/"deviceType":\s*"mouse"/g, `"deviceType": "${DeviceType.Mouse}"`);
  json = json.replace(/"deviceType":\s*"gamepad"/g, `"deviceType": "${DeviceType.Gamepad}"`);
  json = json.replace(/"deviceType":\s*"touch"/g, `"deviceType": "${DeviceType.Touch}"`);

  json = json.replace(/"actionType":\s*"button"/g, `"actionType": "${ActionType.Button}"`);
  json = json.replace(/"actionType":\s*"value"/g, `"actionType": "${ActionType.Value}"`);
  json = json.replace(
    /"actionType":\s*"passthrough"/g,
    `"actionType": "${ActionType.PassThrough}"`,
  );

  json = json.replace(/"controlType":\s*"button"/g, `"controlType": "${ControlType.Button}"`);
  json = json.replace(/"controlType":\s*"axis"/g, `"controlType": "${ControlType.Axis}"`);
  json = json.replace(/"controlType":\s*"vector2"/g, `"controlType": "${ControlType.Vector2}"`);
  json = json.replace(/"controlType":\s*"vector3"/g, `"controlType": "${ControlType.Vector3}"`);

  json = json.replace(
    /"compositeType":\s*"1DAxis"/g,
    `"compositeType": "${CompositeType.OneModifier}"`,
  );
  json = json.replace(
    /"compositeType":\s*"2DVector"/g,
    `"compositeType": "${CompositeType.TwoDVector}"`,
  );
  json = json.replace(
    /"compositeType":\s*"3DVector"/g,
    `"compositeType": "${CompositeType.ThreeDVector}"`,
  );

  json = json.replace(/"type":\s*"keyboard"/g, `"type": "${DeviceType.Keyboard}"`);
  json = json.replace(/"type":\s*"mouse"/g, `"type": "${DeviceType.Mouse}"`);
  json = json.replace(/"type":\s*"gamepad"/g, `"type": "${DeviceType.Gamepad}"`);
  json = json.replace(/"type":\s*"touch"/g, `"type": "${DeviceType.Touch}"`);

  return json;
};

/**
 * Extract single asset from serialized array format
 */
const extractSingleAsset = (serializedArray: string): string => {
  // Remove array brackets and extract the first element
  const match = serializedArray.match(/^\s*\[\s*({[\s\S]*})\s*\]\s*$/);
  return match ? match[1] : serializedArray;
};

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
   * Converts asset IDs to camelCase for consistent file naming (project convention)
   */
  private resolveAssetPath(assetPath: string, type: AssetType): string {
    const extension = ASSET_EXTENSIONS[type];

    if (assetPath.startsWith('@/')) {
      // Library asset: @/materials/my-nice-trees -> materials/myNiceTrees.material.tsx
      const relativePath = assetPath.replace('@/', '');
      const pathParts = relativePath.split('/');

      // Convert the last part (filename) to camelCase
      const filename = pathParts[pathParts.length - 1];
      pathParts[pathParts.length - 1] = toCamelCase(filename);

      const normalizedPath = pathParts.join('/');
      return path.join(this.libraryRoot, `${normalizedPath}${extension}`);
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
      animation: '@core/animation/assets/defineAnimations',
    };

    const importPath = importMap[type];
    const isSingle = !Array.isArray(payload);
    const defineFn = isSingle ? single : plural;
    const importFn = isSingle ? single : plural;

    // Add required imports for input assets
    const additionalImports =
      type === 'input'
        ? `\nimport { ActionType, ControlType, DeviceType, CompositeType } from '@core';`
        : '';

    // Omit default values to reduce file size
    // Extract defaults from Zod schemas (single source of truth)
    let processedPayload = payload;

    // Map asset types to their schemas
    const schemaMap = {
      material: MaterialDefinitionSchema,
      prefab: PrefabDefinitionSchema,
      input: InputActionsAssetSchema,
      script: ScriptDefinitionSchema,
      animation: AnimationAssetSchema,
    };

    const schema = schemaMap[type];
    if (schema) {
      const defaults = this.extractSchemaDefaults(schema, type);
      if (isSingle) {
        processedPayload = this.cleanOptionalFields(
          omitDefaults(payload as Record<string, unknown>, defaults),
          type,
        );
      } else if (Array.isArray(payload)) {
        processedPayload = payload.map((item) =>
          this.cleanOptionalFields(omitDefaults(item as Record<string, unknown>, defaults), type),
        );
      }
    }

    // Use enum references for input assets instead of string literals
    let payloadString: string;
    if (type === 'input') {
      const serialized = serializeInputAssets(processedPayload);
      payloadString = isSingle ? extractSingleAsset(serialized) : serialized;
    } else {
      payloadString = JSON.stringify(processedPayload, null, 2);
    }

    return `import { ${importFn} } from '${importPath}';${additionalImports}

export default ${defineFn}(${payloadString});
`;
  }

  /**
   * Extract default values from a Zod schema
   * Uses Zod's parse with a minimal valid object to get all defaults
   */
  private extractSchemaDefaults(schema: z.ZodSchema, type: AssetType): Record<string, unknown> {
    try {
      // Create minimal valid objects for each type
      const minimalObjects = {
        material: { id: '_', name: '_' },
        prefab: { id: '_', name: '_', root: { name: '_', components: {} } },
        input: { name: '_', controlSchemes: [], actionMaps: [] },
        script: { id: '_', name: '_' },
        animation: { id: '_', name: '_', duration: 1, tracks: [] },
      };

      const minimal = minimalObjects[type];
      const parsed = schema.parse(minimal);

      // For prefabs, we need to include nested defaults for the root entity
      if (type === 'prefab') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, name, ...defaults } = parsed;
        // Extract defaults for the nested root entity structure
        if (defaults.root && typeof defaults.root === 'object') {
          const rootDefaults = defaults.root as Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { name: rootName, components, ...nestedDefaults } = rootDefaults;
          // Only keep actual defaults (like children: [])
          return {
            ...defaults,
            root: nestedDefaults,
          };
        }
        return defaults;
      }

      // For other types, remove the minimal required fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, name, root, controlSchemes, actionMaps, duration, tracks, ...defaults } = parsed;
      return defaults;
    } catch {
      return {};
    }
  }

  /**
   * Clean optional fields by removing empty values
   * This ensures optional fields are truly optional and not just empty strings/arrays
   */
  private cleanOptionalFields(
    asset: Partial<Record<string, unknown>>,
    type: AssetType,
  ): Partial<Record<string, unknown>> {
    const cleaned = { ...asset };

    if (type === 'material') {
      // Remove empty texture strings
      const textureFields = [
        'albedoTexture',
        'normalTexture',
        'metallicTexture',
        'roughnessTexture',
        'emissiveTexture',
        'occlusionTexture',
      ];
      for (const field of textureFields) {
        if (field in cleaned && cleaned[field] === '') {
          delete cleaned[field];
        }
      }
    } else if (type === 'prefab') {
      // Remove empty optional fields
      if ('description' in cleaned && !cleaned.description) {
        delete cleaned.description;
      }
      if (
        'dependencies' in cleaned &&
        Array.isArray(cleaned.dependencies) &&
        cleaned.dependencies.length === 0
      ) {
        delete cleaned.dependencies;
      }
      if ('tags' in cleaned && Array.isArray(cleaned.tags) && cleaned.tags.length === 0) {
        delete cleaned.tags;
      }
      if (
        'metadata' in cleaned &&
        typeof cleaned.metadata === 'object' &&
        Object.keys(cleaned.metadata as object).length === 0
      ) {
        delete cleaned.metadata;
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
