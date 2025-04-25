#!/usr/bin/env node

import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRTextureBasisu } from '@gltf-transform/extensions';
import { center, draco, prune } from '@gltf-transform/functions';
import { exec } from 'child_process';
import draco3d from 'draco3dgltf';
import fsExtra from 'fs-extra';
import path from 'path';
import { promisify } from 'util';

import {
  checkTextureToolsAvailable,
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

const execAsync = promisify(exec);
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

async function optimizeGlb(filePath) {
  console.log(`${EMOJI.COMPRESSION} Optimizing GLB file: ${filePath}`);
  try {
    // Try advanced CLI optimization if available
    if (await checkTextureToolsAvailable()) {
      try {
        const tempFilePath = `${filePath}.temp.glb`;

        // First center the model if the option is enabled
        if (options.centerModel) {
          console.log(`${EMOJI.PROCESSING} Setting model origin to foot (Y close to 0)`);
          try {
            await execAsync(
              `npx gltf-transform center "${filePath}" "${tempFilePath}" --pivot bottom`,
            );
            await fsExtra.copy(tempFilePath, filePath);
            console.log(`${EMOJI.SUCCESS} Model origin set to bottom (foot) with Y close to 0`);
          } catch (centerError) {
            console.warn(`${EMOJI.WARNING} Center operation failed: ${centerError.message}`);
            // If the tempFile wasn't created, we need to make a copy for the next operations
            if (!(await fsExtra.pathExists(tempFilePath))) {
              await fsExtra.copy(filePath, tempFilePath);
            }
          }
        }

        await execAsync(
          `npx gltf-transform uastc "${filePath}" "${tempFilePath}" --level 2 --rdo --zstd 18 --verbose`,
        );
        await execAsync(`npx gltf-transform draco "${tempFilePath}" "${filePath}" --verbose`);
        await execAsync(
          `npx gltf-transform dedup "${filePath}" "${tempFilePath}" --verbose && npx gltf-transform weld "${tempFilePath}" "${filePath}" --verbose`,
        );
        if (await fsExtra.pathExists(tempFilePath)) {
          await fsExtra.remove(tempFilePath);
        }
        const originalSize = (await fsExtra.stat(filePath)).size;
        console.log(
          `${EMOJI.SUCCESS} Successfully optimized ${filePath} to ${(originalSize / 1024 / 1024).toFixed(2)} MB`,
        );
        return;
      } catch (cliError) {
        console.warn(
          `${EMOJI.WARNING} CLI optimization failed: ${cliError.message}. Falling back to SDK.`,
        );
      }
    }
    // Fallback to SDK
    const io = new NodeIO()
      .registerExtensions([KHRDracoMeshCompression, KHRTextureBasisu])
      .registerDependencies({
        draco: await draco3d.createDecoderModule(),
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'draco3d.encoder': await draco3d.createEncoderModule(),
        draco3d,
        meshopt: await import('meshoptimizer'),
      });
    const document = await io.read(filePath);
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

async function processAnimations(sourceModelDir, destModelDir, modelName) {
  const animationsDir = path.join(sourceModelDir, 'animations');
  if (await fsExtra.pathExists(animationsDir)) {
    console.log(`${EMOJI.ANIMATION} Found animations directory`);
    const animationsDestDir = path.join(destModelDir, 'animations');
    await fsExtra.ensureDir(animationsDestDir);
    const { fbxFiles, glbFiles } = await findModelFiles(animationsDir);
    if (fbxFiles.length > 0) {
      console.log(`${EMOJI.PROCESSING} Found ${fbxFiles.length} FBX animation file(s) to convert`);
      for (const animPath of fbxFiles) {
        const fileName = path.basename(animPath);
        const normalizedBaseName = normalizeFileName(path.basename(fileName, '.fbx'), modelName);
        const outputGlbPath = path.join(animationsDestDir, `${normalizedBaseName}.glb`);
        try {
          await convertFbxToGlb(animPath, animationsDestDir, normalizedBaseName, FBX2GLTF_PATH);
          if (await fsExtra.pathExists(outputGlbPath)) {
            await optimizeGlb(outputGlbPath);
          }
        } catch (error) {
          console.warn(
            `${EMOJI.WARNING} Failed to convert animation ${animPath} to GLB: ${error.message}`,
          );
        }
      }
    }
    if (glbFiles.length > 0) {
      console.log(`${EMOJI.PROCESSING} Found ${glbFiles.length} GLB animation file(s)`);
      for (const animPath of glbFiles) {
        const fileName = path.basename(animPath);
        const normalizedName = normalizeFileName(fileName, modelName);
        const destPath = path.join(animationsDestDir, normalizedName);
        await fsExtra.copy(animPath, destPath);
        console.log(`${EMOJI.SUCCESS} Copied animation: ${fileName} → ${normalizedName}`);
        await optimizeGlb(destPath);
      }
    }
    if (fbxFiles.length === 0 && glbFiles.length === 0) {
      console.log(`${EMOJI.WARNING} No animation files found`);
    }
  } else {
    console.log(`${EMOJI.WARNING} No animations directory found`);
  }
}

async function processModelFiles(sourceDir, destModelDir, modelName, excludeDirs = []) {
  const glbDestDir = path.join(destModelDir, 'glb');
  await fsExtra.ensureDir(glbDestDir);
  const { fbxFiles, glbFiles } = await findModelFiles(sourceDir, excludeDirs);
  if (fbxFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${fbxFiles.length} FBX file(s) to convert`);
    for (const fbxPath of fbxFiles) {
      const fileName = path.basename(fbxPath);
      const normalizedBaseName = normalizeFileName(path.basename(fileName, '.fbx'), modelName);
      const outputGlbPath = path.join(glbDestDir, `${normalizedBaseName}.glb`);
      try {
        await convertFbxToGlb(fbxPath, glbDestDir, normalizedBaseName, FBX2GLTF_PATH);
        if (await fsExtra.pathExists(outputGlbPath)) {
          await optimizeGlb(outputGlbPath);
        }
      } catch (error) {
        console.warn(`${EMOJI.WARNING} Failed to convert ${fbxPath} to GLB: ${error.message}`);
      }
    }
  } else {
    console.log(`${EMOJI.WARNING} No FBX files found to convert in ${sourceDir}`);
  }
  if (glbFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${glbFiles.length} existing GLB file(s)`);
    for (const glbPath of glbFiles) {
      const fileName = path.basename(glbPath);
      const normalizedName = normalizeFileName(fileName, modelName);
      const destPath = path.join(glbDestDir, normalizedName);
      await fsExtra.copy(glbPath, destPath);
      console.log(`${EMOJI.SUCCESS} Copied GLB file: ${fileName} → ${normalizedName}`);
      await optimizeGlb(destPath);
    }
  }
}

async function processModelTextures(textureFiles, destTexturesDir, modelName) {
  if (textureFiles.length > 0) {
    console.log(
      `${EMOJI.PROCESSING} Processing ${textureFiles.length} texture(s) for model: ${modelName}`,
    );
    const useKtx2 = await checkTextureToolsAvailable();
    for (const texturePath of textureFiles) {
      const fileName = path.basename(texturePath);
      const normalizedName = normalizeFileName(fileName, modelName);
      const destPath = path.join(destTexturesDir, normalizedName);
      await processTexture(texturePath, destPath, useKtx2);
    }
    console.log(`${EMOJI.SUCCESS} Finished processing textures for ${modelName}`);
  } else {
    console.log(`${EMOJI.WARNING} No texture files found for model: ${modelName}`);
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

async function main() {
  try {
    console.log('\n=== Advanced Model Asset Preparation Tool ===');
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
