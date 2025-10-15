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
const sourceDir = join(projectRoot, 'public/assets');
const destDir = join(projectRoot, 'rust/game/assets');
const cacheFile = join(destDir, '.sync-cache.json');

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const isVerbose = args.includes('--verbose') || args.includes('-v');

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
async function findAssetFiles(dir, baseDir = dir) {
  let files = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        files = files.concat(await findAssetFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        // Only sync assets with recognized extensions
        const ext = extname(entry.name).toLowerCase();
        if (ASSET_EXTENSIONS.has(ext)) {
          files.push(relative(baseDir, fullPath));
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

// Sync assets
async function syncAssets() {
  console.log('🔄 Syncing assets from public/assets to rust/game/assets...\n');

  const cache = await loadCache();
  const sourceFiles = await findAssetFiles(sourceDir);

  const stats = {
    copied: 0,
    skipped: 0,
    unchanged: 0,
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
          await copyFile(sourcePath, destPath);
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

  // Clean up cache entries for files that no longer exist
  const validKeys = new Set(sourceFiles);
  for (const key of Object.keys(cache.files)) {
    if (!validKeys.has(key)) {
      if (isVerbose) {
        console.log(`  🗑️  Removing cache entry for deleted file: ${key}`);
      }
      delete cache.files[key];
    }
  }

  await saveCache(cache);

  // Print summary
  console.log('\n📊 Sync Summary:');
  if (isDryRun) {
    console.log('  Mode: DRY RUN (no files were actually copied)');
  }
  console.log(`  ✅ Copied: ${stats.copied} files (${formatBytes(stats.totalSize)})`);
  console.log(`  ⏭️  Unchanged: ${stats.unchanged} files`);
  if (stats.errors > 0) {
    console.log(`  ❌ Errors: ${stats.errors}`);
  }
  console.log('');

  return stats.errors === 0 ? 0 : 1;
}

// Run sync
syncAssets()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
