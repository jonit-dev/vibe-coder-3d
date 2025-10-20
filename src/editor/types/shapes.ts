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

  // Structural
  Wall = 'Wall',

  // Environment
  Terrain = 'Terrain',

  // Special
  Camera = 'Camera',
  CustomModel = 'CustomModel',

  // Note: Custom shapes (Helix, Star, Tree, Ramp, etc.) are now registered
  // dynamically via the shape registry system. See src/game/shapes/
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
