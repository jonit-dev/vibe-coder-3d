#!/usr/bin/env node

/**
 * Quality Metrics - KISS version
 * Just counts triangles and vertices
 */

export function getTriangleCount(document) {
  let count = 0;
  document.getRoot().listMeshes().forEach((mesh) => {
    mesh.listPrimitives().forEach((primitive) => {
      const indices = primitive.getIndices();
      if (indices) count += indices.getCount() / 3;
    });
  });
  return Math.floor(count);
}

export function getVertexCount(document) {
  let count = 0;
  document.getRoot().listMeshes().forEach((mesh) => {
    mesh.listPrimitives().forEach((primitive) => {
      const position = primitive.getAttribute('POSITION');
      if (position) count += position.getCount();
    });
  });
  return count;
}
