/**
 * Shape Descriptor Types
 * Defines the contract for custom shape modules that can be dynamically discovered and rendered
 */

import type { ReactNode } from 'react';
import type { z } from 'zod';

/**
 * Metadata for a custom shape
 */
export interface IShapeMetadata {
  /** Unique identifier for the shape (kebab-case recommended, e.g., "super-shape") */
  id: string;
  /** Human-readable name displayed in the UI */
  name: string;
  /** Category for grouping shapes (e.g., "Procedural", "Environment", "Basic") */
  category?: string;
  /** Tags for search and filtering */
  tags?: string[];
  /** Version string for tracking shape changes */
  version?: string;
  /** Icon identifier (react-icons name or internal ID) */
  icon?: string;
  /** Optional static preview image (fallback if 3D preview fails) */
  previewImage?: string;
}

/**
 * Custom Shape Descriptor
 * Defines a pluggable shape that can be registered, discovered, and rendered
 *
 * @template TParams - Zod schema type for shape parameters
 *
 * @example
 * ```tsx
 * const paramsSchema = z.object({
 *   radius: z.number().default(0.5),
 *   segments: z.number().default(32),
 * });
 *
 * export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
 *   meta: {
 *     id: 'custom-sphere',
 *     name: 'Custom Sphere',
 *     category: 'Basic',
 *   },
 *   paramsSchema,
 *   getDefaultParams: () => paramsSchema.parse({}),
 *   renderGeometry: (params) => (
 *     <sphereGeometry args={[params.radius, params.segments, params.segments]} />
 *   ),
 * };
 * ```
 */
export interface ICustomShapeDescriptor<TParams extends z.ZodTypeAny> {
  /** Shape metadata for UI and discovery */
  meta: IShapeMetadata;

  /** Zod schema defining shape parameters with validation */
  paramsSchema: TParams;

  /**
   * Returns default parameters for this shape
   * Called when creating a new instance without explicit params
   */
  getDefaultParams(): z.infer<TParams>;

  /**
   * Renders the Three.js geometry for this shape
   * Should return React Three Fiber JSX elements (e.g., <boxGeometry />, <primitive object={geometry} />)
   *
   * @param params - Validated shape parameters
   * @returns React element rendering the geometry
   */
  renderGeometry(params: z.infer<TParams>): ReactNode;
}
