import type { IInputActionsAsset } from '@core/lib/input/inputTypes';
import { InputActionsAssetSchema } from '@core/lib/input/inputTypes';

/**
 * Define input assets for external input asset files
 * Used in .inputs.tsx files to define scene-specific or shared input maps
 * Automatically applies defaults from InputActionsAssetSchema
 *
 * @example
 * ```typescript
 * // Forest.inputs.tsx
 * export default defineInputAssets([
 *   {
 *     name: 'Default Input',
 *     controlSchemes: [...],
 *     actionMaps: [...],
 *   },
 * ]);
 * ```
 */
export function defineInputAssets(inputs: Partial<IInputActionsAsset>[]): IInputActionsAsset[] {
  return inputs.map(input => InputActionsAssetSchema.parse(input));
}

/**
 * Define a single input asset for shared library files
 * Used in .input.tsx files in the shared asset library
 * Automatically applies defaults from InputActionsAssetSchema
 *
 * @example
 * ```typescript
 * // assets/inputs/DefaultControls.input.tsx
 * export default defineInputAsset({
 *   name: 'Default Controls',
 *   controlSchemes: [...],
 *   actionMaps: [...],
 * });
 * ```
 */
export function defineInputAsset(input: Partial<IInputActionsAsset>): IInputActionsAsset {
  return InputActionsAssetSchema.parse(input);
}
