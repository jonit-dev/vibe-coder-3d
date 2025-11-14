import * as THREE from 'three';
import type { ITrack } from './TrackTypes';
import { findKeyframeRange, getNormalizedTime } from './TrackTypes';
import { getEasingFunction } from '../curves/Easing';
import { lerpVec3, slerpQuat } from '../curves/Interpolators';

/**
 * Evaluate transform.position track at given time
 */
export function evaluatePositionTrack(
  track: ITrack,
  time: number,
  target: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  const { prev, next } = findKeyframeRange(track.keyframes, time);

  if (!prev && !next) {
    return target.set(0, 0, 0);
  }

  if (!next || prev === next) {
    const value = prev!.value as [number, number, number];
    return target.set(value[0], value[1], value[2]);
  }

  if (!prev) {
    const value = next.value as [number, number, number];
    return target.set(value[0], value[1], value[2]);
  }

  const t = getNormalizedTime(prev, next, time);
  const easingFn = getEasingFunction(next.easing, next.easingArgs);
  const easedT = easingFn(t);

  const prevValue = prev.value as [number, number, number];
  const nextValue = next.value as [number, number, number];

  const prevVec = new THREE.Vector3(prevValue[0], prevValue[1], prevValue[2]);
  const nextVec = new THREE.Vector3(nextValue[0], nextValue[1], nextValue[2]);

  return lerpVec3(prevVec, nextVec, easedT, target);
}

/**
 * Evaluate transform.rotation track at given time
 */
export function evaluateRotationTrack(
  track: ITrack,
  time: number,
  target: THREE.Quaternion = new THREE.Quaternion(),
): THREE.Quaternion {
  const { prev, next } = findKeyframeRange(track.keyframes, time);

  if (!prev && !next) {
    return target.identity();
  }

  if (!next || prev === next) {
    const value = prev!.value as [number, number, number, number];
    return target.set(value[0], value[1], value[2], value[3]).normalize();
  }

  if (!prev) {
    const value = next.value as [number, number, number, number];
    return target.set(value[0], value[1], value[2], value[3]).normalize();
  }

  const t = getNormalizedTime(prev, next, time);
  const easingFn = getEasingFunction(next.easing, next.easingArgs);
  const easedT = easingFn(t);

  const prevValue = prev.value as [number, number, number, number];
  const nextValue = next.value as [number, number, number, number];

  const prevQuat = new THREE.Quaternion(
    prevValue[0],
    prevValue[1],
    prevValue[2],
    prevValue[3],
  ).normalize();
  const nextQuat = new THREE.Quaternion(
    nextValue[0],
    nextValue[1],
    nextValue[2],
    nextValue[3],
  ).normalize();

  return slerpQuat(prevQuat, nextQuat, easedT, target);
}

/**
 * Evaluate transform.scale track at given time
 */
export function evaluateScaleTrack(
  track: ITrack,
  time: number,
  target: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  const { prev, next } = findKeyframeRange(track.keyframes, time);

  if (!prev && !next) {
    return target.set(1, 1, 1);
  }

  if (!next || prev === next) {
    const value = prev!.value as [number, number, number];
    return target.set(value[0], value[1], value[2]);
  }

  if (!prev) {
    const value = next.value as [number, number, number];
    return target.set(value[0], value[1], value[2]);
  }

  const t = getNormalizedTime(prev, next, time);
  const easingFn = getEasingFunction(next.easing, next.easingArgs);
  const easedT = easingFn(t);

  const prevValue = prev.value as [number, number, number];
  const nextValue = next.value as [number, number, number];

  const prevVec = new THREE.Vector3(prevValue[0], prevValue[1], prevValue[2]);
  const nextVec = new THREE.Vector3(nextValue[0], nextValue[1], nextValue[2]);

  return lerpVec3(prevVec, nextVec, easedT, target);
}
