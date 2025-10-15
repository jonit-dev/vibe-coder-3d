#!/usr/bin/env node
/**
 * Creates a simple test GLTF cube without mesh quantization
 * for testing the Rust engine's GLTF loader
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '../rust/game/assets/models/test-cube.glb');

// Simple cube vertices
const positions = new Float32Array([
  // Front face
  -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  // Back face
  -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,
  // Top face
  -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
  // Bottom face
  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
  // Right face
  0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
  // Left face
  -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
]);

const normals = new Float32Array([
  // Front
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  // Back
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  // Top
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  // Bottom
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  // Right
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  // Left
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
]);

const indices = new Uint16Array([
  0,
  1,
  2,
  0,
  2,
  3, // Front
  4,
  5,
  6,
  4,
  6,
  7, // Back
  8,
  9,
  10,
  8,
  10,
  11, // Top
  12,
  13,
  14,
  12,
  14,
  15, // Bottom
  16,
  17,
  18,
  16,
  18,
  19, // Right
  20,
  21,
  22,
  20,
  22,
  23, // Left
]);

// Calculate buffer sizes
const positionsByteLength = positions.byteLength;
const normalsByteLength = normals.byteLength;
const indicesByteLength = indices.byteLength;

// Align to 4 bytes
function align(value) {
  return Math.ceil(value / 4) * 4;
}

const bufferSize = align(positionsByteLength) + align(normalsByteLength) + indicesByteLength;

// Create binary buffer
const buffer = new ArrayBuffer(bufferSize);
const view = new Uint8Array(buffer);

let offset = 0;

// Write positions
view.set(new Uint8Array(positions.buffer), offset);
const positionsOffset = offset;
offset += align(positionsByteLength);

// Write normals
view.set(new Uint8Array(normals.buffer), offset);
const normalsOffset = offset;
offset += align(normalsByteLength);

// Write indices
view.set(new Uint8Array(indices.buffer), offset);
const indicesOffset = offset;

// Create GLTF JSON
const gltf = {
  asset: {
    version: '2.0',
    generator: 'vibe-coder-3d test cube generator',
  },
  scene: 0,
  scenes: [
    {
      nodes: [0],
    },
  ],
  nodes: [
    {
      mesh: 0,
    },
  ],
  meshes: [
    {
      name: 'TestCube',
      primitives: [
        {
          attributes: {
            POSITION: 0,
            NORMAL: 1,
          },
          indices: 2,
        },
      ],
    },
  ],
  accessors: [
    // Positions
    {
      bufferView: 0,
      componentType: 5126, // FLOAT
      count: 24,
      type: 'VEC3',
      max: [0.5, 0.5, 0.5],
      min: [-0.5, -0.5, -0.5],
    },
    // Normals
    {
      bufferView: 1,
      componentType: 5126, // FLOAT
      count: 24,
      type: 'VEC3',
    },
    // Indices
    {
      bufferView: 2,
      componentType: 5123, // UNSIGNED_SHORT
      count: 36,
      type: 'SCALAR',
    },
  ],
  bufferViews: [
    // Positions
    {
      buffer: 0,
      byteOffset: positionsOffset,
      byteLength: positionsByteLength,
      target: 34962, // ARRAY_BUFFER
    },
    // Normals
    {
      buffer: 0,
      byteOffset: normalsOffset,
      byteLength: normalsByteLength,
      target: 34962, // ARRAY_BUFFER
    },
    // Indices
    {
      buffer: 0,
      byteOffset: indicesOffset,
      byteLength: indicesByteLength,
      target: 34963, // ELEMENT_ARRAY_BUFFER
    },
  ],
  buffers: [
    {
      byteLength: bufferSize,
    },
  ],
};

// Create GLB file
const jsonString = JSON.stringify(gltf);
const jsonBuffer = Buffer.from(jsonString);
const jsonByteLength = jsonBuffer.length;
const jsonPadded = align(jsonByteLength);
const jsonPadding = jsonPadded - jsonByteLength;

const binPadded = align(bufferSize);
const binPadding = binPadded - bufferSize;

const totalLength = 12 + 8 + jsonPadded + 8 + binPadded;

const glb = Buffer.alloc(totalLength);
let glbOffset = 0;

// Header
glb.writeUInt32LE(0x46546c67, glbOffset); // "glTF" magic
glbOffset += 4;
glb.writeUInt32LE(2, glbOffset); // version
glbOffset += 4;
glb.writeUInt32LE(totalLength, glbOffset); // length
glbOffset += 4;

// JSON chunk
glb.writeUInt32LE(jsonPadded, glbOffset); // chunk length
glbOffset += 4;
glb.writeUInt32LE(0x4e4f534a, glbOffset); // "JSON" type
glbOffset += 4;
jsonBuffer.copy(glb, glbOffset);
glbOffset += jsonByteLength;
// JSON padding (spaces)
for (let i = 0; i < jsonPadding; i++) {
  glb.writeUInt8(0x20, glbOffset++);
}

// BIN chunk
glb.writeUInt32LE(binPadded, glbOffset); // chunk length
glbOffset += 4;
glb.writeUInt32LE(0x004e4942, glbOffset); // "BIN\0" type
glbOffset += 4;
Buffer.from(view.buffer).copy(glb, glbOffset);
glbOffset += bufferSize;
// BIN padding (zeros)
for (let i = 0; i < binPadding; i++) {
  glb.writeUInt8(0, glbOffset++);
}

// Write file
writeFileSync(outputPath, glb);
console.log(`✅ Created test cube: ${outputPath} (${glb.length} bytes)`);
