// PhysicsJoint.tsx - A component for creating physics joints between bodies
import {
  RapierRigidBody,
  useFixedJoint,
  useRevoluteJoint,
  useSphericalJoint,
} from '@react-three/rapier';
import { RefObject } from 'react';

// Type for the joint type
export type JointType = 'revolute' | 'fixed' | 'spherical';

// Props for the PhysicsJoint component
export interface PhysicsJointProps {
  bodyA: RefObject<RapierRigidBody>;
  bodyB: RefObject<RapierRigidBody>;
  type: JointType;
  anchor?: {
    // Anchor point in local space of bodyA and bodyB
    pointA: [number, number, number];
    pointB: [number, number, number];
  };
  // Axis of rotation for revolute joints
  axis?: [number, number, number];
}

/**
 * PhysicsJoint - A component for creating physics joints between bodies
 *
 * This is a purely functional component that creates a joint between two rigid bodies.
 * It doesn't render anything itself but sets up the constraint in the physics world.
 */
export const PhysicsJoint = ({
  bodyA,
  bodyB,
  type,
  anchor = {
    pointA: [0, 0, 0],
    pointB: [0, 0, 0],
  },
  axis = [0, 1, 0],
}: PhysicsJointProps) => {
  // Use the appropriate joint hook based on the joint type
  switch (type) {
    case 'revolute':
      useRevoluteJoint(bodyA, bodyB, [anchor.pointA, anchor.pointB, axis]);
      break;

    case 'fixed':
      useFixedJoint(bodyA, bodyB, [
        anchor.pointA,
        [0, 0, 0, 1], // Default quaternion identity rotation
        anchor.pointB,
        [0, 0, 0, 1], // Default quaternion identity rotation
      ]);
      break;

    case 'spherical':
      useSphericalJoint(bodyA, bodyB, [anchor.pointA, anchor.pointB]);
      break;
  }

  // This component doesn't render anything
  return null;
};
