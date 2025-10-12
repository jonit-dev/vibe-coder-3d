/**
 * Script asset definition type
 * TODO: Define proper script interface when script system is implemented
 */
export interface IScriptDefinition {
  id: string;
  name: string;
  source?: string;
  [key: string]: unknown;
}

/**
 * Define scripts for external script asset files
 * Used in .scripts.tsx files to define scene-specific or shared scripts
 *
 * @example
 * ```typescript
 * // Forest.scripts.tsx
 * export default defineScripts([
 *   { id: 'TreeSway', name: 'Tree Sway Script', source: '...' },
 *   { id: 'WindEffect', name: 'Wind Effect', source: '...' },
 * ]);
 * ```
 */
export function defineScripts(scripts: IScriptDefinition[]): IScriptDefinition[] {
  return scripts;
}

/**
 * Define a single script for shared library files
 * Used in .script.tsx files in the shared asset library
 *
 * @example
 * ```typescript
 * // assets/scripts/PlayerController.script.tsx
 * export default defineScript({
 *   id: 'PlayerController',
 *   name: 'Player Controller',
 *   source: '...',
 * });
 * ```
 */
export function defineScript(script: IScriptDefinition): IScriptDefinition {
  return script;
}
