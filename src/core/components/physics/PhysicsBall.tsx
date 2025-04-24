import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface IPhysicsBallProps {
  position: [number, number, number];
  velocity?: [number, number, number];
  radius?: number;
  mass?: number;
  restitution?: number;
  friction?: number;
  linearDamping?: number;
  angularDamping?: number;
  color?: string;
  id?: number | string;
}

export interface IPhysicsBallRef {
  rigidBody: RapierRigidBody | null;
  id: number | string;
}

export const PhysicsBall = forwardRef<IPhysicsBallRef, IPhysicsBallProps>(
  (
    {
      position,
      velocity = [0, 0, 0],
      radius = 0.3,
      mass = 10,
      restitution = 0.4,
      friction = 0.5,
      linearDamping = 0.2,
      angularDamping = 0.5,
      color = '#fe4a49',
      id = Date.now(),
    },
    ref,
  ) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);

    useImperativeHandle(ref, () => ({
      rigidBody: rigidBodyRef.current,
      id,
    }));

    return (
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        linearVelocity={velocity}
        colliders="ball"
        restitution={restitution}
        friction={friction}
        linearDamping={linearDamping}
        angularDamping={angularDamping}
        mass={mass}
      >
        <mesh castShadow>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </RigidBody>
    );
  },
);

PhysicsBall.displayName = 'PhysicsBall';
