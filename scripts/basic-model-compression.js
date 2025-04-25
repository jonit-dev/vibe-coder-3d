#!/usr/bin/env node

import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

import { NodeIO } from '@gltf-transform/core';
import { draco, prune } from '@gltf-transform/functions';
import admZip from 'adm-zip';
import draco3d from 'draco3dgltf';
import fsExtra from 'fs-extra';
import * as glob from 'glob';

const execAsync = promisify(exec);

// Emoji indicators
const EMOJI = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  PROCESSING: '🔄',
  MODEL: '🧠',
  TEXTURE: '🖼️',
  ANIMATION: '🎭',
  COMPRESSION: '🗜️',
};

const SOURCE_DIR = path.resolve('source_models/fbx');
const DESTINATION_BASE_DIR = path.resolve('public/assets/models');
const TEMP_DIR = path.resolve('temp_model_processing');
const FBX2GLTF_PATH = path.resolve('tools/FBX2glTF-linux-x64');

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
 * @returns {Promise<string>} - Path to the converted GLB file
 */
async function convertFbxToGlb(fbxPath, outputDir, outputName) {
  const outputGlbPath = path.join(outputDir, `${outputName}.glb`);

  console.log(`${EMOJI.PROCESSING} Converting ${fbxPath} to GLB format...`);

  try {
    // Make sure the output directory exists
    await fsExtra.ensureDir(outputDir);

    // FBX2glTF expects the output parameter to be a path without extension
    const outputParam = path.join(outputDir, outputName);

    // Run the FBX2glTF command
    await execAsync(`${FBX2GLTF_PATH} --binary --output "${outputParam}" "${fbxPath}"`);

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
 * Basic GLB file optimization using glTF-Transform
 * @param {string} filePath - Path to the GLB file
 * @returns {Promise<void>}
 */
async function optimizeGlb(filePath) {
  console.log(`${EMOJI.COMPRESSION} Basic optimization for GLB file: ${filePath}`);

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

    // Save the optimized GLB
    await io.write(filePath, document);

    console.log(`${EMOJI.SUCCESS} Successfully optimized ${filePath}`);
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error optimizing GLB file ${filePath}: ${error.message}`);
    // Don't throw the error to allow process to continue
  }
}

/**
 * Basic texture file copy with no compression
 * @param {string} sourcePath - Path to source texture
 * @param {string} destPath - Path to save texture
 * @returns {Promise<string>} - Path to the processed texture
 */
async function processTexture(sourcePath, destPath) {
  console.log(`${EMOJI.TEXTURE} Processing texture: ${path.basename(sourcePath)}`);

  try {
    // Create directory if it doesn't exist
    await fsExtra.ensureDir(path.dirname(destPath));

    // Simply copy the texture file
    await fsExtra.copy(sourcePath, destPath);

    console.log(
      `${EMOJI.SUCCESS} Copied texture: ${path.basename(sourcePath)} → ${path.basename(destPath)}`,
    );
    return destPath;
  } catch (error) {
    console.warn(
      `${EMOJI.ERROR} Error processing texture ${path.basename(sourcePath)}: ${error.message}`,
    );
    return null;
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
  console.log(`\n${EMOJI.MODEL} ========== Processing model: ${modelName} ==========`);

  const sourceModelDir = path.join(SOURCE_DIR, modelName);
  const destModelDir = path.join(DESTINATION_BASE_DIR, modelName);
  const tempModelDir = path.join(TEMP_DIR, modelName);

  // Create destination and temp directories
  await fsExtra.ensureDir(destModelDir);
  await fsExtra.ensureDir(tempModelDir);

  // Create required directory structure
  const destGlbDir = path.join(destModelDir, 'glb');
  const destAnimationsDir = path.join(destModelDir, 'animations');
  const destTexturesDir = path.join(destModelDir, 'textures');

  await fsExtra.ensureDir(destGlbDir);
  await fsExtra.ensureDir(destAnimationsDir);
  await fsExtra.ensureDir(destTexturesDir);

  // Process animations first
  await processAnimations(sourceModelDir, destModelDir, modelName);

  // Look for zip files and unzip them
  const zipPattern = path.join(sourceModelDir, '**', '*.zip');
  const zipFiles = await glob.glob(zipPattern);

  if (zipFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${zipFiles.length} zip file(s) for model: ${modelName}`);

    for (const zipPath of zipFiles) {
      await unzipFile(zipPath, tempModelDir);
    }

    // Process the unzipped files
    const sourceDir = tempModelDir;

    // Handle model files (FBX, GLB, GLTF)
    await processModelFiles(sourceDir, destModelDir, modelName);

    // Handle textures in standard locations or .fbm directories
    await handleTextures(sourceDir, modelName, destTexturesDir);
  } else {
    // No zip files found, process the directory directly
    console.log(
      `${EMOJI.WARNING} No zip files found for model: ${modelName}. Processing directory directly.`,
    );

    // Handle model files (FBX, GLB, GLTF)
    await processModelFiles(sourceModelDir, destModelDir, modelName, ['animations']);

    // Handle textures
    await handleTextures(sourceModelDir, modelName, destTexturesDir);
  }

  console.log(`${EMOJI.SUCCESS} Completed processing for model: ${modelName}`);
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

  // Build the pattern to exclude directories
  let excludePattern = '';
  if (excludeDirs.length > 0) {
    excludePattern = `!(${excludeDirs.join('|')})`;
  } else {
    excludePattern = '*';
  }

  // Find FBX files to convert
  const fbxPattern = path.join(sourceDir, excludePattern, '**', '*.fbx');
  const fbxFiles = await glob.glob(fbxPattern);

  if (fbxFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${fbxFiles.length} FBX file(s) to convert`);

    for (const fbxPath of fbxFiles) {
      const fileName = path.basename(fbxPath);
      const normalizedBaseName = normalizeFileName(path.basename(fileName, '.fbx'), modelName);
      const outputGlbPath = path.join(glbDestDir, `${normalizedBaseName}.glb`);

      // Convert to GLB
      try {
        await convertFbxToGlb(fbxPath, glbDestDir, normalizedBaseName);

        // Optimize the converted GLB file
        if (await fsExtra.pathExists(outputGlbPath)) {
          await optimizeGlb(outputGlbPath);
        }
      } catch (error) {
        console.warn(`${EMOJI.WARNING} Failed to convert ${fbxPath} to GLB.`);
      }
    }
  } else {
    console.log(`${EMOJI.WARNING} No FBX files found to convert`);
  }

  // Copy any existing GLB files directly
  const glbPattern = path.join(sourceDir, excludePattern, '**', '*.glb');
  const glbFiles = await glob.glob(glbPattern);

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
    const fbxAnimationFiles = await glob.glob(path.join(animationsDir, '**', '*.fbx'));

    if (fbxAnimationFiles.length > 0) {
      console.log(
        `${EMOJI.PROCESSING} Found ${fbxAnimationFiles.length} FBX animation file(s) to convert`,
      );

      for (const animPath of fbxAnimationFiles) {
        const fileName = path.basename(animPath);
        const normalizedBaseName = normalizeFileName(path.basename(fileName, '.fbx'), modelName);
        const outputGlbPath = path.join(animationsDestDir, `${normalizedBaseName}.glb`);

        // Convert to GLB
        try {
          await convertFbxToGlb(animPath, animationsDestDir, normalizedBaseName);

          // Optimize the converted animation GLB file
          if (await fsExtra.pathExists(outputGlbPath)) {
            await optimizeGlb(outputGlbPath);
          }
        } catch (error) {
          console.warn(`${EMOJI.WARNING} Failed to convert animation ${animPath} to GLB.`);
        }
      }
    }

    // Copy any existing GLB or GLTF animations
    const otherAnimationFiles = [
      ...(await glob.glob(path.join(animationsDir, '**', '*.glb'))),
      ...(await glob.glob(path.join(animationsDir, '**', '*.gltf'))),
    ];

    if (otherAnimationFiles.length > 0) {
      console.log(
        `${EMOJI.PROCESSING} Found ${otherAnimationFiles.length} GLB/GLTF animation file(s)`,
      );

      for (const animPath of otherAnimationFiles) {
        const fileName = path.basename(animPath);
        const normalizedName = normalizeFileName(fileName, modelName);
        const destPath = path.join(animationsDestDir, normalizedName);

        await fsExtra.copy(animPath, destPath);
        console.log(`${EMOJI.SUCCESS} Copied animation: ${fileName} → ${normalizedName}`);

        // Optimize the copied GLB animation file
        if (path.extname(destPath).toLowerCase() === '.glb') {
          await optimizeGlb(destPath);
        }
      }
    }

    if (fbxAnimationFiles.length === 0 && otherAnimationFiles.length === 0) {
      console.log(`${EMOJI.WARNING} No animation files found`);
    }
  } else {
    console.log(`${EMOJI.WARNING} No animations directory found`);
  }
}

/**
 * Handle texture files for a model
 * @param {string} sourceDir - Source directory to look for textures
 * @param {string} modelName - The name of the model
 * @param {string} texturesDestDir - Destination directory for textures
 */
async function handleTextures(sourceDir, modelName, texturesDestDir) {
  let textureFiles = [];
  let mainTextureFile = null;

  // Look for texture directories with .fbm extension first (these are usually main textures)
  const fbmDir = path.join(sourceDir, `${modelName}.fbm`);

  if (await fsExtra.pathExists(fbmDir)) {
    console.log(`${EMOJI.PROCESSING} Found textures directory: ${fbmDir}`);

    // Use glob to find all texture files
    const texturePattern = path.join(fbmDir, '**', '*.*');
    const fbmTextureFiles = await glob.glob(texturePattern);

    if (fbmTextureFiles.length > 0) {
      // Add these to our collection, and mark the first one as the potential main texture
      textureFiles = [...fbmTextureFiles];
      mainTextureFile = fbmTextureFiles[0];
      console.log(
        `${EMOJI.PROCESSING} Found ${fbmTextureFiles.length} texture file(s) in FBM directory`,
      );
    } else {
      console.log(`${EMOJI.WARNING} No texture files found in ${fbmDir}`);
    }
  }

  // Try to find textures in other locations using glob
  for (const extension of TEXTURE_EXTENSIONS) {
    const pattern = path.join(sourceDir, '**', `*${extension}`);
    const files = await glob.glob(pattern);
    textureFiles = [...textureFiles, ...files];
  }

  if (textureFiles.length > 0) {
    console.log(`${EMOJI.PROCESSING} Found ${textureFiles.length} total texture file(s)`);

    // Filter to find main texture - prefer textures with model name, then largest file
    let mainTexturePath = mainTextureFile;

    // Try to identify the main texture file by looking for specific patterns in filenames
    const namedTextures = textureFiles.filter((file) => {
      const fileName = path.basename(file).toLowerCase();
      return (
        fileName.includes(modelName.toLowerCase()) ||
        fileName.includes('main') ||
        fileName.includes('diffuse') ||
        fileName.includes('albedo')
      );
    });

    if (namedTextures.length > 0) {
      // Use the first texture with a name matching the model
      mainTexturePath = namedTextures[0];
    } else if (!mainTexturePath && textureFiles.length > 0) {
      // If no named texture was found, try to find the largest texture file
      // which is usually the main diffuse/albedo texture
      try {
        const fileSizes = await Promise.all(
          textureFiles.map(async (file) => {
            const stats = await fsExtra.stat(file);
            return { file, size: stats.size };
          }),
        );

        // Sort by size descending
        fileSizes.sort((a, b) => b.size - a.size);
        mainTexturePath = fileSizes[0].file;
      } catch (error) {
        // If there's any error getting file sizes, just use the first texture
        mainTexturePath = textureFiles[0];
      }
    }

    // Process the main texture file
    if (mainTexturePath) {
      const fileName = path.basename(mainTexturePath);
      const normalizedName = normalizeFileName(fileName, modelName);
      const destPath = path.join(texturesDestDir, normalizedName);

      // Process the texture
      await processTexture(mainTexturePath, destPath);
    } else {
      console.log(`${EMOJI.WARNING} No suitable main texture found for model: ${modelName}`);
    }
  } else {
    console.log(`${EMOJI.WARNING} No texture files found for model: ${modelName}`);
  }
}

/**
 * Clean up temporary files
 */
async function cleanup() {
  console.log('\nCleaning up...');

  if (await fsExtra.pathExists(TEMP_DIR)) {
    await fsExtra.remove(TEMP_DIR);
    console.log(`${EMOJI.SUCCESS} Removed temporary directory: ${TEMP_DIR}`);
  }

  console.log('Cleanup completed');
}

/**
 * Main function to process all models
 */
async function main() {
  try {
    console.log('\n=== Basic Model Asset Preparation Tool ===');
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

    // Get all model directories using glob
    const modelDirs = await glob.glob(path.join(SOURCE_DIR, '*/'));

    if (modelDirs.length === 0) {
      console.log(`${EMOJI.WARNING} No models found in source directory`);
      await cleanup();
      return;
    }

    console.log(`${EMOJI.PROCESSING} Found ${modelDirs.length} model directories to process`);

    // Process each model
    for (const modelDir of modelDirs) {
      const modelName = path.basename(modelDir.replace(/\/$/, ''));
      await processModel(modelName);
    }

    // Clean up after processing
    await cleanup();

    console.log(`\n${EMOJI.SUCCESS} All models processed successfully`);
  } catch (error) {
    console.error(`\n${EMOJI.ERROR} An error occurred:`, error);

    // Attempt cleanup even if there was an error
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error(`${EMOJI.ERROR} Error during cleanup:`, cleanupError);
    }

    process.exit(1);
  }
}

// Execute the main function
main();
