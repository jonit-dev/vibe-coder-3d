#!/usr/bin/env node

import { NodeIO } from '@gltf-transform/core';
import { draco, prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import fsExtra from 'fs-extra';
import path from 'path';

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
} from './prepare-assets-common.js';

import { findModelTextures, processTexture } from './texture-processor.js';

// Get paths
const { SOURCE_DIR, DESTINATION_BASE_DIR, TEMP_DIR, FBX2GLTF_PATH } = getDefaultPaths();

/**
 * GLB file optimization using glTF-Transform while preserving external textures
 * @param {string} filePath - Path to the GLB file
 * @returns {Promise<void>}
 */
async function optimizeGlb(filePath) {
  console.log(`${EMOJI.COMPRESSION} Optimizing GLB file: ${filePath}`);

  try {
    const io = new NodeIO().registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

    const document = await io.read(filePath);

    // Prune unused nodes/materials/etc
    await document.transform(prune());

    // Apply basic draco compression
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

    // Save the optimized GLB, preserving external textures
    await io.write(filePath, document);

    console.log(`${EMOJI.SUCCESS} Successfully optimized ${filePath}`);
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error optimizing GLB file ${filePath}: ${error.message}`);
    // Don't throw the error to allow process to continue
  }
}

/**
 * Process animation files for a model
 * @param {string} sourceModelDir - Source model directory
 * @param {string} destModelDir - Destination model directory
 * @param {string} modelName - Name of the model
 */
async function processAnimations(sourceModelDir, destModelDir, modelName) {
  const animationsDir = path.join(sourceModelDir, 'animations');

  if (await fsExtra.pathExists(animationsDir)) {
    console.log(`${EMOJI.ANIMATION} Found animations directory`);

    const animationsDestDir = path.join(destModelDir, 'animations');
    await fsExtra.ensureDir(animationsDestDir);

    // Find all FBX animation files to convert to GLB
    const { fbxFiles, glbFiles } = await findModelFiles(animationsDir);

    if (fbxFiles.length > 0) {
      console.log(`${EMOJI.PROCESSING} Found ${fbxFiles.length} FBX animation file(s) to convert`);

      for (const animPath of fbxFiles) {
        const fileName = path.basename(animPath);
        const normalizedBaseName = normalizeFileName(path.basename(fileName, '.fbx'), modelName);
        const outputGlbPath = path.join(animationsDestDir, `${normalizedBaseName}.glb`);

        // Convert to GLB
        try {
          await convertFbxToGlb(animPath, animationsDestDir, normalizedBaseName, FBX2GLTF_PATH);

          // Optimize the converted animation GLB file
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

    // Copy any existing GLB files
    if (glbFiles.length > 0) {
      console.log(`${EMOJI.PROCESSING} Found ${glbFiles.length} GLB animation file(s)`);

      for (const animPath of glbFiles) {
        const fileName = path.basename(animPath);
        const normalizedName = normalizeFileName(fileName, modelName);
        const destPath = path.join(animationsDestDir, normalizedName);

        await fsExtra.copy(animPath, destPath);
        console.log(`${EMOJI.SUCCESS} Copied animation: ${fileName} → ${normalizedName}`);

        // Optimize the copied GLB animation file
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

/**
 * Process model files and convert FBX to GLB
 * @param {string} sourceDir - Source directory with model files
 * @param {string} destModelDir - Destination model directory
 * @param {string} modelName - Name of the model
 * @param {Array<string>} excludeDirs - Directories to exclude (optional)
 */
async function processModelFiles(sourceDir, destModelDir, modelName, excludeDirs = []) {
  // Create destination directories
  const glbDestDir = path.join(destModelDir, 'glb');
  await fsExtra.ensureDir(glbDestDir);

  const { fbxFiles, glbFiles } = await findModelFiles(sourceDir, excludeDirs);

  if (fbxFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${fbxFiles.length} FBX file(s) to convert`);

    for (const fbxPath of fbxFiles) {
      const fileName = path.basename(fbxPath);
      const normalizedBaseName = normalizeFileName(path.basename(fileName, '.fbx'), modelName);
      const outputGlbPath = path.join(glbDestDir, `${normalizedBaseName}.glb`);

      // Convert to GLB
      try {
        await convertFbxToGlb(fbxPath, glbDestDir, normalizedBaseName, FBX2GLTF_PATH);

        // Optimize the converted GLB file
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

      // Optimize the copied GLB file
      await optimizeGlb(destPath);
    }
  }
}

/**
 * Process a model directory by unzipping files, copying textures and handling any other necessary files
 * @param {string} modelName - The name of the model (directory name)
 */
async function processModel(modelName) {
  console.log(`\n${EMOJI.MODEL} ========== Processing model: ${modelName} ==========`);

  const sourceModelDir = path.join(SOURCE_DIR, modelName);
  const destModelDir = path.join(DESTINATION_BASE_DIR, modelName);
  const tempModelDir = path.join(TEMP_DIR, modelName);

  // Check if source model directory exists
  if (!(await fsExtra.pathExists(sourceModelDir))) {
    console.error(`${EMOJI.ERROR} Source model directory does not exist: ${sourceModelDir}`);
    return;
  }

  // Create destination and temp directories - ensure they exist
  await fsExtra.ensureDir(destModelDir);
  await fsExtra.ensureDir(tempModelDir);

  // Create required directory structure
  const { destGlbDir, destAnimationsDir, destTexturesDir } =
    await createModelDirectoryStructure(destModelDir);

  // Process animations
  await processAnimations(sourceModelDir, destModelDir, modelName);

  // Look for zip files and unzip them
  const zipFiles = await findZipFiles(sourceModelDir);

  if (zipFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${zipFiles.length} zip file(s) for model: ${modelName}`);

    for (const zipPath of zipFiles) {
      await unzipFile(zipPath, tempModelDir);
    }

    // Process the unzipped files
    const sourceDir = tempModelDir;

    // Handle model files (FBX, GLB, GLTF)
    await processModelFiles(sourceDir, destModelDir, modelName);

    // Handle textures with improved duplicate detection
    const textureFiles = await findModelTextures(sourceDir, modelName);
    await processModelTextures(textureFiles, destTexturesDir, modelName);
  } else {
    // No zip files found, process the directory directly
    console.log(
      `${EMOJI.PROCESSING} No zip files found for model: ${modelName}. Processing directory directly.`,
    );

    // Handle model files (FBX, GLB, GLTF)
    await processModelFiles(sourceModelDir, destModelDir, modelName, ['animations']);

    // Handle textures with improved duplicate detection
    const textureFiles = await findModelTextures(sourceModelDir, modelName);
    await processModelTextures(textureFiles, destTexturesDir, modelName);
  }

  console.log(`${EMOJI.SUCCESS} Completed processing for model: ${modelName}`);
}

/**
 * Process all textures for a model
 * @param {Array<string>} textureFiles - Array of texture file paths
 * @param {string} destTexturesDir - Destination directory for textures
 * @param {string} modelName - Name of the model
 */
async function processModelTextures(textureFiles, destTexturesDir, modelName) {
  if (textureFiles.length > 0) {
    console.log(
      `${EMOJI.PROCESSING} Processing ${textureFiles.length} texture(s) for model: ${modelName}`,
    );

    // Check if KTX2 conversion is available
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

/**
 * Main function to process all models
 */
async function main() {
  try {
    console.log('\n=== Unified Model Asset Preparation Tool ===');
    console.log(`Source directory: ${SOURCE_DIR}`);
    console.log(`Destination directory: ${DESTINATION_BASE_DIR}`);
    console.log('=========================================\n');

    // Check if FBX2glTF tool exists
    if (!(await fsExtra.pathExists(FBX2GLTF_PATH))) {
      console.error(`${EMOJI.ERROR} FBX2glTF tool not found at ${FBX2GLTF_PATH}`);
      console.error('Please make sure the tool is installed and executable');
      process.exit(1);
    }

    // Check if source directory exists
    if (!(await fsExtra.pathExists(SOURCE_DIR))) {
      console.error(`${EMOJI.ERROR} Source directory does not exist: ${SOURCE_DIR}`);
      process.exit(1);
    }

    // Create destination base directory if it doesn't exist
    await fsExtra.ensureDir(DESTINATION_BASE_DIR);

    // Create temporary directory
    await fsExtra.ensureDir(TEMP_DIR);

    // Get all model directories
    const modelDirs = await fsExtra.readdir(SOURCE_DIR);
    const modelDirectories = modelDirs.filter(async (dir) => {
      const stats = await fsExtra.stat(path.join(SOURCE_DIR, dir));
      return stats.isDirectory();
    });

    if (modelDirectories.length === 0) {
      console.log(`${EMOJI.WARNING} No models found in source directory`);
      await cleanupTempDir(TEMP_DIR);
      return;
    }

    console.log(
      `${EMOJI.PROCESSING} Found ${modelDirectories.length} model directories to process`,
    );

    // Process each model
    for (const modelDir of modelDirectories) {
      await processModel(modelDir);
    }

    // Clean up after processing
    await cleanupTempDir(TEMP_DIR);

    console.log(`\n${EMOJI.SUCCESS} All models processed successfully`);
    console.log(
      `\n${EMOJI.SUCCESS} Models and textures have been processed with improved duplicate detection`,
    );
  } catch (error) {
    console.error(`\n${EMOJI.ERROR} An error occurred:`, error);

    // Attempt cleanup even if there was an error
    try {
      await cleanupTempDir(TEMP_DIR);
    } catch (cleanupError) {
      console.error(`${EMOJI.ERROR} Error during cleanup:`, cleanupError);
    }

    process.exit(1);
  }
}

// Execute the main function
main();
