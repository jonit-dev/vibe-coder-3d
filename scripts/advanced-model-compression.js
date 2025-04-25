#!/usr/bin/env node

import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRTextureBasisu } from '@gltf-transform/extensions';
import { draco, prune } from '@gltf-transform/functions';
import admZip from 'adm-zip';
import { exec } from 'child_process';
import draco3d from 'draco3dgltf';
import fsExtra from 'fs-extra';
import * as glob from 'glob';
import path from 'path';
import { promisify } from 'util';

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
const KTX_TOOLS_PATH = 'ktx'; // Command-line tools (assume in PATH)

// Texture optimization settings
const MAX_TEXTURE_SIZE = 1024; // Maximum texture dimension (width or height)
const TEXTURE_QUALITY = 80; // JPEG quality (0-100)

// Supported model formats
const MODEL_EXTENSIONS = ['.fbx', '.glb', '.gltf'];
// Supported texture formats
const TEXTURE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tga', '.bmp', '.tif', '.tiff', '.dds'];

// Array to store paths of original textures to clean up
const texturesToCleanup = [];

/**
 * Check if texture tools are available
 * @returns {Promise<boolean>} True if tools are available
 */
async function checkTextureToolsAvailable() {
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

    // Run the FBX2glTF command - note we use --output instead of --output-path and --output-file
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
 * Optimize a GLB file using glTF-Transform
 * @param {string} filePath - Path to the GLB file
 * @returns {Promise<void>}
 */
async function optimizeGlb(filePath) {
  console.log(`${EMOJI.COMPRESSION} Optimizing GLB file: ${filePath}`);

  try {
    // Check if gltf-transform CLI is available
    if (await checkTextureToolsAvailable()) {
      try {
        console.log(
          `${EMOJI.COMPRESSION} Applying advanced GLB optimization with gltf-transform...`,
        );

        // Step 1: Apply UASTC texture compression first (higher quality for normal maps and textures)
        const tempFilePath = `${filePath}.temp.glb`;
        await execAsync(
          `npx gltf-transform uastc "${filePath}" "${tempFilePath}" --level 2 --rdo --zstd 18 --verbose`,
        );

        // Step 2: Apply Draco compression
        await execAsync(`npx gltf-transform draco "${tempFilePath}" "${filePath}" --verbose`);

        // Step 3: Final optimization pass
        await execAsync(
          `npx gltf-transform dedup "${filePath}" "${tempFilePath}" --verbose && ` +
            `npx gltf-transform weld "${tempFilePath}" "${filePath}" --verbose`,
        );

        // Clean up temp file
        if (await fsExtra.pathExists(tempFilePath)) {
          await fsExtra.remove(tempFilePath);
        }

        // Report compression results
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

    // Original optimization as fallback
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

    // Prune unused nodes/materials/etc
    await document.transform(prune());

    // Apply draco compression
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
 * Convert texture to KTX2 format using gltf-transform CLI
 * @param {string} sourcePath - Path to source texture
 * @param {string} destPath - Path to save KTX2 texture
 * @returns {Promise<boolean>} - True if successful
 */
async function convertTextureToKtx2(sourcePath, destPath) {
  console.log(`${EMOJI.TEXTURE} Converting texture to KTX2: ${path.basename(sourcePath)}`);

  try {
    // Ensure output directory exists
    await fsExtra.ensureDir(path.dirname(destPath));

    // For direct texture conversion, create a temporary glTF with the texture
    const tempDir = path.join(path.dirname(destPath), 'temp_conversion');
    const tempGltfPath = path.join(tempDir, 'temp.gltf');
    const tempOutputPath = path.join(tempDir, 'temp_output.gltf');

    await fsExtra.ensureDir(tempDir);

    // Create a simple glTF with the texture
    const textureName = path.basename(sourcePath);
    const textureContent = {
      asset: { version: '2.0' },
      images: [{ uri: textureName }],
      textures: [{ source: 0 }],
      materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
      meshes: [{ primitives: [{ material: 0 }] }],
      nodes: [{ mesh: 0 }],
      scene: 0,
      scenes: [{ nodes: [0] }],
    };

    await fsExtra.writeJSON(tempGltfPath, textureContent);
    await fsExtra.copy(sourcePath, path.join(tempDir, textureName));

    // Apply UASTC compression with gltf-transform
    const textureCmd = `npx gltf-transform uastc "${tempGltfPath}" "${tempOutputPath}" --level 2 --rdo --zstd 18 --verbose`;
    console.log(`${EMOJI.PROCESSING} Running: ${textureCmd}`);
    await execAsync(textureCmd);

    // Now copy the resulting KTX2 texture
    const ktx2Files = await glob.glob(path.join(tempDir, '*.ktx2'));
    if (ktx2Files.length > 0) {
      await fsExtra.copy(ktx2Files[0], destPath);

      // Calculate compression ratio
      const sourceSize = (await fsExtra.stat(sourcePath)).size;
      const destSize = (await fsExtra.stat(destPath)).size;
      const ratio = ((destSize / sourceSize) * 100).toFixed(2);

      console.log(`${EMOJI.SUCCESS} Successfully converted to KTX2: ${path.basename(destPath)}`);
      console.log(`  Source size: ${(sourceSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Output size: ${(destSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Ratio: ${ratio}% (${100 - ratio}% reduction)`);

      // Clean up temporary files
      await fsExtra.remove(tempDir);
      return true;
    }

    throw new Error('KTX2 file was not generated');
  } catch (error) {
    console.warn(`${EMOJI.WARNING} Failed to convert texture to KTX2: ${error.message}`);
    return false;
  }
}

/**
 * Optimize texture file
 * @param {string} sourcePath - Path to source texture
 * @param {string} destPath - Path to save optimized texture
 * @returns {Promise<string>} - Path to the optimized texture
 */
async function optimizeTexture(sourcePath, destPath) {
  console.log(`${EMOJI.TEXTURE} Optimizing texture: ${path.basename(sourcePath)}`);

  try {
    // Create directory if it doesn't exist
    await fsExtra.ensureDir(path.dirname(destPath));

    // Also create KTX2 version if texture tools are available
    let ktx2Created = false;
    let originalTexturePath = destPath; // Store the intended path for the original file format
    if (await checkTextureToolsAvailable()) {
      const ktx2Path = destPath.replace(/\.\w+$/, '.ktx2');
      const success = await convertTextureToKtx2(sourcePath, ktx2Path);

      // If KTX2 conversion was successful, mark for cleanup
      if (success) {
        texturesToCleanup.push(originalTexturePath); // Add the original .png/.jpg path for cleanup
        ktx2Created = true;
        console.log(
          `${EMOJI.PROCESSING} Marked for cleanup: ${path.basename(originalTexturePath)}`,
        );
      } else {
        // If KTX2 failed, keep the original texture
        await fsExtra.copy(sourcePath, originalTexturePath);
        console.warn(
          `${EMOJI.WARNING} KTX2 conversion failed, keeping original texture: ${path.basename(originalTexturePath)}`,
        );
      }
    } else {
      // If tools not available, copy the original texture
      await fsExtra.copy(sourcePath, originalTexturePath);
    }

    if (ktx2Created) {
      console.log(
        `${EMOJI.SUCCESS} Processed texture: ${path.basename(sourcePath)} → ${path.basename(destPath).replace(/\.\w+$/, '.ktx2')}`,
      );
      return destPath.replace(/\.\w+$/, '.ktx2'); // Return the KTX2 path
    } else {
      console.log(
        `${EMOJI.SUCCESS} Copied original texture: ${path.basename(sourcePath)} → ${path.basename(originalTexturePath)}`,
      );
      return originalTexturePath; // Return original texture path if KTX2 failed or wasn't created
    }
  } catch (error) {
    console.warn(
      `${EMOJI.ERROR} Error processing texture ${path.basename(sourcePath)}: ${error.message}`,
    );
    // Fallback to copy on error
    await fsExtra.copy(sourcePath, destPath); // Use destPath here as originalTexturePath might not be defined
    return destPath;
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
      `${EMOJI.PROCESSING} No zip files found for model: ${modelName}. Processing directory directly.`,
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

  // Combine both sets of files
  const fbxFiles = [...rootFbxFiles, ...subDirFbxFiles];

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
        console.warn(`${EMOJI.WARNING} Failed to convert ${fbxPath} to GLB: ${error.message}`);
      }
    }
  } else {
    console.log(`${EMOJI.WARNING} No FBX files found to convert in ${sourceDir}`);
  }

  // Copy any existing GLB files directly - using the same pattern approach as above
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

  const glbFiles = [...rootGlbFiles, ...subDirGlbFiles];

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
          console.warn(
            `${EMOJI.WARNING} Failed to convert animation ${animPath} to GLB: ${error.message}`,
          );
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
 * Get MIME type from file path
 * @param {string} filePath - Path to the file
 * @returns {string} - MIME type
 */
function getMimeTypeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/png';
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

  // Also look for textures directory (non-fbm)
  const texturesDir = path.join(sourceDir, 'textures');
  if (await fsExtra.pathExists(texturesDir)) {
    console.log(`${EMOJI.PROCESSING} Found standard textures directory: ${texturesDir}`);

    // Use glob to find all texture files
    for (const extension of TEXTURE_EXTENSIONS) {
      const pattern = path.join(texturesDir, '**', `*${extension}`);
      const files = await glob.glob(pattern);
      textureFiles = [...textureFiles, ...files];
    }

    if (textureFiles.length > 0 && !mainTextureFile) {
      mainTextureFile = textureFiles[0];
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

    // Only copy the main texture file
    if (mainTexturePath) {
      const fileName = path.basename(mainTexturePath);
      const normalizedName = normalizeFileName(fileName, modelName);
      const destPath = path.join(texturesDestDir, normalizedName);

      // Replace the copy with optimize
      await optimizeTexture(mainTexturePath, destPath);
      console.log(`${EMOJI.SUCCESS} Processed main texture: ${fileName} → ${normalizedName}`);
    } else {
      console.log(`${EMOJI.WARNING} No suitable main texture found for model: ${modelName}`);
    }
  } else {
    console.log(`${EMOJI.WARNING} No texture files found for model: ${modelName}`);
  }
}

/**
 * Clean up temporary files and optionally original textures
 */
async function cleanup() {
  console.log('\nCleaning up...');

  // Always clean up original textures if they were successfully converted
  if (texturesToCleanup.length > 0) {
    console.log(`
${EMOJI.PROCESSING} Cleaning up ${texturesToCleanup.length} original texture files...`);
    for (const texturePath of texturesToCleanup) {
      try {
        if (await fsExtra.pathExists(texturePath)) {
          await fsExtra.remove(texturePath);
          console.log(`${EMOJI.SUCCESS} Removed: ${path.basename(texturePath)}`);
        } else {
          // This might happen if the original copy failed but KTX2 somehow succeeded
          console.log(
            `${EMOJI.WARNING} Original texture not found for cleanup: ${path.basename(texturePath)}`,
          );
        }
      } catch (cleanupError) {
        console.warn(
          `${EMOJI.ERROR} Failed to remove ${path.basename(texturePath)}: ${cleanupError.message}`,
        );
      }
    }
  }

  console.log('\nCleaning up temporary files...');

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
    console.log('\n=== Model Asset Preparation Tool ===');
    console.log(`Source directory: ${SOURCE_DIR}`);
    console.log(`Destination directory: ${DESTINATION_BASE_DIR}`);
    console.log('====================================\n');

    // Check if texture tools are available
    const textureAvailable = await checkTextureToolsAvailable();
    if (textureAvailable) {
      console.log(
        `${EMOJI.SUCCESS} gltf-transform CLI found. Texture compression to KTX2 format is enabled.`,
      );
    }

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
