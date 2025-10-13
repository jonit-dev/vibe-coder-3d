import { z } from 'zod';

/**
 * Script asset definition schema
 * Basic schema for script assets - can be extended when script system is fully implemented
 */
export const ScriptDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: z.string().optional(),
  // Allow additional fields for future extension
}).passthrough();

export type IScriptDefinition = z.infer<typeof ScriptDefinitionSchema>;

/**
 * Define scripts for external script asset files
 * Used in .scripts.tsx files to define scene-specific or shared scripts
 * Automatically applies defaults from ScriptDefinitionSchema
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
export function defineScripts(scripts: Partial<IScriptDefinition>[]): IScriptDefinition[] {
  return scripts.map(script => ScriptDefinitionSchema.parse(script));
}

/**
 * Define a single script for shared library files
 * Used in .script.tsx files in the shared asset library
 * Automatically applies defaults from ScriptDefinitionSchema
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
export function defineScript(script: Partial<IScriptDefinition>): IScriptDefinition {
  return ScriptDefinitionSchema.parse(script);
}
