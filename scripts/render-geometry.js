#!/usr/bin/env node

/**
 * Script to render a .shape.json geometry file to PNG
 * Usage: node scripts/render-geometry.js <path-to-shape.json> [output.png]
 */

import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function renderGeometry(geometryPath, outputPath) {
  // Read the geometry file
  const geometryData = readFileSync(geometryPath, 'utf-8');
  const geometry = JSON.parse(geometryData);

  console.log(`Rendering geometry: ${geometry.meta.name || basename(geometryPath)}`);
  console.log(`Tags: ${geometry.meta.tags?.join(', ') || 'none'}`);

  // Create HTML template with Three.js and rendering code
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.175.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.175.0/examples/jsm/"
      }
    }
  </script>
  <script type="module">
    import * as THREE from 'three';

    // Geometry data
    const geometryMeta = ${JSON.stringify(geometry)};

    // Create typed array from accessor
    function createTypedArray(accessor) {
      if (!accessor.array) {
        throw new Error('Accessor must have array data');
      }
      const { type, array } = accessor;
      switch (type) {
        case 'float32': return new Float32Array(array);
        case 'uint32': return new Uint32Array(array);
        case 'uint16': return new Uint16Array(array);
        case 'uint8': return new Uint8Array(array);
        case 'int32': return new Int32Array(array);
        case 'int16': return new Int16Array(array);
        case 'int8': return new Int8Array(array);
        default: throw new Error(\`Unsupported type: \${type}\`);
      }
    }

    // Parse geometry metadata to BufferGeometry
    function parseMetaToBufferGeometry(meta) {
      const geometry = new THREE.BufferGeometry();

      // Position (required)
      const positionArray = createTypedArray(meta.attributes.position);
      geometry.setAttribute('position',
        new THREE.BufferAttribute(positionArray, meta.attributes.position.itemSize, meta.attributes.position.normalized)
      );

      // Normal (optional)
      if (meta.attributes.normal) {
        const normalArray = createTypedArray(meta.attributes.normal);
        geometry.setAttribute('normal',
          new THREE.BufferAttribute(normalArray, meta.attributes.normal.itemSize, meta.attributes.normal.normalized)
        );
      }

      // UV (optional)
      if (meta.attributes.uv) {
        const uvArray = createTypedArray(meta.attributes.uv);
        geometry.setAttribute('uv',
          new THREE.BufferAttribute(uvArray, meta.attributes.uv.itemSize, meta.attributes.uv.normalized)
        );
      }

      // Color (optional)
      if (meta.attributes.color) {
        const colorArray = createTypedArray(meta.attributes.color);
        geometry.setAttribute('color',
          new THREE.BufferAttribute(colorArray, meta.attributes.color.itemSize, meta.attributes.color.normalized)
        );
      }

      // Index (optional)
      if (meta.index) {
        const indexArray = createTypedArray(meta.index);
        geometry.setIndex(new THREE.BufferAttribute(indexArray, meta.index.itemSize));
      }

      // Bounds
      if (meta.bounds) {
        if (meta.bounds.aabb) {
          const [min, max] = meta.bounds.aabb;
          geometry.boundingBox = new THREE.Box3(
            new THREE.Vector3(min[0], min[1], min[2]),
            new THREE.Vector3(max[0], max[1], max[2])
          );
        }
        if (meta.bounds.sphere) {
          const { center, radius } = meta.bounds.sphere;
          geometry.boundingSphere = new THREE.Sphere(
            new THREE.Vector3(center[0], center[1], center[2]),
            radius
          );
        }
      }

      return geometry;
    }

    // Setup scene
    const width = 1024;
    const height = 1024;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true // Important for screenshot
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Parse and create mesh
    const geom = parseMetaToBufferGeometry(geometryMeta);

    // Create material - use vertex colors if available
    const material = new THREE.MeshStandardMaterial({
      vertexColors: !!geometryMeta.attributes.color,
      color: geometryMeta.attributes.color ? 0xffffff : 0x888888,
      metalness: 0.2,
      roughness: 0.8,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 10, 7);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x6699ff, 0.3);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    const fillLight = new THREE.DirectionalLight(0xff9966, 0.2);
    fillLight.position.set(0, -5, 5);
    scene.add(fillLight);

    // Position camera based on bounding sphere
    if (geom.boundingSphere) {
      const sphere = geom.boundingSphere;
      const distance = sphere.radius * 2.5;
      camera.position.set(
        sphere.center.x + distance * 0.7,
        sphere.center.y + distance * 0.5,
        sphere.center.z + distance * 0.7
      );
      camera.lookAt(sphere.center);
    } else {
      geom.computeBoundingSphere();
      const sphere = geom.boundingSphere;
      const distance = sphere.radius * 2.5;
      camera.position.set(distance * 0.7, distance * 0.5, distance * 0.7);
      camera.lookAt(sphere.center);
    }

    // Add ground plane with shadow
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Render
    renderer.render(scene, camera);

    // Signal render complete
    window.renderComplete = true;
  </script>
</body>
</html>
  `;

  // Launch puppeteer and render
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1024 });

    // Set content and wait for render
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for render complete signal
    await page.waitForFunction('window.renderComplete === true', { timeout: 10000 });

    // Small delay to ensure render is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Take screenshot
    const canvas = await page.$('canvas');
    await canvas.screenshot({ path: outputPath, type: 'png' });

    console.log(`✓ Rendered to: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/render-geometry.js <geometry.shape.json> [output.png]');
  process.exit(1);
}

const geometryPath = resolve(args[0]);
const outputPath = args[1]
  ? resolve(args[1])
  : geometryPath.replace(/\.shape\.json$/, '.png');

try {
  await renderGeometry(geometryPath, outputPath);
} catch (error) {
  console.error('Error rendering geometry:', error.message);
  process.exit(1);
}
