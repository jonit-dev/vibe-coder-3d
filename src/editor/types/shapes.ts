export enum ShapeType {
  // Basic Shapes
  Cube = 'Cube',
  Sphere = 'Sphere',
  Cylinder = 'Cylinder',
  Cone = 'Cone',
  Plane = 'Plane',

  // Geometric Shapes
  Torus = 'Torus',
  Trapezoid = 'Trapezoid',
  Prism = 'Prism',
  Pyramid = 'Pyramid',
  Capsule = 'Capsule',

  // Polyhedra
  Octahedron = 'Octahedron',
  Dodecahedron = 'Dodecahedron',
  Icosahedron = 'Icosahedron',
  Tetrahedron = 'Tetrahedron',

  // Mathematical Shapes
  TorusKnot = 'TorusKnot',
  Helix = 'Helix',
  MobiusStrip = 'MobiusStrip',

  // Structural
  Wall = 'Wall',
  Ramp = 'Ramp',
  Stairs = 'Stairs',
  SpiralStairs = 'SpiralStairs',

  // Decorative
  Star = 'Star',
  Heart = 'Heart',
  Diamond = 'Diamond',
  Cross = 'Cross',
  Tube = 'Tube',

  // Environment
  Terrain = 'Terrain',
  Tree = 'Tree',
  Rock = 'Rock',
  Bush = 'Bush',
  Grass = 'Grass',

  // Special
  Camera = 'Camera',
  CustomModel = 'CustomModel',
}

// For backward compatibility, also export as type
export type ShapeTypeValue = `${ShapeType}`;

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
