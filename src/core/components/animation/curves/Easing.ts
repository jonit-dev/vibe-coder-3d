import BezierEasing from 'bezier-easing';

export type EasingType = 'linear' | 'step' | 'bezier' | 'custom';

export interface IEasingFunction {
  (t: number): number;
}

/**
 * Predefined easing functions
 */
export const EasingPresets = {
  linear: (t: number) => t,
  step: (t: number) => (t < 1 ? 0 : 1),
  easeInOut: BezierEasing(0.42, 0, 0.58, 1),
  easeIn: BezierEasing(0.42, 0, 1, 1),
  easeOut: BezierEasing(0, 0, 0.58, 1),
  easeInQuad: BezierEasing(0.11, 0, 0.5, 0),
  easeOutQuad: BezierEasing(0.5, 1, 0.89, 1),
  easeInOutQuad: BezierEasing(0.45, 0, 0.55, 1),
  easeInCubic: BezierEasing(0.32, 0, 0.67, 0),
  easeOutCubic: BezierEasing(0.33, 1, 0.68, 1),
  easeInOutCubic: BezierEasing(0.65, 0, 0.35, 1),
} as const;

/**
 * Create a bezier easing function from control points
 */
export function createBezierEasing(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): IEasingFunction {
  return BezierEasing(x1, y1, x2, y2);
}

/**
 * Get easing function by type and optional parameters
 */
export function getEasingFunction(
  type: EasingType,
  args?: number[]
): IEasingFunction {
  switch (type) {
    case 'linear':
      return EasingPresets.linear;
    case 'step':
      return EasingPresets.step;
    case 'bezier':
      if (args && args.length === 4) {
        return createBezierEasing(args[0], args[1], args[2], args[3]);
      }
      return EasingPresets.easeInOut;
    case 'custom':
      return EasingPresets.linear;
    default:
      return EasingPresets.linear;
  }
}
