/**
 * Vite Plugin: Model Ingest API
 * Handles model upload and optimization during development
 */

import { mkdir, writeFile, stat } from 'fs/promises';
import { basename, extname, join } from 'path';
import { spawn } from 'child_process';
import type { Plugin } from 'vite';

const MODELS_DIR = join(process.cwd(), 'public/assets/models');

function sanitizeModelName(name: string): string {
  return name
    .replace(/[^\w-.]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

function runOptimizeForModel(modelDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'node',
      [join(process.cwd(), 'scripts', 'optimize-models.js'), '--silent', '--force'],
      {
        cwd: process.cwd(),
        env: { ...process.env, MODELS_DIR: join('public', 'assets', 'models', modelDir) },
        stdio: 'inherit',
      },
    );

    child.on('error', (err) => reject(err));
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`optimize-models exited with code ${code}`));
    });
  });
}

/**
 * Parse multipart/form-data (simple version for single file)
 */
async function parseMultipart(
  req: import('http').IncomingMessage,
): Promise<{ file?: Buffer; modelName?: string; filename?: string }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type']?.split('boundary=')[1];

        if (!boundary) {
          return reject(new Error('No boundary in multipart request'));
        }

        const parts = buffer.toString('binary').split(`--${boundary}`);
        let file: Buffer | undefined;
        let modelName: string | undefined;
        let filename: string | undefined;

        for (const part of parts) {
          if (part.includes('Content-Disposition')) {
            const nameMatch = part.match(/name="([^"]+)"/);
            const filenameMatch = part.match(/filename="([^"]+)"/);

            if (filenameMatch) {
              // This is the file
              filename = filenameMatch[1];
              const dataStart = part.indexOf('\r\n\r\n') + 4;
              const dataEnd = part.lastIndexOf('\r\n');
              file = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
            } else if (nameMatch && nameMatch[1] === 'modelName') {
              // This is the modelName field
              const dataStart = part.indexOf('\r\n\r\n') + 4;
              const dataEnd = part.lastIndexOf('\r\n');
              modelName = part.substring(dataStart, dataEnd).trim();
            }
          }
        }

        resolve({ file, modelName, filename });
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export function vitePluginModelIngest(): Plugin {
  return {
    name: 'vite-plugin-model-ingest',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/ingest/model' || req.method !== 'POST') {
          return next();
        }

        try {
          const { file, modelName, filename } = await parseMultipart(req);

          if (!file || !filename) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing file' }));
            return;
          }

          const fileExt = extname(filename).toLowerCase();
          if (!['.glb', '.gltf', '.fbx', '.obj'].includes(fileExt)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Unsupported file type' }));
            return;
          }

          const baseNoExt = basename(filename, fileExt);
          const modelDirName = sanitizeModelName(modelName || baseNoExt);
          const targetDir = join(MODELS_DIR, modelDirName);
          const sourcePath = join(targetDir, `${baseNoExt}.glb`);

          await ensureDir(targetDir);
          await writeFile(sourcePath, file);

          // Run optimization
          await runOptimizeForModel(modelDirName);

          // Verify all outputs exist before returning
          const glbPath = join(targetDir, 'glb', `${baseNoExt}.glb`);
          const highPath = join(targetDir, 'lod', `${baseNoExt}.high_fidelity.glb`);
          const lowPath = join(targetDir, 'lod', `${baseNoExt}.low_fidelity.glb`);

          await stat(glbPath);
          await stat(highPath);
          await stat(lowPath);

          // Small delay to ensure Vite dev server has picked up the new files
          await new Promise((resolve) => setTimeout(resolve, 100));

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              name: modelDirName,
              basePath: `/assets/models/${modelDirName}/glb/${baseNoExt}.glb`,
              lod: {
                high_fidelity: `/assets/models/${modelDirName}/lod/${baseNoExt}.high_fidelity.glb`,
                low_fidelity: `/assets/models/${modelDirName}/lod/${baseNoExt}.low_fidelity.glb`,
              },
            }),
          );
        } catch (err) {
          console.error('[vite-plugin-model-ingest] Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Ingest failed',
            }),
          );
        }
      });
    },
  };
}
