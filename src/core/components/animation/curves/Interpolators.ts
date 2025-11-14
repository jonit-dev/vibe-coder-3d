import * as THREE from 'three';

/**
 * Linear interpolation between two numbers
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two 3D vectors
 */
export function lerpVec3(
  a: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
  target: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  return target.lerpVectors(a, b, t);
}

/**
 * Spherical linear interpolation between two quaternions
 */
export function slerpQuat(
  a: THREE.Quaternion,
  b: THREE.Quaternion,
  t: number,
  target: THREE.Quaternion = new THREE.Quaternion()
): THREE.Quaternion {
  return target.copy(a).slerp(b, t);
}

/**
 * Hold interpolation (returns first value)
 */
export function hold<T>(a: T): T {
  return a;
}

/**
 * Catmull-Rom spline interpolation for smoother curves
 */
export function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;

  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Catmull-Rom spline interpolation for 3D vectors
 */
export function catmullRomVec3(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
  target: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  target.x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
  target.y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
  target.z = catmullRom(p0.z, p1.z, p2.z, p3.z, t);
  return target;
}

/**
 * Step interpolation (discrete value change)
 */
export function step<T>(a: T, b: T, t: number): T {
  return t < 1 ? a : b;
}

/**
 * Interpolate between two colors
 */
export function lerpColor(
  a: THREE.Color,
  b: THREE.Color,
  t: number,
  target: THREE.Color = new THREE.Color()
): THREE.Color {
  return target.copy(a).lerp(b, t);
}
