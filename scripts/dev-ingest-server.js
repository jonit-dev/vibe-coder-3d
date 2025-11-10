#!/usr/bin/env node
import { spawn } from 'child_process';
import cors from 'cors';
import express from 'express';
import { mkdir, stat, writeFile } from 'fs/promises';
import multer from 'multer';
import { basename, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
});

app.use(
  cors({
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    methods: ['POST', 'OPTIONS'],
  }),
);

function toModelDirName(name) {
  // Preserve casing; replace spaces and invalid chars
  return name
    .replace(/[^\w\-\.]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

function runOptimizeForModel(modelDir) {
  return new Promise((resolve, reject) => {
    // Optimize only inside this model directory via MODELS_DIR env to keep it fast
    const child = spawn(
      'node',
      [join(projectRoot, 'scripts', 'optimize-models.js'), '--silent', '--force'],
      {
        cwd: projectRoot,
        env: { ...process.env, MODELS_DIR: join('public', 'assets', 'models', modelDir) },
        stdio: 'inherit',
      },
    );

    child.on('error', (err) => reject(err));
    child.on('exit', (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`optimize-models exited with code ${code}`));
    });
  });
}

app.post('/api/ingest/model', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Missing file');
    }

    const providedName = (req.body?.modelName || '').toString();
    const original = req.file.originalname || 'Model.glb';
    const fileExt = extname(original).toLowerCase();
    if (!['.glb', '.gltf', '.fbx', '.obj'].includes(fileExt)) {
      return res.status(400).send('Unsupported file type. Please upload .glb/.gltf/.fbx/.obj');
    }

    const baseNoExt = basename(original, fileExt);
    const modelDirName = toModelDirName(providedName || baseNoExt);
    const targetDir = join(projectRoot, 'public', 'assets', 'models', modelDirName);
    const sourcePath = join(targetDir, `${baseNoExt}.glb`);

    // Always save as .glb; if user dropped non-glb we store with original name but .glb extension
    await ensureDir(targetDir);
    await writeFile(sourcePath, req.file.buffer);

    // Run optimize pipeline for this model
    await runOptimizeForModel(modelDirName);

    // Verify outputs
    const glbPath = join(targetDir, 'glb', `${baseNoExt}.glb`);
    const lodHi = join(targetDir, 'lod', `${baseNoExt}.high_fidelity.glb`);
    const lodLo = join(targetDir, 'lod', `${baseNoExt}.low_fidelity.glb`);
    await stat(glbPath); // throws if missing

    res.json({
      name: modelDirName,
      basePath: `/assets/models/${modelDirName}/glb/${baseNoExt}.glb`,
      lod: {
        high_fidelity: `/assets/models/${modelDirName}/lod/${baseNoExt}.high_fidelity.glb`,
        low_fidelity: `/assets/models/${modelDirName}/lod/${baseNoExt}.low_fidelity.glb`,
      },
    });
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : 'Ingest failed');
  }
});

const PORT = Number(process.env.INGEST_PORT || 4829);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[ingest] ready on http://localhost:${PORT}`);
});
