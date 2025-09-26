#!/usr/bin/env node

import { watch } from 'fs';
import { readdir, stat, mkdir, copyFile, readFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const sourceDir = join(projectRoot, 'src/game/assets');
const targetDir = join(projectRoot, 'public/assets');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function getFileHash(filePath) {
  try {
    const content = await readFile(filePath);
    return createHash('md5').update(content).digest('hex');
  } catch {
    return null;
  }
}

async function filesAreDifferent(src, dest) {
  try {
    const [srcStats, destStats] = await Promise.all([stat(src), stat(dest)]);

    // Quick check: different modification times
    if (srcStats.mtime.getTime() !== destStats.mtime.getTime()) {
      // Double-check with content hash for accuracy
      const [srcHash, destHash] = await Promise.all([getFileHash(src), getFileHash(dest)]);
      return srcHash !== destHash;
    }

    return false;
  } catch {
    // Destination doesn't exist or other error
    return true;
  }
}

async function copyFileWithDir(src, dest) {
  await ensureDir(dirname(dest));
  await copyFile(src, dest);
}

async function syncDirectory(src, dest, silent = false) {
  try {
    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await ensureDir(destPath);
        await syncDirectory(srcPath, destPath, silent);
      } else {
        const isDifferent = await filesAreDifferent(srcPath, destPath);
        if (isDifferent) {
          await copyFileWithDir(srcPath, destPath);
          if (!silent) console.log(`📋 Synced: ${relative(sourceDir, srcPath)}`);
        } else {
          if (!silent) console.log(`⏭️  Skipped (unchanged): ${relative(sourceDir, srcPath)}`);
        }
      }
    }
  } catch (err) {
    if (!silent) console.error(`Error syncing directory ${src}:`, err.message);
  }
}

async function initialSync(silent = false) {
  if (!silent) console.log('🔄 Initial asset sync...');
  await ensureDir(targetDir);
  await syncDirectory(sourceDir, targetDir, silent);
  if (!silent) console.log('✅ Initial sync complete');
}

function startWatcher(silent = false) {
  if (!silent) console.log('👀 Watching for asset changes...');

  const watcher = watch(sourceDir, { recursive: true }, async (eventType, filename) => {
    if (!filename) return;

    const srcPath = join(sourceDir, filename);
    const destPath = join(targetDir, filename);

    try {
      if (eventType === 'rename' || eventType === 'change') {
        try {
          const stats = await stat(srcPath);
          if (stats.isFile()) {
            const isDifferent = await filesAreDifferent(srcPath, destPath);
            if (isDifferent) {
              await copyFileWithDir(srcPath, destPath);
              if (!silent) console.log(`📋 Synced: ${filename}`);
            } else {
              if (!silent) console.log(`⏭️  Skipped (unchanged): ${filename}`);
            }
          }
        } catch (err) {
          // File might have been deleted
          if (!silent) console.log(`🗑️  Detected deletion: ${filename}`);
        }
      }
    } catch (err) {
      if (!silent) console.error(`Error handling ${filename}:`, err.message);
    }
  });

  process.on('SIGINT', () => {
    if (!silent) console.log('\n👋 Stopping asset watcher...');
    watcher.close();
    process.exit(0);
  });
}

async function main() {
  const isOnceMode = process.argv.includes('--once');
  const isSilent = process.argv.includes('--silent');

  if (isOnceMode) {
    if (!isSilent) console.log('🚀 Running one-time asset sync...');
    await initialSync(isSilent);
    if (!isSilent) console.log('✅ Asset sync complete');
  } else {
    if (!isSilent) console.log('🚀 Starting asset sync service...');
    await initialSync(isSilent);
    startWatcher(isSilent);
  }
}

main().catch(console.error);
