/**
 * Centralized ID generation utilities for assets (prefabs, materials, inputs, etc.)
 *
 * Ensures consistent naming across all asset types:
 * - IDs: kebab-case (e.g., "my-asset-name")
 * - File names: PascalCase (e.g., "MyAssetName.prefab.tsx")
 */

/**
 * Convert text to kebab-case for use as asset IDs
 *
 * @example
 * slugify("My Nice Trees") // "my-nice-trees"
 * slugify("Player Character") // "player-character"
 * slugify("Enemy (Type 1)") // "enemy-type-1"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Convert text to camelCase for use as file names (project convention)
 *
 * @example
 * toCamelCase("my nice trees") // "myNiceTrees"
 * toCamelCase("player-character") // "playerCharacter"
 * toCamelCase("enemy_type_1") // "enemyType1"
 */
export function toCamelCase(text: string): string {
  return text
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+(.)/g, (_, char) => char.toUpperCase()) // Replace separators + next char with uppercase
    .replace(/^(.)/, (char) => char.toLowerCase()); // Lowercase first character
}

/**
 * Generate a unique ID by appending a counter if needed
 *
 * @param baseId - The base ID to start with
 * @param existsCheck - Function that returns true if the ID already exists
 * @returns A unique ID (e.g., "trees", "trees-2", "trees-3")
 */
export function generateUniqueId(
  baseId: string,
  existsCheck: (id: string) => boolean
): string {
  if (!baseId) return '';

  let id = baseId;
  let counter = 2; // Start at 2 because baseId is effectively "1"

  while (existsCheck(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  return id;
}

/**
 * Generate both ID and filename from a name
 *
 * @param name - The human-readable name (e.g., "My Nice Trees")
 * @param extension - File extension (e.g., ".prefab.tsx", ".material.tsx")
 * @param existsCheck - Function that returns true if the ID already exists
 * @returns Object with id and filename
 *
 * @example
 * generateAssetIdentifiers("My Nice Trees", ".prefab.tsx", (id) => false)
 * // { id: "my-nice-trees", filename: "myNiceTrees.prefab.tsx" }
 */
export function generateAssetIdentifiers(
  name: string,
  extension: string,
  existsCheck: (id: string) => boolean
): { id: string; filename: string } {
  const baseId = slugify(name);
  const id = generateUniqueId(baseId, existsCheck);

  // For filename, use the unique ID (which may have counter) converted to camelCase
  const filename = `${toCamelCase(id)}${extension}`;

  return { id, filename };
}
