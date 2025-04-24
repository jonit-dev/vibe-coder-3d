#!/usr/bin/env node

import admZip from 'adm-zip';
import { exec } from 'child_process';
import fsExtra from 'fs-extra';
import * as glob from 'glob';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SOURCE_DIR = path.resolve('source_models/fbx');
const DESTINATION_BASE_DIR = path.resolve('public/assets/models');
const TEMP_DIR = path.resolve('temp_model_processing');

// Supported model formats
const MODEL_EXTENSIONS = ['.fbx', '.glb', '.gltf'];
// Supported texture formats
const TEXTURE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tga', '.bmp', '.tif', '.tiff', '.dds'];

/**
 * Unzip a file to the specified destination
 * @param {string} zipPath - Path to the zip file
 * @param {string} destPath - Extraction destination path
 */
async function unzipFile(zipPath, destPath) {
  console.log(`Unzipping ${zipPath} to ${destPath}`);
  try {
    const zip = new admZip(zipPath);
    zip.extractAllTo(destPath, true);
    console.log(`Successfully unzipped ${zipPath}`);
  } catch (error) {
    console.error(`Error unzipping ${zipPath}: ${error.message}`);
    throw error;
  }
}

/**
 * Normalize filename by removing date stamps and _texture suffixes
 * @param {string} fileName - Original filename
 * @param {string} modelName - Name of the model
 * @returns {string} Normalized filename
 */
function normalizeFileName(fileName, modelName) {
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
 * Process a model directory by unzipping files, copying textures and handling any other necessary files
 * @param {string} modelName - The name of the model (directory name)
 */
async function processModel(modelName) {
  console.log(`\n========== Processing model: ${modelName} ==========`);

  const sourceModelDir = path.join(SOURCE_DIR, modelName);
  const destModelDir = path.join(DESTINATION_BASE_DIR, modelName);
  const tempModelDir = path.join(TEMP_DIR, modelName);

  // Create destination and temp directories
  await fsExtra.ensureDir(destModelDir);
  await fsExtra.ensureDir(tempModelDir);

  // Process animations first
  await processAnimations(sourceModelDir, destModelDir, modelName);

  // Look for zip files and unzip them
  const zipPattern = path.join(sourceModelDir, '**', '*.zip');
  const zipFiles = await glob.glob(zipPattern);

  if (zipFiles.length > 0) {
    console.log(`Found ${zipFiles.length} zip file(s) for model: ${modelName}`);

    for (const zipPath of zipFiles) {
      await unzipFile(zipPath, tempModelDir);
    }

    // Process the unzipped files
    const sourceDir = tempModelDir;

    // Create destination directories
    const texturesDestDir = path.join(destModelDir, 'textures');
    await fsExtra.ensureDir(texturesDestDir);

    // Handle model files (FBX, GLB, GLTF)
    for (const extension of MODEL_EXTENSIONS) {
      const modelPattern = path.join(sourceDir, '**', `*${extension}`);
      const modelFiles = await glob.glob(modelPattern);

      if (modelFiles.length > 0) {
        console.log(`Found ${modelFiles.length} ${extension} file(s)`);

        const modelDestDir = path.join(destModelDir, extension.substring(1)); // remove the dot
        await fsExtra.ensureDir(modelDestDir);

        for (const modelPath of modelFiles) {
          const fileName = path.basename(modelPath);
          const normalizedName = normalizeFileName(fileName, modelName);
          const destPath = path.join(modelDestDir, normalizedName);
          await fsExtra.copy(modelPath, destPath);
          console.log(`Copied ${extension} file: ${fileName} → ${normalizedName}`);
        }
      }
    }

    // Handle textures in standard locations or .fbm directories
    await handleTextures(sourceDir, modelName, path.join(destModelDir, 'textures'));
  } else {
    // No zip files found, process the directory directly
    console.log(`No zip files found for model: ${modelName}. Processing directory directly.`);

    // Create destination directories
    const texturesDestDir = path.join(destModelDir, 'textures');
    await fsExtra.ensureDir(texturesDestDir);

    // Handle model files (FBX, GLB, GLTF)
    for (const extension of MODEL_EXTENSIONS) {
      // Skip the animations directory as we already processed it
      const modelPattern = path.join(sourceModelDir, `!(animations)/**/*${extension}`);
      const modelFiles = await glob.glob(modelPattern);

      if (modelFiles.length > 0) {
        console.log(`Found ${modelFiles.length} ${extension} file(s)`);

        const modelDestDir = path.join(destModelDir, extension.substring(1)); // remove the dot
        await fsExtra.ensureDir(modelDestDir);

        for (const modelPath of modelFiles) {
          const fileName = path.basename(modelPath);
          const normalizedName = normalizeFileName(fileName, modelName);
          const destPath = path.join(modelDestDir, normalizedName);
          await fsExtra.copy(modelPath, destPath);
          console.log(`Copied ${extension} file: ${fileName} → ${normalizedName}`);
        }
      }
    }

    // Handle textures
    await handleTextures(sourceModelDir, modelName, texturesDestDir);
  }

  console.log(`Completed processing for model: ${modelName}`);
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
    console.log('Found animations directory');

    const animationsDestDir = path.join(destModelDir, 'animations');
    await fsExtra.ensureDir(animationsDestDir);

    // Find all animation files - they can be any model format
    let animationFiles = [];
    for (const extension of MODEL_EXTENSIONS) {
      const pattern = path.join(animationsDir, `**/*${extension}`);
      const files = await glob.glob(pattern);
      animationFiles = [...animationFiles, ...files];
    }

    if (animationFiles.length > 0) {
      console.log(`Found ${animationFiles.length} animation file(s)`);

      for (const animPath of animationFiles) {
        const fileName = path.basename(animPath);
        const normalizedName = normalizeFileName(fileName, modelName);
        const destPath = path.join(animationsDestDir, normalizedName);
        await fsExtra.copy(animPath, destPath);
        console.log(`Copied animation: ${fileName} → ${normalizedName}`);
      }
    } else {
      console.log('No animation files found');
    }
  } else {
    console.log('No animations directory found');
  }
}

/**
 * Handle texture files for a model
 * @param {string} sourceDir - Source directory to look for textures
 * @param {string} modelName - The name of the model
 * @param {string} texturesDestDir - Destination directory for textures
 */
async function handleTextures(sourceDir, modelName, texturesDestDir) {
  // Look for texture directories with .fbm extension
  const fbmDir = path.join(sourceDir, `${modelName}.fbm`);

  if (await fsExtra.pathExists(fbmDir)) {
    console.log(`Found textures directory: ${fbmDir}`);

    // Use glob to find all texture files
    const texturePattern = path.join(fbmDir, '**', '*.*');
    const textureFiles = await glob.glob(texturePattern);

    if (textureFiles.length === 0) {
      console.log(`No texture files found in ${fbmDir}`);
    } else {
      // Copy all textures from the .fbm directory
      for (const texturePath of textureFiles) {
        const fileName = path.basename(texturePath);
        const normalizedName = normalizeFileName(fileName, modelName);
        const destPath = path.join(texturesDestDir, normalizedName);

        await fsExtra.copy(texturePath, destPath);
        console.log(`Copied texture: ${fileName} → ${normalizedName}`);
      }
    }
  }

  // Try to find textures in other locations using glob
  let textureFiles = [];
  for (const extension of TEXTURE_EXTENSIONS) {
    const pattern = path.join(sourceDir, '**', `*${extension}`);
    const files = await glob.glob(pattern);
    textureFiles = [...textureFiles, ...files];
  }

  if (textureFiles.length > 0) {
    console.log(`Found ${textureFiles.length} texture file(s) in other locations`);

    for (const texturePath of textureFiles) {
      const fileName = path.basename(texturePath);
      const normalizedName = normalizeFileName(fileName, modelName);
      const destPath = path.join(texturesDestDir, normalizedName);

      // Check if we've already copied this file (might be in .fbm directory)
      if (!(await fsExtra.pathExists(destPath))) {
        await fsExtra.copy(texturePath, destPath);
        console.log(`Copied texture: ${fileName} → ${normalizedName}`);
      }
    }
  } else if (!(await fsExtra.pathExists(fbmDir))) {
    console.log(`No texture files found for model: ${modelName}`);
  }
}

/**
 * Clean up temporary files and directories
 */
async function cleanup() {
  console.log('\nCleaning up temporary files...');

  if (await fsExtra.pathExists(TEMP_DIR)) {
    await fsExtra.remove(TEMP_DIR);
    console.log(`Removed temporary directory: ${TEMP_DIR}`);
  }

  console.log('Cleanup completed');
}

/**
 * Main function to process all models
 */
async function main() {
  try {
    console.log('\n=== Model Asset Preparation Tool ===');
    console.log(`Source directory: ${SOURCE_DIR}`);
    console.log(`Destination directory: ${DESTINATION_BASE_DIR}`);
    console.log('====================================\n');

    // Check if source directory exists
    if (!(await fsExtra.pathExists(SOURCE_DIR))) {
      console.error(`Source directory does not exist: ${SOURCE_DIR}`);
      process.exit(1);
    }

    // Create destination base directory if it doesn't exist
    await fsExtra.ensureDir(DESTINATION_BASE_DIR);

    // Create temporary directory
    await fsExtra.ensureDir(TEMP_DIR);

    // Get all model directories using glob
    const modelDirs = await glob.glob(path.join(SOURCE_DIR, '*/'));

    if (modelDirs.length === 0) {
      console.log('No models found in source directory');
      await cleanup();
      return;
    }

    console.log(`Found ${modelDirs.length} model directories to process`);

    // Process each model
    for (const modelDir of modelDirs) {
      const modelName = path.basename(modelDir.replace(/\/$/, ''));
      await processModel(modelName);
    }

    // Clean up after processing
    await cleanup();

    console.log('\n✅ All models processed successfully');
  } catch (error) {
    console.error('\n❌ An error occurred:', error);

    // Attempt cleanup even if there was an error
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    process.exit(1);
  }
}

// Execute the main function
main();
