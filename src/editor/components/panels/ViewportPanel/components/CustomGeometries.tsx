import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Creates a helix geometry
 * A spiral curve in 3D space
 */
export const HelixGeometry: React.FC<{
  radius?: number;
  height?: number;
  turns?: number;
  segments?: number;
  tubeRadius?: number;
}> = ({ radius = 0.3, height = 2, turns = 3, segments = 100, tubeRadius = 0.05 }) => {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([]);
    const points: THREE.Vector3[] = [];

    // Generate helix points
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * 2 * Math.PI;
      const y = (t - 0.5) * height;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }

    curve.points = points;

    const geom = new THREE.TubeGeometry(curve, segments, tubeRadius, 8, false);
    return geom;
  }, [radius, height, turns, segments, tubeRadius]);

  return <primitive object={geometry} />;
};

/**
 * Creates a Möbius strip geometry
 * A surface with only one side and one boundary
 */
export const MobiusStripGeometry: React.FC<{
  radius?: number;
  width?: number;
  segments?: number;
}> = ({ radius = 0.5, width = 0.3, segments = 64 }) => {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Generate vertices
    for (let i = 0; i <= segments; i++) {
      const u = (i / segments) * 2 * Math.PI;

      for (let j = 0; j <= 8; j++) {
        const v = (j / 8 - 0.5) * width;

        // Möbius strip parametric equations
        const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
        const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
        const z = v * Math.sin(u / 2);

        vertices.push(x, y, z);
        uvs.push(i / segments, j / 8);
      }
    }

    // Generate faces
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < 8; j++) {
        const a = i * 9 + j;
        const b = (i + 1) * 9 + j;
        const c = (i + 1) * 9 + j + 1;
        const d = i * 9 + j + 1;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    return geom;
  }, [radius, width, segments]);

  return <primitive object={geometry} />;
};

/**
 * Creates a torus knot geometry with customizable parameters
 * More complex than Three.js default with additional customization
 */
export const TorusKnotGeometry: React.FC<{
  radius?: number;
  tube?: number;
  tubularSegments?: number;
  radialSegments?: number;
  p?: number;
  q?: number;
}> = ({ radius = 0.4, tube = 0.1, tubularSegments = 64, radialSegments = 8, p = 2, q = 3 }) => {
  const geometry = useMemo(() => {
    return new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
  }, [radius, tube, tubularSegments, radialSegments, p, q]);

  return <primitive object={geometry} />;
};

/**
 * Creates a ramp/wedge geometry
 * A simple triangular prism that slopes upward
 */
export const RampGeometry: React.FC<{
  width?: number;
  height?: number;
  depth?: number;
}> = ({ width = 1, height = 1, depth = 1 }) => {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();

    const w_half = width / 2;
    const d_half = depth / 2;

    const vertices = new Float32Array([
      -w_half,
      0,
      d_half, // 0: bottom-front-left
      w_half,
      0,
      d_half, // 1: bottom-front-right
      -w_half,
      0,
      -d_half, // 2: bottom-back-left
      w_half,
      0,
      -d_half, // 3: bottom-back-right
      -w_half,
      height,
      -d_half, // 4: top-back-left
      w_half,
      height,
      -d_half, // 5: top-back-right
    ]);

    const indices = new Uint16Array([
      0,
      2,
      1,
      1,
      2,
      3, // bottom
      2,
      4,
      3,
      3,
      4,
      5, // back
      0,
      1,
      5,
      0,
      5,
      4, // slope
      0,
      4,
      2, // left side
      1,
      3,
      5, // right side
    ]);

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();

    return geom;
  }, [width, height, depth]);

  return <primitive object={geometry} />;
};

/**
 * Creates a stairs geometry
 * A series of rectangular steps
 */
export const StairsGeometry: React.FC<{
  steps?: number;
  stepWidth?: number;
  stepHeight?: number;
  stepDepth?: number;
  totalWidth?: number;
}> = ({ steps = 5, stepWidth = 0.3, stepHeight = 0.2, stepDepth = 0.2, totalWidth = 1 }) => {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Create each step as a box
    for (let i = 0; i < steps; i++) {
      const stepY = i * stepHeight;
      const stepZ = i * stepDepth - (steps * stepDepth) / 2;

      // 8 vertices per step (box)
      const baseIndex = i * 8;

      // Bottom face vertices
      vertices.push(
        -totalWidth / 2,
        stepY,
        stepZ, // 0: bottom-left-front
        totalWidth / 2,
        stepY,
        stepZ, // 1: bottom-right-front
        totalWidth / 2,
        stepY,
        stepZ + stepWidth, // 2: bottom-right-back
        -totalWidth / 2,
        stepY,
        stepZ + stepWidth, // 3: bottom-left-back
      );

      // Top face vertices
      vertices.push(
        -totalWidth / 2,
        stepY + stepHeight,
        stepZ, // 4: top-left-front
        totalWidth / 2,
        stepY + stepHeight,
        stepZ, // 5: top-right-front
        totalWidth / 2,
        stepY + stepHeight,
        stepZ + stepWidth, // 6: top-right-back
        -totalWidth / 2,
        stepY + stepHeight,
        stepZ + stepWidth, // 7: top-left-back
      );

      // UVs for this step
      for (let j = 0; j < 8; j++) {
        uvs.push(0, 0); // Simple UV mapping
      }

      // Indices for this step (12 triangles for a box)
      const stepIndices = [
        // Bottom face (0,1,2,3)
        baseIndex + 0,
        baseIndex + 2,
        baseIndex + 1,
        baseIndex + 0,
        baseIndex + 3,
        baseIndex + 2,

        // Top face (4,5,6,7)
        baseIndex + 4,
        baseIndex + 5,
        baseIndex + 6,
        baseIndex + 4,
        baseIndex + 6,
        baseIndex + 7,

        // Front face (0,1,5,4)
        baseIndex + 0,
        baseIndex + 1,
        baseIndex + 5,
        baseIndex + 0,
        baseIndex + 5,
        baseIndex + 4,

        // Back face (3,7,6,2)
        baseIndex + 3,
        baseIndex + 7,
        baseIndex + 6,
        baseIndex + 3,
        baseIndex + 6,
        baseIndex + 2,

        // Left face (0,4,7,3)
        baseIndex + 0,
        baseIndex + 4,
        baseIndex + 7,
        baseIndex + 0,
        baseIndex + 7,
        baseIndex + 3,

        // Right face (1,2,6,5)
        baseIndex + 1,
        baseIndex + 2,
        baseIndex + 6,
        baseIndex + 1,
        baseIndex + 6,
        baseIndex + 5,
      ];

      indices.push(...stepIndices);
    }

    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    return geom;
  }, [steps, stepWidth, stepHeight, stepDepth, totalWidth]);

  return <primitive object={geometry} />;
};

/**
 * Creates a spiral stairs geometry
 * A curved staircase that spirals upward with connected steps
 */
export const SpiralStairsGeometry: React.FC<{
  steps?: number;
  radius?: number;
  height?: number;
  stepWidth?: number;
  stepHeight?: number;
  turns?: number;
}> = ({
  steps = 10,
  radius = 0.8,
  height = 2.0,
  stepWidth = 0.4,
  stepHeight = 0.2,
  turns = 1.0,
}) => {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const innerRadius = radius * 0.2;
    const outerRadius = radius;
    const angleStep = (turns * 2 * Math.PI) / steps;
    const heightStep = height / steps;

    let vertexOffset = 0;

    // --- Create Central Pole ---
    // This creates a complete, solid cylinder with correct normals and caps.
    const poleSegments = 8;
    const poleVertices: number[] = [];
    const poleIndices: number[] = [];
    const poleUvs: number[] = [];
    let poleVertexCount = 0;

    // Helper to add a vertex
    const addVertex = (x: number, y: number, z: number, u: number, v: number) => {
      poleVertices.push(x, y, z);
      poleUvs.push(u, v);
      return poleVertexCount++;
    };

    // --- Side Vertices ---
    const sideVertexStartIndex = poleVertexCount;
    for (let i = 0; i <= poleSegments; i++) {
      const angle = (i / poleSegments) * 2 * Math.PI;
      const x = Math.cos(angle) * innerRadius;
      const z = Math.sin(angle) * innerRadius;
      addVertex(x, 0, z, i / poleSegments, 0); // Bottom vertex
      addVertex(x, height, z, i / poleSegments, 1); // Top vertex
    }

    // --- Side Faces ---
    for (let i = 0; i < poleSegments; i++) {
      const bl = sideVertexStartIndex + i * 2;
      const tl = sideVertexStartIndex + i * 2 + 1;
      const br = sideVertexStartIndex + (i + 1) * 2;
      const tr = sideVertexStartIndex + (i + 1) * 2 + 1;
      poleIndices.push(bl, br, tl, br, tr, tl);
    }

    // --- Cap Vertices & Faces ---
    const createCap = (isTop: boolean) => {
      const y = isTop ? height : 0;
      const centerIdx = addVertex(0, y, 0, 0.5, 0.5);
      const ringStartIndex = poleVertexCount;

      for (let i = 0; i <= poleSegments; i++) {
        const angle = (i / poleSegments) * 2 * Math.PI;
        const x = Math.cos(angle) * innerRadius;
        const z = Math.sin(angle) * innerRadius;
        addVertex(x, y, z, 0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
      }

      for (let i = 0; i < poleSegments; i++) {
        const p1 = ringStartIndex + i;
        const p2 = ringStartIndex + i + 1;
        if (isTop) {
          poleIndices.push(centerIdx, p1, p2);
        } else {
          poleIndices.push(centerIdx, p2, p1); // Flip winding for bottom cap
        }
      }
    };

    createCap(false); // Bottom cap
    createCap(true); // Top cap

    // --- Add pole to the main geometry ---
    const baseVertexIndex = vertexOffset;
    vertices.push(...poleVertices);
    uvs.push(...poleUvs);
    poleIndices.forEach((i) => indices.push(i + baseVertexIndex));
    vertexOffset += poleVertexCount;

    // Create steps - simple rectangular treads
    for (let step = 0; step < steps; step++) {
      const stepAngle = step * angleStep;
      const stepY = step * heightStep;
      const nextStepY = stepY + stepHeight;

      // Step dimensions
      const stepDepth = outerRadius - innerRadius - 0.05;
      const stepAngleSpan = angleStep * 0.7; // Make steps narrower to leave gaps

      // Calculate step corners
      const angle1 = stepAngle - stepAngleSpan / 2;
      const angle2 = stepAngle + stepAngleSpan / 2;

      const innerX1 = Math.cos(angle1) * (innerRadius + 0.05);
      const innerZ1 = Math.sin(angle1) * (innerRadius + 0.05);
      const innerX2 = Math.cos(angle2) * (innerRadius + 0.05);
      const innerZ2 = Math.sin(angle2) * (innerRadius + 0.05);

      const outerX1 = Math.cos(angle1) * outerRadius;
      const outerZ1 = Math.sin(angle1) * outerRadius;
      const outerX2 = Math.cos(angle2) * outerRadius;
      const outerZ2 = Math.sin(angle2) * outerRadius;

      // Create step geometry (8 vertices for a rectangular step)
      const stepVertices = [
        // Bottom face
        innerX1,
        stepY,
        innerZ1, // 0
        innerX2,
        stepY,
        innerZ2, // 1
        outerX2,
        stepY,
        outerZ2, // 2
        outerX1,
        stepY,
        outerZ1, // 3
        // Top face
        innerX1,
        nextStepY,
        innerZ1, // 4
        innerX2,
        nextStepY,
        innerZ2, // 5
        outerX2,
        nextStepY,
        outerZ2, // 6
        outerX1,
        nextStepY,
        outerZ1, // 7
      ];

      vertices.push(...stepVertices);

      // UV coordinates
      for (let i = 0; i < 8; i++) {
        uvs.push(i % 2, Math.floor(i / 4));
      }

      const base = vertexOffset;

      // Step faces
      // Top face (tread)
      indices.push(base + 4, base + 5, base + 6, base + 4, base + 6, base + 7);

      // Bottom face
      indices.push(base, base + 3, base + 2, base, base + 2, base + 1);

      // Side faces
      // Inner edge
      indices.push(base, base + 1, base + 5, base, base + 5, base + 4);

      // Outer edge
      indices.push(base + 2, base + 3, base + 7, base + 2, base + 7, base + 6);

      // Front edge (riser)
      indices.push(base + 1, base + 2, base + 6, base + 1, base + 6, base + 5);

      // Back edge
      indices.push(base + 3, base, base + 4, base + 3, base + 4, base + 7);

      vertexOffset += 8;
    }

    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    return geom;
  }, [steps, radius, height, stepWidth, stepHeight, turns]);

  return <primitive object={geometry} />;
};

/**
 * Creates a star geometry
 * A 5-pointed star shape with customizable points and depth
 */
export const StarGeometry: React.FC<{
  outerRadius?: number;
  innerRadius?: number;
  points?: number;
  depth?: number;
}> = ({ outerRadius = 0.5, innerRadius = 0.3, points = 5, depth = 0.2 }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();

    // Create star shape with better proportions
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2; // Start from top
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const extrudeSettings = {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 4,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center(); // Center the geometry
    return geom;
  }, [outerRadius, innerRadius, points, depth]);

  return <primitive object={geometry} />;
};

/**
 * Creates a heart geometry
 * A heart shape using parametric equations
 */
export const HeartGeometry: React.FC<{
  size?: number;
  depth?: number;
}> = ({ size = 0.3, depth = 0.15 }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();

    // Heart shape parametric equations - improved with better scaling
    const segments = 100;
    let firstPoint = true;

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      // Improved heart equation for better proportions
      const x = (size * 16 * Math.pow(Math.sin(t), 3)) / 16;
      const y =
        (size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))) /
        16;

      if (firstPoint) {
        shape.moveTo(x, y); // Keep Y normal to have heart point up
        firstPoint = false;
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const extrudeSettings = {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 3,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center(); // Center the geometry
    return geom;
  }, [size, depth]);

  return <primitive object={geometry} />;
};

/**
 * Creates a diamond/gem geometry
 * A faceted diamond shape
 */
export const DiamondGeometry: React.FC<{
  radius?: number;
  height?: number;
  facets?: number;
}> = ({ radius = 0.4, height = 0.8, facets = 8 }) => {
  const geometry = useMemo(() => {
    // Use a simpler approach - create a diamond with beveled edges using ExtrudeGeometry
    const shape = new THREE.Shape();

    // Create diamond outline (square rotated 45 degrees)
    const size = radius;
    shape.moveTo(0, size);
    shape.lineTo(size * 0.7, 0);
    shape.lineTo(0, -size);
    shape.lineTo(-size * 0.7, 0);
    shape.closePath();

    const extrudeSettings = {
      depth: height * 0.3,
      bevelEnabled: true,
      bevelThickness: height * 0.2,
      bevelSize: radius * 0.2,
      bevelOffset: 0,
      bevelSegments: 8,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center(); // Center the geometry

    return geom;
  }, [radius, height, facets]);

  return <primitive object={geometry} />;
};

/**
 * Creates a tube/pipe geometry
 * A hollow cylindrical tube
 */
export const TubeGeometry: React.FC<{
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  segments?: number;
}> = ({ innerRadius = 0.25, outerRadius = 0.4, height = 1, segments = 32 }) => {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const halfHeight = height / 2;

    // Create vertices for all rings: bottom outer, bottom inner, top outer, top inner
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Bottom outer
      vertices.push(cos * outerRadius, -halfHeight, sin * outerRadius);
      uvs.push(i / segments, 0);

      // Bottom inner
      vertices.push(cos * innerRadius, -halfHeight, sin * innerRadius);
      uvs.push(i / segments, 0.25);

      // Top outer
      vertices.push(cos * outerRadius, halfHeight, sin * outerRadius);
      uvs.push(i / segments, 0.5);

      // Top inner
      vertices.push(cos * innerRadius, halfHeight, sin * innerRadius);
      uvs.push(i / segments, 0.75);
    }

    // Create faces
    for (let i = 0; i < segments; i++) {
      const i0 = i * 4;
      const i1 = ((i + 1) % (segments + 1)) * 4;

      // Outer wall
      indices.push(i0, i0 + 2, i1); // bottom-outer to top-outer to next-bottom-outer
      indices.push(i1, i0 + 2, i1 + 2); // triangle completion

      // Inner wall (reversed winding for inward-facing normals)
      indices.push(i0 + 1, i1 + 1, i0 + 3); // bottom-inner to next-bottom-inner to top-inner
      indices.push(i1 + 1, i1 + 3, i0 + 3); // triangle completion

      // Bottom ring (outer to inner)
      indices.push(i0, i1, i0 + 1); // outer to next-outer to inner
      indices.push(i1, i1 + 1, i0 + 1); // triangle completion

      // Top ring (inner to outer)
      indices.push(i0 + 2, i0 + 3, i1 + 2); // top-outer to top-inner to next-top-outer
      indices.push(i0 + 3, i1 + 3, i1 + 2); // triangle completion
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, [innerRadius, outerRadius, height, segments]);

  return <primitive object={geometry} />;
};

/**
 * Creates a cross/plus geometry
 * A 3D cross or plus sign shape
 */
export const CrossGeometry: React.FC<{
  armLength?: number;
  armWidth?: number;
  thickness?: number;
}> = ({ armLength = 0.8, armWidth = 0.2, thickness = 0.15 }) => {
  const geometry = useMemo(() => {
    // Create a cross by combining two boxes
    const verticalGeom = new THREE.BoxGeometry(armWidth, armLength, thickness);
    const horizontalGeom = new THREE.BoxGeometry(armLength, armWidth, thickness);

    // Merge the geometries
    const mergedGeom = new THREE.BufferGeometry();

    // Get vertex data from both geometries
    const verticalPositions = verticalGeom.attributes.position.array;
    const horizontalPositions = horizontalGeom.attributes.position.array;

    const verticalIndices = verticalGeom.index?.array || [];
    const horizontalIndices = horizontalGeom.index?.array || [];

    // Combine vertex positions
    const totalVertices = verticalPositions.length + horizontalPositions.length;
    const combinedPositions = new Float32Array(totalVertices);
    combinedPositions.set(verticalPositions, 0);
    combinedPositions.set(horizontalPositions, verticalPositions.length);

    // Combine indices with offset for horizontal geometry
    const vertexCount = verticalPositions.length / 3;
    const totalIndices = verticalIndices.length + horizontalIndices.length;
    const combinedIndices = new Uint16Array(totalIndices);
    combinedIndices.set(verticalIndices, 0);

    // Add horizontal indices with offset
    for (let i = 0; i < horizontalIndices.length; i++) {
      combinedIndices[verticalIndices.length + i] = horizontalIndices[i] + vertexCount;
    }

    mergedGeom.setAttribute('position', new THREE.BufferAttribute(combinedPositions, 3));
    mergedGeom.setIndex(new THREE.BufferAttribute(combinedIndices, 1));
    mergedGeom.computeVertexNormals();

    return mergedGeom;
  }, [armLength, armWidth, thickness]);

  return <primitive object={geometry} />;
};

/**
 * Creates a tree geometry
 * A detailed tree with trunk, branches, and layered canopy
 */
export const TreeGeometry: React.FC<{
  trunkHeight?: number;
  trunkRadius?: number;
  canopyRadius?: number;
  canopyHeight?: number;
  seed?: number;
}> = ({
  trunkHeight = 1.5,
  trunkRadius = 0.1,
  canopyRadius = 0.8,
  canopyHeight = 1.2,
  seed = Math.random(),
}) => {
  const treeGroup = useMemo(() => {
    const group = new THREE.Group();

    // Use seed for consistent randomness
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Create trunk with slight taper
    const trunkTopRadius = trunkRadius * 0.7;
    const trunkGeometry = new THREE.CylinderGeometry(trunkTopRadius, trunkRadius, trunkHeight, 8);

    // Add bark texture by modifying vertices
    const positions = trunkGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];

      // Add bark-like bumps
      const noise = (seededRandom(seed + i) - 0.5) * trunkRadius * 0.1;
      const distance = Math.sqrt(x * x + z * z);
      if (distance > 0) {
        positions[i] = x + (x / distance) * noise;
        positions[i + 2] = z + (z / distance) * noise;
      }
    }
    trunkGeometry.attributes.position.needsUpdate = true;
    trunkGeometry.computeVertexNormals();

    const trunkMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(
        0.08 + (seededRandom(seed) - 0.5) * 0.02, // Brown with slight variation
        0.6 + seededRandom(seed + 100) * 0.2,
        0.2 + seededRandom(seed + 200) * 0.1,
      ),
    });
    const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunkMesh.position.y = trunkHeight / 2;
    group.add(trunkMesh);

    // Create multiple canopy layers for fuller look
    const numCanopyLayers = 2 + Math.floor(seededRandom(seed + 300) * 2); // 2-3 layers

    for (let i = 0; i < numCanopyLayers; i++) {
      const layerRadius = canopyRadius * (0.7 + seededRandom(seed + 400 + i) * 0.4);
      const layerHeight = trunkHeight + canopyRadius * (0.2 + i * 0.3);

      // Create irregular canopy shape
      const canopyGeometry = new THREE.SphereGeometry(layerRadius, 12, 8);
      const canopyPositions = canopyGeometry.attributes.position.array as Float32Array;

      for (let j = 0; j < canopyPositions.length; j += 3) {
        const vertex = new THREE.Vector3(
          canopyPositions[j],
          canopyPositions[j + 1],
          canopyPositions[j + 2],
        );
        const length = vertex.length();

        // Add organic irregularity
        const noise = (seededRandom(seed + 500 + i + j) - 0.5) * layerRadius * 0.3;
        const newLength = Math.max(length + noise, layerRadius * 0.5);
        vertex.normalize().multiplyScalar(newLength);

        // Slightly flatten bottom of canopy
        if (vertex.y < -layerRadius * 0.3) {
          vertex.y *= 0.8;
        }

        canopyPositions[j] = vertex.x;
        canopyPositions[j + 1] = vertex.y;
        canopyPositions[j + 2] = vertex.z;
      }

      canopyGeometry.attributes.position.needsUpdate = true;
      canopyGeometry.computeVertexNormals();

      // Vary canopy color for each layer
      const canopyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(
          0.25 + (seededRandom(seed + 600 + i) - 0.5) * 0.05, // Green with variation
          0.6 + seededRandom(seed + 700 + i) * 0.3,
          0.3 + seededRandom(seed + 800 + i) * 0.2,
        ),
      });

      const canopyMesh = new THREE.Mesh(canopyGeometry, canopyMaterial);

      // Position and slightly offset each layer
      const offsetX = (seededRandom(seed + 900 + i) - 0.5) * trunkRadius * 2;
      const offsetZ = (seededRandom(seed + 1000 + i) - 0.5) * trunkRadius * 2;

      canopyMesh.position.set(offsetX, layerHeight, offsetZ);
      group.add(canopyMesh);
    }

    // Add a few small branches sticking out
    const numBranches = 2 + Math.floor(seededRandom(seed + 1100) * 3);

    for (let i = 0; i < numBranches; i++) {
      const branchLength = trunkHeight * (0.2 + seededRandom(seed + 1200 + i) * 0.2);
      const branchRadius = trunkRadius * 0.3;

      const branchGeometry = new THREE.CylinderGeometry(
        branchRadius * 0.5,
        branchRadius,
        branchLength,
        6,
      );
      const branchMaterial = new THREE.MeshLambertMaterial({
        color: trunkMaterial.color.clone().multiplyScalar(0.9),
      });
      const branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);

      // Position branch at random height and angle
      const branchHeight = trunkHeight * (0.6 + seededRandom(seed + 1300 + i) * 0.3);
      const branchAngle = seededRandom(seed + 1400 + i) * Math.PI * 2;
      const branchTilt = Math.PI * 0.25 + seededRandom(seed + 1500 + i) * Math.PI * 0.25;

      branchMesh.position.y = branchHeight;
      branchMesh.position.x = Math.cos(branchAngle) * trunkRadius;
      branchMesh.position.z = Math.sin(branchAngle) * trunkRadius;

      branchMesh.rotation.z = branchTilt;
      branchMesh.rotation.y = branchAngle;

      group.add(branchMesh);
    }

    return group;
  }, [trunkHeight, trunkRadius, canopyRadius, canopyHeight, seed]);

  return <primitive object={treeGroup} />;
};

/**
 * Creates a rock geometry
 * An irregular rock-like shape with multiple variations
 */
export const RockGeometry: React.FC<{
  size?: number;
  detail?: number;
  randomness?: number;
  seed?: number;
}> = ({ size = 0.5, detail = 12, randomness = 0.4, seed = Math.random() }) => {
  const geometry = useMemo(() => {
    // Use seed for consistent randomness
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Start with different base shapes for variety
    const shapeType = Math.floor(seededRandom(seed) * 3);
    let baseGeom: THREE.BufferGeometry;

    switch (shapeType) {
      case 0:
        baseGeom = new THREE.IcosahedronGeometry(size, 1);
        break;
      case 1:
        baseGeom = new THREE.DodecahedronGeometry(size, 0);
        break;
      default:
        baseGeom = new THREE.OctahedronGeometry(size, 1);
        break;
    }

    const positions = baseGeom.attributes.position.array as Float32Array;

    // Add complex noise for more realistic rock shape
    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const length = vertex.length();

      // Multi-octave noise for natural variation
      const noise1 = (seededRandom(seed + i) - 0.5) * randomness * size;
      const noise2 = (seededRandom(seed + i + 1000) - 0.5) * randomness * size * 0.5;
      const noise3 = (seededRandom(seed + i + 2000) - 0.5) * randomness * size * 0.25;
      const totalNoise = noise1 + noise2 + noise3;

      vertex.normalize().multiplyScalar(Math.max(length + totalNoise, size * 0.3));

      // Create more dramatic flattening for bottom
      if (vertex.y < -size * 0.2) {
        vertex.y *= 0.5;
        // Add some width variation to make it look settled
        const flattenFactor = 1 + (seededRandom(seed + i + 3000) - 0.5) * 0.3;
        vertex.x *= flattenFactor;
        vertex.z *= flattenFactor;
      }

      positions[i] = vertex.x;
      positions[i + 1] = vertex.y;
      positions[i + 2] = vertex.z;
    }

    baseGeom.attributes.position.needsUpdate = true;
    baseGeom.computeVertexNormals();

    return baseGeom;
  }, [size, detail, randomness, seed]);

  return <primitive object={geometry} />;
};

/**
 * Creates a bush geometry
 * A realistic multi-layered shrub
 */
export const BushGeometry: React.FC<{
  size?: number;
  density?: number;
  seed?: number;
}> = ({ size = 0.4, density = 3, seed = Math.random() }) => {
  const bushGroup = useMemo(() => {
    const group = new THREE.Group();

    // Use seed for consistent randomness
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Create multiple overlapping spheres for a fuller bush look
    const numClusters = Math.max(2, Math.floor(density));

    for (let i = 0; i < numClusters; i++) {
      const clusterSize = size * (0.6 + seededRandom(seed + i) * 0.4);
      const segments = Math.max(6, Math.floor(clusterSize * 20));

      // Create base sphere geometry
      const sphereGeom = new THREE.SphereGeometry(clusterSize, segments, segments);
      const positions = sphereGeom.attributes.position.array as Float32Array;

      // Add organic irregularity to each cluster
      for (let j = 0; j < positions.length; j += 3) {
        const vertex = new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]);
        const length = vertex.length();

        // Flatten vertically for bush-like shape
        vertex.y *= 0.7;

        // Add multiple layers of noise for organic look
        const noise1 = (seededRandom(seed + i + j) - 0.5) * clusterSize * 0.3;
        const noise2 = (seededRandom(seed + i + j + 1000) - 0.5) * clusterSize * 0.15;
        const totalNoise = noise1 + noise2;

        const newLength = Math.max(length + totalNoise, clusterSize * 0.3);
        vertex.normalize().multiplyScalar(newLength);

        // Create some drooping at the bottom
        if (vertex.y < -clusterSize * 0.3) {
          vertex.y *= 0.8;
        }

        positions[j] = vertex.x;
        positions[j + 1] = vertex.y;
        positions[j + 2] = vertex.z;
      }

      sphereGeom.attributes.position.needsUpdate = true;
      sphereGeom.computeVertexNormals();

      // Create mesh for this cluster
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(
          0.25 + (seededRandom(seed + i + 500) - 0.5) * 0.1, // Green with slight variation
          0.6 + seededRandom(seed + i + 600) * 0.3, // Saturation variation
          0.3 + seededRandom(seed + i + 700) * 0.2, // Lightness variation
        ),
      });

      const clusterMesh = new THREE.Mesh(sphereGeom, material);

      // Position clusters to create fuller bush
      const angle = (i / numClusters) * Math.PI * 2 + seededRandom(seed + i + 800) * Math.PI;
      const distance = seededRandom(seed + i + 900) * size * 0.3;
      const heightOffset = (seededRandom(seed + i + 1000) - 0.5) * size * 0.2;

      clusterMesh.position.x = Math.cos(angle) * distance;
      clusterMesh.position.z = Math.sin(angle) * distance;
      clusterMesh.position.y = heightOffset;

      group.add(clusterMesh);
    }

    return group;
  }, [size, density, seed]);

  return <primitive object={bushGroup} />;
};

/**
 * Creates grass geometry
 * A detailed patch of grass with varied blade shapes
 */
export const GrassGeometry: React.FC<{
  patchSize?: number;
  density?: number;
  maxHeight?: number;
  seed?: number;
}> = ({ patchSize = 0.5, density = 20, maxHeight = 0.6, seed = Math.random() }) => {
  const grassGroup = useMemo(() => {
    const group = new THREE.Group();

    // Use seed for consistent randomness
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const numBlades = Math.floor(density);

    for (let i = 0; i < numBlades; i++) {
      // Create individual grass blade geometry
      const bladeGeom = new THREE.BufferGeometry();

      // Blade parameters
      const bladeHeight = maxHeight * (0.4 + seededRandom(seed + i) * 0.6);
      const bladeWidth = patchSize * 0.02 * (0.5 + seededRandom(seed + i + 1000) * 0.5);
      const segments = 3; // Number of segments for blade curve

      const vertices: number[] = [];
      const indices: number[] = [];
      const uvs: number[] = [];

      // Create curved blade with multiple segments
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const y = t * bladeHeight;

        // Create natural curve/bend
        const bendAmount = seededRandom(seed + i + 2000) * 0.3 - 0.15;
        const curve = Math.sin(t * Math.PI * 0.5) * bendAmount * bladeHeight;

        // Blade gets narrower toward tip
        const widthFactor = 1 - t * 0.7;
        const currentWidth = bladeWidth * widthFactor;

        // Left and right vertices for this segment
        vertices.push(-currentWidth + curve, y, 0);
        vertices.push(currentWidth + curve, y, 0);

        // UVs
        uvs.push(0, t, 1, t);

        // Create triangles (except for last segment)
        if (j < segments) {
          const base = j * 2;
          indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        }
      }

      bladeGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      bladeGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      bladeGeom.setIndex(indices);
      bladeGeom.computeVertexNormals();

      // Create blade mesh with varied green color
      const hue = 0.25 + (seededRandom(seed + i + 3000) - 0.5) * 0.1; // Green with variation
      const saturation = 0.7 + seededRandom(seed + i + 4000) * 0.2;
      const lightness = 0.3 + seededRandom(seed + i + 5000) * 0.3;

      const bladeMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(hue, saturation, lightness),
        side: THREE.DoubleSide, // Visible from both sides
      });

      const bladeMesh = new THREE.Mesh(bladeGeom, bladeMaterial);

      // Position blade randomly within patch
      const angle = seededRandom(seed + i + 6000) * Math.PI * 2;
      const distance = seededRandom(seed + i + 7000) * patchSize * 0.4;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      bladeMesh.position.set(x, 0, z);

      // Random rotation around Y axis
      bladeMesh.rotation.y = seededRandom(seed + i + 8000) * Math.PI * 2;

      // Slight random tilt
      bladeMesh.rotation.z = (seededRandom(seed + i + 9000) - 0.5) * 0.2;

      group.add(bladeMesh);
    }

    return group;
  }, [patchSize, density, maxHeight, seed]);

  return <primitive object={grassGroup} />;
};
