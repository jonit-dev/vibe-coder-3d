#!/usr/bin/env node

import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

import admZip from 'adm-zip';
import fsExtra from 'fs-extra';
import * as glob from 'glob';

export const execAsync = promisify(exec);

// Emoji indicators for consistent logging
export const EMOJI = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  PROCESSING: '🔄',
  MODEL: '🧠',
  TEXTURE: '🖼️',
  ANIMATION: '🎭',
  COMPRESSION: '🗜️',
};

// Supported model formats
export const MODEL_EXTENSIONS = ['.fbx', '.glb', '.gltf'];
// Supported texture formats
export const TEXTURE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.tga',
  '.bmp',
  '.tif',
  '.tiff',
  '.dds',
];

// Common paths
export const getDefaultPaths = () => {
  const cwd = process.cwd();
  return {
    SOURCE_DIR: path.resolve(cwd, 'source_models/fbx'),
    DESTINATION_BASE_DIR: path.resolve(cwd, 'public/assets/models'),
    TEMP_DIR: path.resolve(cwd, 'temp_model_processing'),
    FBX2GLTF_PATH: path.resolve(cwd, 'tools/FBX2glTF-linux-x64'),
  };
};

/**
 * Unzip a file to the specified destination
 * @param {string} zipPath - Path to the zip file
 * @param {string} destPath - Extraction destination path
 */
export async function unzipFile(zipPath, destPath) {
  console.log(`${EMOJI.PROCESSING} Unzipping ${zipPath} to ${destPath}`);
  try {
    const zip = new admZip(zipPath);
    zip.extractAllTo(destPath, true);
    console.log(`${EMOJI.SUCCESS} Successfully unzipped ${zipPath}`);
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error unzipping ${zipPath}: ${error.message}`);
    throw error;
  }
}

/**
 * Convert FBX file to GLB format
 * @param {string} fbxPath - Path to the FBX file
 * @param {string} outputDir - Output directory for the GLB file
 * @param {string} outputName - Base name for the output file (without extension)
 * @param {string} fbx2gltfPath - Path to the FBX2glTF tool
 * @returns {Promise<string>} - Path to the converted GLB file
 */
export async function convertFbxToGlb(fbxPath, outputDir, outputName, fbx2gltfPath) {
  console.log(`${EMOJI.PROCESSING} Converting ${fbxPath} to GLB format...`);

  try {
    // Make sure the output directory exists
    await fsExtra.ensureDir(outputDir);

    // Full path for the output file (without extension)
    const outputBase = path.join(outputDir, outputName);
    const outputGlbPath = `${outputBase}.glb`;

    // Run the FBX2glTF command - corrected format
    const cmd = `"${fbx2gltfPath}" --binary --long-indices=auto --input "${fbxPath}" --output "${outputBase}"`;
    console.log(`${EMOJI.PROCESSING} Running command: ${cmd}`);

    await execAsync(cmd);

    // Check if the GLB file was created
    if (await fsExtra.pathExists(outputGlbPath)) {
      console.log(`${EMOJI.SUCCESS} Successfully converted to ${outputGlbPath}`);
      return outputGlbPath;
    } else {
      throw new Error(`GLB file was not generated at ${outputGlbPath}`);
    }
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error converting FBX to GLB: ${error.message}`);
    throw error;
  }
}

/**
 * Normalize filename by removing date stamps and _texture suffixes
 * @param {string} fileName - Original filename
 * @param {string} modelName - Name of the model
 * @returns {string} Normalized filename
 */
export function normalizeFileName(fileName, modelName) {
  // Remove date stamps like _0424225028
  let normalized = fileName.replace(/_\d+/g, '');

  // Remove _texture suffix
  normalized = normalized.replace(/_texture/g, '');

  // If the filename doesn't have the model name, prepend it
  if (!normalized.toLowerCase().includes(modelName.toLowerCase())) {
    const extension = path.extname(normalized);
    const baseName = path.basename(normalized, extension);
    normalized = `${modelName}_${baseName}${extension}`;
  }

  return normalized;
}

/**
 * Create required directory structure for a model
 * @param {string} destModelDir - Destination model directory
 * @returns {Object} - Object containing paths to created directories
 */
export async function createModelDirectoryStructure(destModelDir) {
  const destGlbDir = path.join(destModelDir, 'glb');
  const destAnimationsDir = path.join(destModelDir, 'animations');
  const destTexturesDir = path.join(destModelDir, 'textures');

  await fsExtra.ensureDir(destModelDir);
  await fsExtra.ensureDir(destGlbDir);
  await fsExtra.ensureDir(destAnimationsDir);
  await fsExtra.ensureDir(destTexturesDir);

  return {
    destGlbDir,
    destAnimationsDir,
    destTexturesDir,
  };
}

/**
 * Find all zip files in a directory
 * @param {string} sourceDir - Source directory
 * @returns {Promise<Array<string>>} - Array of zip file paths
 */
export async function findZipFiles(sourceDir) {
  const zipPattern = path.join(sourceDir, '**', '*.zip');
  return await glob.glob(zipPattern);
}

/**
 * Clean up temporary directory
 * @param {string} tempDir - Temporary directory to clean up
 */
export async function cleanupTempDir(tempDir) {
  console.log('\nCleaning up...');

  if (await fsExtra.pathExists(tempDir)) {
    await fsExtra.remove(tempDir);
    console.log(`${EMOJI.SUCCESS} Removed temporary directory: ${tempDir}`);
  }

  console.log('Cleanup completed');
}

/**
 * Check if texture tools are available
 * @returns {Promise<boolean>} True if tools are available
 */
export async function checkTextureToolsAvailable() {
  try {
    await execAsync(`npx gltf-transform --version`);
    return true;
  } catch (error) {
    console.warn(
      `${EMOJI.WARNING} gltf-transform CLI not found. Texture compression to KTX2 format will be skipped.`,
    );
    console.warn(
      'To enable KTX2 compression, install @gltf-transform/cli with: yarn add @gltf-transform/cli',
    );
    return false;
  }
}

/**
 * Find model files (FBX, GLB) in directory
 * @param {string} sourceDir - Source directory
 * @param {Array<string>} excludeDirs - Directories to exclude
 * @returns {Promise<Object>} - Object containing arrays of file paths
 */
export async function findModelFiles(sourceDir, excludeDirs = []) {
  // Find FBX files in the root directory first (like T_Pose models)
  const rootFbxFiles = await glob.glob(path.join(sourceDir, '*.fbx'));

  // Find FBX files in subdirectories, excluding specified directories
  let subDirFbxFiles = [];
  if (excludeDirs.length > 0) {
    // Build pattern to exclude directories
    const excludePattern = `!(${excludeDirs.join('|')})`;
    const fbxPattern = path.join(sourceDir, excludePattern, '**', '*.fbx');
    subDirFbxFiles = await glob.glob(fbxPattern);
  } else {
    // If no exclusions, search all subdirectories
    const fbxPattern = path.join(sourceDir, '**', '*.fbx');
    subDirFbxFiles = await glob.glob(fbxPattern);

    // Filter out any files that are directly in the root (to avoid duplicates)
    subDirFbxFiles = subDirFbxFiles.filter((file) => {
      const relPath = path.relative(sourceDir, file);
      return relPath.includes(path.sep); // Has directory separator
    });
  }

  // Same for GLB files
  const rootGlbFiles = await glob.glob(path.join(sourceDir, '*.glb'));

  let subDirGlbFiles = [];
  if (excludeDirs.length > 0) {
    const excludePattern = `!(${excludeDirs.join('|')})`;
    const glbPattern = path.join(sourceDir, excludePattern, '**', '*.glb');
    subDirGlbFiles = await glob.glob(glbPattern);
  } else {
    const glbPattern = path.join(sourceDir, '**', '*.glb');
    subDirGlbFiles = await glob.glob(glbPattern);

    // Filter out any files that are directly in the root
    subDirGlbFiles = subDirGlbFiles.filter((file) => {
      const relPath = path.relative(sourceDir, file);
      return relPath.includes(path.sep);
    });
  }

  return {
    fbxFiles: [...rootFbxFiles, ...subDirFbxFiles],
    glbFiles: [...rootGlbFiles, ...subDirGlbFiles],
  };
}
