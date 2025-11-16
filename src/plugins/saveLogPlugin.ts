/**
 * Vite Plugin: Save Log
 * Handles POST /api/save-log requests to write agent session logs to disk
 * Only works in dev mode
 */

import type { Plugin } from 'vite';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ILogPayload {
  filename: string;
  content: string;
}

export function saveLogPlugin(): Plugin {
  const logsDir = path.join(process.cwd(), 'logs', 'agent-sessions');

  return {
    name: 'vite-plugin-save-log',
    apply: 'serve', // Only in dev mode

    async configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/save-log' && req.method === 'POST') {
          try {
            // Read request body
            const chunks: Buffer[] = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', async () => {
              try {
                const body = Buffer.concat(chunks).toString();
                const payload: ILogPayload = JSON.parse(body);

                // Ensure logs directory exists
                await fs.mkdir(logsDir, { recursive: true });

                // Write log file
                const filePath = path.join(logsDir, payload.filename);
                await fs.writeFile(filePath, payload.content, 'utf-8');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, path: filePath }));
              } catch (error) {
                console.error('[save-log] Failed to save log:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: String(error) }));
              }
            });
          } catch (error) {
            console.error('[save-log] Request error:', error);
            res.statusCode = 500;
            res.end();
          }
        } else {
          next();
        }
      });
    },
  };
}
