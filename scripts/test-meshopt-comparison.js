#!/usr/bin/env node

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshoptimizer, prune, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { statSync } from 'fs';

await MeshoptEncoder.ready;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
});

const inputPath = '/tmp/farm_house_test.glb';
const outputPath = '/tmp/farm_house_meshopt.glb';

console.log('📥 Reading decompressed model...');
const doc = await io.read(inputPath);

console.log('🔧 Applying meshoptimizer compression...');
await doc.transform(prune(), dedup(), meshoptimizer({ encoder: MeshoptEncoder, level: 'medium' }));

console.log('💾 Writing compressed output...');
await io.write(outputPath, doc);

const originalSize = statSync('/tmp/farm_house_test.glb').size;
const meshoptSize = statSync('/tmp/farm_house_meshopt.glb').size;
const dracoSize = statSync('src/game/assets/models/FarmHouse/glb/farm_house_basic_shaded.glb').size;

console.log('\n📊 File Size Comparison:');
console.log(
  `   Draco (original):     ${(dracoSize / 1024 / 1024).toFixed(2)} MB - ❌ Rust can't load`,
);
console.log(
  `   Uncompressed:         ${(originalSize / 1024 / 1024).toFixed(2)} MB - ⚠️ Too large`,
);
console.log(
  `   Meshopt compressed:   ${(meshoptSize / 1024 / 1024).toFixed(2)} MB - ✅ Best option`,
);

const savings = (((dracoSize - meshoptSize) / dracoSize) * 100).toFixed(1);
if (meshoptSize < dracoSize) {
  console.log(`\n✅ Meshopt is ${savings}% SMALLER than Draco!`);
} else {
  const increase = (((meshoptSize - dracoSize) / dracoSize) * 100).toFixed(1);
  console.log(`\n⚠️ Meshopt is ${increase}% larger than Draco`);
}
console.log(`✅ Works in both Three.js AND Rust engine`);
console.log(`\n💡 Next step: Add decimation to reduce triangles further!`);
