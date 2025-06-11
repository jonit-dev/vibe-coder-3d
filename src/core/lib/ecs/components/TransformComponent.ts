import { KnownComponentTypes, IComponent } from '../IComponent';
import { EntityId } from '../types';
import {
  validatePosition,
  validateRotation,
  validateScale,
  isValidPosition,
  isValidRotation,
  isValidScale,
} from '../../validation';

export interface ITransformData {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles
  scale: [number, number, number];
}

interface IBitECSTransformData {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

export class TransformComponent implements IComponent<ITransformData> {
  public static readonly componentType = KnownComponentTypes.TRANSFORM;

  constructor(
    public entityId: EntityId,
    public type: KnownComponentTypes,
    public data: ITransformData,
  ) {}

  static create(entityId: EntityId, data: ITransformData): TransformComponent {
    this.validate(data);
    return new TransformComponent(entityId, this.componentType, data);
  }

  static validate(data: ITransformData): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Transform data must be an object');
    }

    if (!isValidPosition(data.position)) {
      throw new Error('Invalid position array - must be [x, y, z] with numbers');
    }

    if (!isValidRotation(data.rotation)) {
      throw new Error('Invalid rotation array - must be [x, y, z] with numbers');
    }

    if (!isValidScale(data.scale)) {
      throw new Error('Invalid scale array - must be [x, y, z] with positive numbers');
    }

    // Validate using existing validation functions
    try {
      validatePosition(data.position);
      validateRotation(data.rotation);
      validateScale(data.scale);
    } catch (error) {
      throw new Error(`Transform validation failed: ${error.message}`);
    }
  }

  static fromBitECS(bitECSData: IBitECSTransformData): ITransformData {
    return {
      position: [bitECSData.x ?? 0, bitECSData.y ?? 0, bitECSData.z ?? 0],
      rotation: [bitECSData.rx ?? 0, bitECSData.ry ?? 0, bitECSData.rz ?? 0],
      scale: [bitECSData.sx ?? 1, bitECSData.sy ?? 1, bitECSData.sz ?? 1],
    };
  }

  static toBitECS(data: ITransformData): IBitECSTransformData {
    return {
      x: data.position[0],
      y: data.position[1],
      z: data.position[2],
      rx: data.rotation[0],
      ry: data.rotation[1],
      rz: data.rotation[2],
      sx: data.scale[0],
      sy: data.scale[1],
      sz: data.scale[2],
    };
  }

  get componentType(): KnownComponentTypes {
    return TransformComponent.componentType;
  }
}
