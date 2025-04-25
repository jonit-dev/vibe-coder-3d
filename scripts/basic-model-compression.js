#!/usr/bin/env node

import { NodeIO } from '@gltf-transform/core';
import { center, draco, prune } from '@gltf-transform/functions';
import { execSync, spawn } from 'child_process';
import draco3d from 'draco3dgltf';
import fsExtra from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blender availability check
function checkBlenderAvailable() {
  try {
    execSync('blender --version', { stdio: 'ignore' });
  } catch (err) {
    console.error('\u274C ERROR: Blender is not installed or not available in your PATH.');
    console.error(
      'Please install Blender and ensure it is available as "blender" in your system PATH.',
    );
    process.exit(1);
  }
}

checkBlenderAvailable();

import {
  cleanupTempDir,
  convertFbxToGlb,
  createModelDirectoryStructure,
  EMOJI,
  findModelFiles,
  findZipFiles,
  getDefaultPaths,
  normalizeFileName,
  unzipFile,
} from './asset-compression/prepare-assets-common.js';
import { findModelTextures, processTexture } from './asset-compression/texture-processor.js';

const { SOURCE_DIR, DESTINATION_BASE_DIR, TEMP_DIR, FBX2GLTF_PATH } = getDefaultPaths();

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  centerModel: true, // Enabled by default
};

// Process command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--no-center') {
    options.centerModel = false;
  }
}

async function optimizeGlb(filePath, options = {}) {
  console.log(`${EMOJI.COMPRESSION} Optimizing GLB file: ${filePath}`);
  try {
    const io = new NodeIO().registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
    const document = await io.read(filePath);

    // Remove all animations to ensure T-pose is default, unless keepAnimations is true
    if (!options.keepAnimations) {
      document
        .getRoot()
        .listAnimations()
        .forEach((anim) => anim.dispose());
    }
    await document.transform(prune());

    // Set model origin to the foot (bottom) of the model if centerModel option is enabled
    if (options.centerModel) {
      console.log(`${EMOJI.PROCESSING} Setting model origin to foot (Y close to 0)`);
      try {
        await document.transform(
          center({
            pivot: 'bottom', // Places the bottom of the model at Y=0
          }),
        );
        console.log(`${EMOJI.SUCCESS} Model origin set to bottom (foot) with Y close to 0`);
      } catch (error) {
        console.error(`${EMOJI.ERROR} Error fixing model origin: ${error.message}`);
      }
    }

    try {
      await document.transform(
        draco({
          method: 'edgebreaker',
          quantizePosition: 14,
          quantizeNormal: 10,
          quantizeTexcoord: 12,
        }),
      );
      console.log(`${EMOJI.COMPRESSION} GLB mesh data compressed with Draco`);
    } catch (dracoError) {
      console.warn(`${EMOJI.WARNING} Draco compression failed: ${dracoError.message}`);
    }
    await io.write(filePath, document);
    console.log(`${EMOJI.SUCCESS} Successfully optimized ${filePath}`);
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error optimizing GLB file ${filePath}: ${error.message}`);
  }
}

async function runBlenderPrepareTPose(fbxPath, outputGlbPath, preserveAnimations = false) {
  const blenderScript = path.resolve(__dirname, 'blender_prepare_tpose.py');
  const args = [
    '--background',
    '--python',
    blenderScript,
    '--',
    fbxPath,
    outputGlbPath,
    preserveAnimations ? '--preserve-animations' : '',
  ].filter(Boolean);
  console.log(`${EMOJI.PROCESSING} Running Blender with preserveAnimations=${preserveAnimations}`);
  return new Promise((resolve, reject) => {
    const blender = spawn('blender', args);
    blender.stdout.on('data', (data) => process.stdout.write(`[Blender] ${data}`));
    blender.stderr.on('data', (data) => process.stderr.write(`[Blender ERROR] ${data}`));
    blender.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Blender exited with code ${code}`));
    });
  });
}

async function processAnimations(sourceModelDir, destModelDir, modelName) {
  const animationsDir = path.join(sourceModelDir, 'animations');
  if (await fsExtra.pathExists(animationsDir)) {
    console.log(`${EMOJI.ANIMATION} Found animations directory`);
    const animationsDestDir = path.join(destModelDir, 'animations');
    await fsExtra.ensureDir(animationsDestDir);
    const { fbxFiles, glbFiles } = await findModelFiles(animationsDir);
    for (const animPath of fbxFiles) {
      const fileName = path.basename(animPath, '.fbx');
      // Normalize to NightStalker_Standing_Idle.glb for asset metadata
      const normalizedBaseName = normalizeFileName(fileName, modelName);
      const outputGlbPath = path.join(animationsDestDir, `${normalizedBaseName}.glb`);
      try {
        await convertFbxToGlb(animPath, animationsDestDir, normalizedBaseName, FBX2GLTF_PATH);
        if (await fsExtra.pathExists(outputGlbPath)) {
          // No Blender/transform step for animation GLBs
          console.log(`${EMOJI.SUCCESS} Animation converted and copied: ${outputGlbPath}`);
        }
      } catch (error) {
        console.warn(
          `${EMOJI.WARNING} Failed to convert animation ${animPath} to GLB: ${error.message}`,
        );
      }
    }
    for (const animPath of glbFiles) {
      const fileName = path.basename(animPath);
      const normalizedName = normalizeFileName(fileName, modelName);
      const destPath = path.join(animationsDestDir, normalizedName);
      await fsExtra.copy(animPath, destPath);
      console.log(`${EMOJI.SUCCESS} Animation copied: ${fileName} → ${normalizedName}`);
    }
  } else {
    console.log(`${EMOJI.WARNING} No animations directory found`);
  }
}

async function processModelFiles(sourceDir, destModelDir, modelName, excludeDirs = []) {
  const glbDestDir = path.join(destModelDir, 'glb');
  await fsExtra.ensureDir(glbDestDir);
  // Only process the T-Pose FBX for the main model
  const tPoseFbx = path.join(sourceDir, `${modelName}_T-Pose.fbx`);
  if (await fsExtra.pathExists(tPoseFbx)) {
    const normalizedBaseName = normalizeFileName(`${modelName}_Night_Stalker`, modelName);
    const tempGlbPath = path.join(glbDestDir, `${normalizedBaseName}_raw.glb`);
    const outputGlbPath = path.join(glbDestDir, `${normalizedBaseName}.glb`);
    try {
      await convertFbxToGlb(tPoseFbx, glbDestDir, `${normalizedBaseName}_raw`, FBX2GLTF_PATH);
      if (await fsExtra.pathExists(tempGlbPath)) {
        await optimizeGlb(tempGlbPath);
        await runBlenderPrepareTPose(tempGlbPath, outputGlbPath, true);
        await fsExtra.remove(tempGlbPath);
      }
    } catch (error) {
      console.warn(`${EMOJI.WARNING} Failed to convert ${tPoseFbx} to GLB: ${error.message}`);
    }
  } else {
    console.log(`${EMOJI.WARNING} No T-Pose FBX found for model: ${modelName}`);
  }
  // Copy any existing GLBs in the root (shouldn't be any, but for completeness)
  const { glbFiles } = await findModelFiles(sourceDir, excludeDirs);
  for (const glbPath of glbFiles) {
    const fileName = path.basename(glbPath);
    const normalizedName = normalizeFileName(fileName, modelName);
    const destPath = path.join(glbDestDir, normalizedName);
    await fsExtra.copy(glbPath, destPath);
    await optimizeGlb(destPath);
  }
}

async function processModel(modelName) {
  console.log(`\n${EMOJI.MODEL} ========== Processing model: ${modelName} ==========\n`);
  const sourceModelDir = path.join(SOURCE_DIR, modelName);
  const destModelDir = path.join(DESTINATION_BASE_DIR, modelName);
  const tempModelDir = path.join(TEMP_DIR, modelName);
  if (!(await fsExtra.pathExists(sourceModelDir))) {
    console.error(`${EMOJI.ERROR} Source model directory does not exist: ${sourceModelDir}`);
    return;
  }
  await fsExtra.ensureDir(destModelDir);
  await fsExtra.ensureDir(tempModelDir);
  const { destGlbDir, destAnimationsDir, destTexturesDir } =
    await createModelDirectoryStructure(destModelDir);
  await processAnimations(sourceModelDir, destModelDir, modelName);
  const zipFiles = await findZipFiles(sourceModelDir);
  if (zipFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${zipFiles.length} zip file(s) for model: ${modelName}`);
    for (const zipPath of zipFiles) {
      await unzipFile(zipPath, tempModelDir);
    }
    const sourceDir = tempModelDir;
    await processModelFiles(sourceDir, destModelDir, modelName);
    const textureFiles = await findModelTextures(sourceDir, modelName);
    await processModelTextures(textureFiles, destTexturesDir, modelName);
  } else {
    console.log(
      `${EMOJI.PROCESSING} No zip files found for model: ${modelName}. Processing directory directly.`,
    );
    await processModelFiles(sourceModelDir, destModelDir, modelName, ['animations']);
    const textureFiles = await findModelTextures(sourceModelDir, modelName);
    await processModelTextures(textureFiles, destTexturesDir, modelName);
  }
  console.log(`${EMOJI.SUCCESS} Completed processing for model: ${modelName}`);
}

async function processModelTextures(textureFiles, destTexturesDir, modelName) {
  if (textureFiles.length > 0) {
    console.log(
      `${EMOJI.PROCESSING} Processing ${textureFiles.length} texture(s) for model: ${modelName}`,
    );
    for (const texturePath of textureFiles) {
      const fileName = path.basename(texturePath);
      const normalizedName = normalizeFileName(fileName, modelName);
      const destPath = path.join(destTexturesDir, normalizedName);
      await processTexture(texturePath, destPath, false); // basic: no KTX2
    }
    console.log(`${EMOJI.SUCCESS} Finished processing textures for ${modelName}`);
  } else {
    console.log(`${EMOJI.WARNING} No texture files found for model: ${modelName}`);
  }
}

async function main() {
  try {
    console.log('\n=== Basic Model Asset Preparation Tool ===');
    console.log(`Source directory: ${SOURCE_DIR}`);
    console.log(`Destination directory: ${DESTINATION_BASE_DIR}`);
    console.log(`Center models at origin: ${options.centerModel ? 'Yes' : 'No'}`);
    console.log('=========================================\n');
    console.log('Available options:');
    console.log('  --no-center : Disable automatic centering of models at the origin');
    console.log('=========================================\n');
    if (!(await fsExtra.pathExists(FBX2GLTF_PATH))) {
      console.error(`${EMOJI.ERROR} FBX2glTF tool not found at ${FBX2GLTF_PATH}`);
      console.error('Please make sure the tool is installed and executable');
      process.exit(1);
    }
    if (!(await fsExtra.pathExists(SOURCE_DIR))) {
      console.error(`${EMOJI.ERROR} Source directory does not exist: ${SOURCE_DIR}`);
      process.exit(1);
    }
    await fsExtra.ensureDir(DESTINATION_BASE_DIR);
    await fsExtra.ensureDir(TEMP_DIR);
    const modelDirs = await fsExtra.readdir(SOURCE_DIR);
    const modelDirectories = [];
    for (const dir of modelDirs) {
      const stats = await fsExtra.stat(path.join(SOURCE_DIR, dir));
      if (stats.isDirectory()) modelDirectories.push(dir);
    }
    if (modelDirectories.length === 0) {
      console.log(`${EMOJI.WARNING} No models found in source directory`);
      await cleanupTempDir(TEMP_DIR);
      return;
    }
    console.log(
      `${EMOJI.PROCESSING} Found ${modelDirectories.length} model directories to process`,
    );
    for (const modelDir of modelDirectories) {
      await processModel(modelDir);
    }
    await cleanupTempDir(TEMP_DIR);
    console.log(`\n${EMOJI.SUCCESS} All models processed successfully`);
    console.log(
      `\n${EMOJI.SUCCESS} Models and textures have been processed and saved with external textures`,
    );
    console.log(
      `\n${EMOJI.SUCCESS} Note: Make sure your asset loading code references textures relative to your GLB path`,
    );
  } catch (error) {
    console.error(`\n${EMOJI.ERROR} An error occurred:`, error);
    try {
      await cleanupTempDir(TEMP_DIR);
    } catch (cleanupError) {
      console.error(`${EMOJI.ERROR} Error during cleanup:`, cleanupError);
    }
    process.exit(1);
  }
}

main();
