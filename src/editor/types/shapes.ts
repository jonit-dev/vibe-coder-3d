export type ShapeType =
  | 'Cube'
  | 'Sphere'
  | 'Cylinder'
  | 'Cone'
  | 'Torus'
  | 'Plane'
  | 'Camera'
  | 'Trapezoid'
  | 'Octahedron'
  | 'Prism'
  | 'Pyramid'
  | 'Capsule';

export interface ITransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface ISceneObject {
  id: string;
  name: string;
  shape: ShapeType;
  components: {
    Transform: ITransform;
    Mesh: string;
    Material: string;
  };
}
