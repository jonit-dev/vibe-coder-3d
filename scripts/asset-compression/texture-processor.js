import fsExtra from 'fs-extra';
import * as glob from 'glob';
import path from 'path';
import {
  EMOJI,
  TEXTURE_EXTENSIONS,
  execAsync,
  normalizeFileName,
} from './prepare-assets-common.js';

/**
 * Find all texture files for a model by searching common locations
 * @param {string} sourceDir - Source directory to look for textures
 * @param {string} modelName - The name of the model
 * @returns {Promise<Array<string>>} - Array of texture file paths with no duplicates
 */
export async function findModelTextures(sourceDir, modelName) {
  console.log(`${EMOJI.PROCESSING} Looking for textures for model: ${modelName}`);

  // Track textures by their basename to avoid duplicates
  const textureMap = new Map();

  // Try to find textures in these common locations
  const textureSearchLocations = [
    // FBM directory (common with some 3D apps)
    path.join(sourceDir, `${modelName}.fbm`),
    // Standard textures directory
    path.join(sourceDir, 'textures'),
    // Root source directory
    sourceDir,
  ];

  // Search each location for texture files
  for (const searchLocation of textureSearchLocations) {
    if (await fsExtra.pathExists(searchLocation)) {
      console.log(`${EMOJI.PROCESSING} Searching for textures in: ${searchLocation}`);

      // Find all texture files in this location
      for (const extension of TEXTURE_EXTENSIONS) {
        const pattern = path.join(searchLocation, `**/*${extension}`);
        const files = await glob.glob(pattern);

        if (files.length > 0) {
          console.log(
            `${EMOJI.PROCESSING} Found ${files.length} ${extension} texture(s) in ${searchLocation}`,
          );

          // Process each file and track by basename to avoid duplicates
          for (const file of files) {
            const fileName = path.basename(file);
            const normalizedName = normalizeFileName(fileName, modelName);

            // If we haven't seen this texture before or this one is in a preferred location,
            // add it to our map (prefer FBM, then textures dir, then root)
            const existingPath = textureMap.get(normalizedName);
            if (!existingPath) {
              textureMap.set(normalizedName, file);
            } else {
              // Prioritize textures from .fbm directory
              const currentPath = file;
              const currentInFbm = currentPath.includes(`${modelName}.fbm`);
              const existingInFbm = existingPath.includes(`${modelName}.fbm`);

              if (currentInFbm && !existingInFbm) {
                // Current path is in FBM but existing is not, prefer current
                textureMap.set(normalizedName, currentPath);
              } else if (currentPath.includes('/textures/') && !existingInFbm) {
                // Current is in textures dir and existing is not in FBM, prefer current
                textureMap.set(normalizedName, currentPath);
              }
            }
          }
        }
      }
    }
  }

  // Convert map back to array of file paths
  return Array.from(textureMap.values());
}

/**
 * Process a texture file with optional KTX2 conversion
 * @param {string} sourcePath - Path to source texture
 * @param {string} destPath - Path to save texture
 * @param {boolean} useKtx2 - Whether to use KTX2 conversion
 * @returns {Promise<{path: string, isKtx2: boolean}>} - Path to the processed texture and format flag
 */
export async function processTexture(sourcePath, destPath, useKtx2 = false) {
  console.log(`${EMOJI.TEXTURE} Processing texture: ${path.basename(sourcePath)}`);

  try {
    // Create directory if it doesn't exist
    await fsExtra.ensureDir(path.dirname(destPath));

    // If KTX2 compression is requested and tools are available
    if (useKtx2) {
      try {
        const ktx2Path = destPath.replace(/\.\w+$/, '.ktx2');
        const success = await convertTextureToKtx2(sourcePath, ktx2Path);

        if (success) {
          console.log(
            `${EMOJI.SUCCESS} Converted texture to KTX2: ${path.basename(sourcePath)} → ${path.basename(ktx2Path)}`,
          );
          return { path: ktx2Path, isKtx2: true };
        }
      } catch (ktxError) {
        console.warn(`${EMOJI.WARNING} KTX2 conversion failed: ${ktxError.message}`);
      }
    }

    // Fallback to standard copy
    await fsExtra.copy(sourcePath, destPath);
    console.log(
      `${EMOJI.SUCCESS} Copied texture: ${path.basename(sourcePath)} → ${path.basename(destPath)}`,
    );
    return { path: destPath, isKtx2: false };
  } catch (error) {
    console.warn(
      `${EMOJI.ERROR} Error processing texture ${path.basename(sourcePath)}: ${error.message}`,
    );
    return null;
  }
}

/**
 * Convert texture to KTX2 format
 * @param {string} sourcePath - Path to source texture
 * @param {string} destPath - Path to save KTX2 texture
 * @returns {Promise<boolean>} - True if conversion was successful
 */
export async function convertTextureToKtx2(sourcePath, destPath) {
  console.log(`${EMOJI.TEXTURE} Converting texture to KTX2: ${path.basename(sourcePath)}`);

  try {
    // Ensure output directory exists
    await fsExtra.ensureDir(path.dirname(destPath));

    // For direct texture conversion, use gltf-transform
    const cmd = `npx gltf-transform ktx2 "${sourcePath}" "${destPath}" --power-of-two --level 1 --verbose`;
    await execAsync(cmd);

    // Check if the file was created
    if (await fsExtra.pathExists(destPath)) {
      const originalSize = (await fsExtra.stat(sourcePath)).size;
      const compressedSize = (await fsExtra.stat(destPath)).size;
      const ratio = ((compressedSize / originalSize) * 100).toFixed(2);

      console.log(`${EMOJI.SUCCESS} KTX2 compression: ${ratio}% of original size`);
      return true;
    }

    return false;
  } catch (error) {
    console.warn(`${EMOJI.WARNING} KTX2 conversion failed: ${error.message}`);
    return false;
  }
}
