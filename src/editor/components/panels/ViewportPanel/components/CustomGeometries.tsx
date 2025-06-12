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

    // Create central pole - complete cylinder with caps
    const poleSegments = 8;

    // Center vertices for caps
    vertices.push(0, 0, 0); // Bottom center
    vertices.push(0, height, 0); // Top center
    uvs.push(0.5, 0.5);
    uvs.push(0.5, 0.5);

    const bottomCenterIndex = vertexOffset;
    const topCenterIndex = vertexOffset + 1;
    vertexOffset += 2;

    // Create circle vertices for both top and bottom
    const bottomVertices: number[] = [];
    const topVertices: number[] = [];

    for (let i = 0; i < poleSegments; i++) {
      const angle = (i / poleSegments) * 2 * Math.PI;
      const x = Math.cos(angle) * innerRadius;
      const z = Math.sin(angle) * innerRadius;

      // Bottom circle
      vertices.push(x, 0, z);
      uvs.push(0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle));
      bottomVertices.push(vertexOffset);
      vertexOffset++;

      // Top circle
      vertices.push(x, height, z);
      uvs.push(0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle));
      topVertices.push(vertexOffset);
      vertexOffset++;
    }

    // Create side faces
    for (let i = 0; i < poleSegments; i++) {
      const next = (i + 1) % poleSegments;

      const bottom1 = bottomVertices[i];
      const bottom2 = bottomVertices[next];
      const top1 = topVertices[i];
      const top2 = topVertices[next];

      // Side quad (two triangles)
      indices.push(bottom1, top1, bottom2);
      indices.push(bottom2, top1, top2);
    }

    // Create bottom cap
    for (let i = 0; i < poleSegments; i++) {
      const next = (i + 1) % poleSegments;
      indices.push(bottomCenterIndex, bottomVertices[next], bottomVertices[i]);
    }

    // Create top cap
    for (let i = 0; i < poleSegments; i++) {
      const next = (i + 1) % poleSegments;
      indices.push(topCenterIndex, topVertices[i], topVertices[next]);
    }

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
