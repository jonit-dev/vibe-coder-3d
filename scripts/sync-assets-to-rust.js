#!/usr/bin/env node
/**
 * Intelligent Asset Sync for Rust Engine
 *
 * Syncs models and textures from public/assets to rust/game/assets
 * only when files are newer or don't exist in the destination.
 *
 * Usage:
 *   node scripts/sync-assets-to-rust.js [--force] [--dry-run] [--verbose]
 */

import { readdir, stat, mkdir, copyFile, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Sync configurations for different directories
const syncConfigs = [
  {
    name: 'assets',
    sourceDir: join(projectRoot, 'public/assets'),
    destDir: join(projectRoot, 'rust/game/assets'),
    excludePaths: [],
  },
  {
    name: 'geometry',
    sourceDir: join(projectRoot, 'src/game/geometry'),
    destDir: join(projectRoot, 'rust/game/geometry'),
    excludePaths: [],
  },
  {
    name: 'scenes',
    sourceDir: join(projectRoot, 'src/game/scenes'),
    destDir: join(projectRoot, 'rust/game/scenes'),
    // Exclude test scenes - these are maintained manually for visual engine tests
    excludePaths: ['tests'],
  },
];

const cacheFile = join(projectRoot, 'rust/game', '.sync-cache.json');

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const isVerbose = args.includes('--verbose') || args.includes('-v');
const isSilent = args.includes('--silent') || args.includes('-s');

// Asset extensions to sync
const ASSET_EXTENSIONS = new Set([
  '.glb',
  '.gltf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.hdr',
  '.exr',
  '.json', // Include JSON for geometry files
]);

// Load sync cache
async function loadCache() {
  try {
    if (existsSync(cacheFile)) {
      const content = await readFile(cacheFile, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    if (isVerbose) {
      console.warn('⚠️  Failed to load cache, will do full sync');
    }
  }
  return { files: {} };
}

async function saveCache(cache) {
  if (!isDryRun) {
    await ensureDir(dirname(cacheFile));
    await writeFile(cacheFile, JSON.stringify(cache, null, 2));
  }
}

// Calculate file hash for change detection
async function getFileHash(filePath) {
  const content = await readFile(filePath);
  return createHash('md5').update(content).digest('hex');
}

// Get file stats
async function getFileInfo(filePath) {
  const stats = await stat(filePath);
  return {
    size: stats.size,
    mtime: stats.mtime.getTime(),
  };
}

// Recursively find all asset files
async function findAssetFiles(dir, baseDir = dir, excludePaths = []) {
  let files = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);

      // Skip excluded paths
      if (excludePaths.some((excludePath) => relativePath.startsWith(excludePath))) {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(await findAssetFiles(fullPath, baseDir, excludePaths));
      } else if (entry.isFile()) {
        // Only sync assets with recognized extensions
        const ext = extname(entry.name).toLowerCase();
        if (ASSET_EXTENSIONS.has(ext)) {
          files.push(relativePath);
        }
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dir}: ${e.message}`);
  }

  return files;
}

// Ensure directory exists
async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    if (!isDryRun) {
      await mkdir(dirPath, { recursive: true });
    }
  }
}

// Format bytes for human-readable output
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Find files to delete (exist in dest but not in source)
async function findOrphanedFiles(sourceDir, destDir, excludePaths = []) {
  const orphaned = [];

  if (!existsSync(destDir)) {
    return orphaned;
  }

  const sourceFiles = new Set(await findAssetFiles(sourceDir, sourceDir, excludePaths));
  const destFiles = await findAssetFiles(destDir, destDir, excludePaths);

  for (const destFile of destFiles) {
    // For scenes directory: .json files in dest may correspond to .tsx files in source
    const isSceneDir = sourceDir.includes('scenes') && destDir.includes('scenes');
    if (isSceneDir && destFile.endsWith('.json')) {
      // Check if there's a corresponding .tsx file in source (check filesystem directly)
      const baseName = destFile.replace(/\.json$/, '');
      const tsxFilePath = join(sourceDir, `${baseName}.tsx`);
      if (existsSync(tsxFilePath)) {
        // This JSON has a corresponding TSX source file, don't delete it
        continue;
      }
    }

    if (!sourceFiles.has(destFile)) {
      orphaned.push(join(destDir, destFile));
    }
  }

  return orphaned;
}

// Sync a single directory
async function syncDirectory(config, cache) {
  const { name, sourceDir, destDir, excludePaths = [] } = config;
  if (!isSilent) {
    console.log(
      `🔄 Syncing ${name} from ${relative(projectRoot, sourceDir)} to ${relative(projectRoot, destDir)}...\n`,
    );
    if (excludePaths.length > 0) {
      console.log(`   Excluding: ${excludePaths.join(', ')}\n`);
    }
  }

  const sourceFiles = await findAssetFiles(sourceDir, sourceDir, excludePaths);

  const stats = {
    copied: 0,
    skipped: 0,
    unchanged: 0,
    deleted: 0,
    errors: 0,
    totalSize: 0,
  };

  for (const relativePath of sourceFiles) {
    const sourcePath = join(sourceDir, relativePath);
    const destPath = join(destDir, relativePath);

    try {
      const sourceInfo = await getFileInfo(sourcePath);
      const cacheKey = relativePath;
      const cachedInfo = cache.files[cacheKey];

      // Check if we need to copy
      let shouldCopy = isForce;
      let reason = '';

      if (!shouldCopy && !existsSync(destPath)) {
        shouldCopy = true;
        reason = 'new file';
      } else if (!shouldCopy && cachedInfo) {
        // Check if source changed since last sync
        if (sourceInfo.mtime > cachedInfo.mtime || sourceInfo.size !== cachedInfo.size) {
          shouldCopy = true;
          reason = 'source modified';
        }
      } else if (!shouldCopy && !cachedInfo && existsSync(destPath)) {
        // No cache entry, check file directly
        const destInfo = await getFileInfo(destPath);
        if (sourceInfo.mtime > destInfo.mtime || sourceInfo.size !== destInfo.size) {
          shouldCopy = true;
          reason = 'not in sync';
        }
      }

      if (shouldCopy) {
        if (isVerbose || isDryRun) {
          console.log(`  📄 ${relativePath} ${reason ? `(${reason})` : ''}`);
        }

        if (!isDryRun) {
          await ensureDir(dirname(destPath));

          // For GLB/GLTF files, dequantize to remove KHR_mesh_quantization
          // (Rust gltf crate doesn't support it, but Three.js does)
          const ext = extname(relativePath).toLowerCase();
          if (ext === '.glb' || ext === '.gltf') {
            try {
              const { execSync } = await import('child_process');
              // Use gltf-transform to remove quantization
              execSync(`npx --yes @gltf-transform/cli dequantize "${sourcePath}" "${destPath}"`, {
                stdio: 'pipe',
              });
              if (isVerbose) {
                console.log(`    🔧 Dequantized for Rust compatibility`);
              }
            } catch (e) {
              // If dequantization fails, just copy the file
              console.warn(`    ⚠️  Dequantization failed, copying as-is: ${e.message}`);
              await copyFile(sourcePath, destPath);
            }
          } else {
            await copyFile(sourcePath, destPath);
          }
        }

        // Update cache
        cache.files[cacheKey] = {
          ...sourceInfo,
          syncedAt: Date.now(),
        };

        stats.copied++;
        stats.totalSize += sourceInfo.size;
      } else {
        if (isVerbose) {
          console.log(`  ✓ ${relativePath} (unchanged)`);
        }
        stats.unchanged++;
      }
    } catch (e) {
      console.error(`  ❌ Failed to sync ${relativePath}: ${e.message}`);
      stats.errors++;
    }
  }

  // Delete orphaned files (files in dest that no longer exist in source)
  const orphanedFiles = await findOrphanedFiles(sourceDir, destDir, excludePaths);
  for (const orphanedPath of orphanedFiles) {
    const relativePath = relative(destDir, orphanedPath);
    if (isVerbose || isDryRun) {
      console.log(`  🗑️  ${relativePath} (deleted from source)`);
    }

    if (!isDryRun) {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(orphanedPath);
        stats.deleted++;
      } catch (e) {
        console.error(`  ❌ Failed to delete ${relativePath}: ${e.message}`);
        stats.errors++;
      }
    } else {
      stats.deleted++;
    }
  }

  // Print summary
  if (!isSilent) {
    console.log('\n📊 Summary:');
    if (isDryRun) {
      console.log('  Mode: DRY RUN (no files were actually copied or deleted)');
    }
    console.log(`  ✅ Copied: ${stats.copied} files (${formatBytes(stats.totalSize)})`);
    console.log(`  ⏭️  Unchanged: ${stats.unchanged} files`);
    if (stats.deleted > 0) {
      console.log(`  🗑️  Deleted: ${stats.deleted} files`);
    }
    if (stats.errors > 0) {
      console.log(`  ❌ Errors: ${stats.errors}`);
    }
    console.log('');
  }

  return stats;
}

// Main sync function
async function syncAssets() {
  const cache = await loadCache();

  const allStats = {
    copied: 0,
    unchanged: 0,
    deleted: 0,
    errors: 0,
    totalSize: 0,
  };

  for (const config of syncConfigs) {
    const stats = await syncDirectory(config, cache);
    allStats.copied += stats.copied;
    allStats.unchanged += stats.unchanged;
    allStats.deleted += stats.deleted;
    allStats.errors += stats.errors;
    allStats.totalSize += stats.totalSize;
  }

  // Clean up cache entries for files that no longer exist in any config
  const allValidKeys = new Set();
  for (const config of syncConfigs) {
    const sourceFiles = await findAssetFiles(
      config.sourceDir,
      config.sourceDir,
      config.excludePaths || [],
    );
    sourceFiles.forEach((file) => allValidKeys.add(file));
  }

  for (const key of Object.keys(cache.files)) {
    if (!allValidKeys.has(key)) {
      if (isVerbose) {
        console.log(`  🗑️  Removing cache entry for deleted file: ${key}`);
      }
      delete cache.files[key];
    }
  }

  await saveCache(cache);

  if (!isSilent) {
    console.log('🎉 All syncs complete!\n');
    console.log('📊 Total Summary:');
    console.log(`  ✅ Copied: ${allStats.copied} files (${formatBytes(allStats.totalSize)})`);
    console.log(`  ⏭️  Unchanged: ${allStats.unchanged} files`);
    if (allStats.deleted > 0) {
      console.log(`  🗑️  Deleted: ${allStats.deleted} files`);
    }
    if (allStats.errors > 0) {
      console.log(`  ❌ Errors: ${allStats.errors}`);
    }
    console.log('');
  }

  return allStats.errors === 0 ? 0 : 1;
}

// Run sync
syncAssets()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
