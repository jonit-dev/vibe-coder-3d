/**
 * Vite plugin to proxy AI API requests to Anthropic (or compatible providers)
 * Avoids CORS issues by proxying through Vite dev server
 */

import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

export function aiApiPlugin(): Plugin {
  let baseURL: string;

  return {
    name: 'ai-api',
    configureServer(server) {
      // Load environment variables in Node.js context
      const env = loadEnv(server.config.mode, process.cwd(), '');
      baseURL = env.VITE_CLAUDE_CODE_SDK_BASE_URL;

      if (!baseURL) {
        throw new Error('VITE_CLAUDE_CODE_SDK_BASE_URL environment variable is required');
      }
      server.middlewares.use('/api/ai', async (req, res) => {
        try {
          // Build target URL
          const targetPath = req.url?.replace('/api/ai', '') || '';
          const targetURL = `${baseURL}${targetPath}`;

          // Forward all important headers
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          // Handle authentication headers
          const apiKey = req.headers['x-api-key'];
          if (apiKey) {
            const token = Array.isArray(apiKey) ? apiKey[0] : apiKey;
            // Anthropic API uses x-api-key header directly
            if (baseURL.includes('anthropic.com')) {
              headers['x-api-key'] = token;
            } else {
              // Z.AI and compatible providers use Bearer token
              headers.Authorization = `Bearer ${token}`;
            }
          } else {
            // Fallback: check for direct authorization header
            const authHeader = req.headers.authorization || req.headers.Authorization;
            if (authHeader) {
              headers.Authorization = Array.isArray(authHeader) ? authHeader[0] : authHeader;
            }
          }

          // Copy anthropic version header
          const versionHeader = req.headers['anthropic-version'];
          if (versionHeader) {
            headers['anthropic-version'] = Array.isArray(versionHeader)
              ? versionHeader[0]
              : versionHeader;
          }

          // Read request body for POST/PUT
          let body: string | undefined;
          if (req.method === 'POST' || req.method === 'PUT') {
            body = await new Promise((resolve) => {
              let data = '';
              req.on('data', (chunk) => {
                data += chunk;
              });
              req.on('end', () => {
                resolve(data);
              });
            });
          }

          // Make request to Z.AI
          const response = await fetch(targetURL, {
            method: req.method,
            headers,
            body,
          });

          // Forward response headers
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });

          // Stream response body
          if (response.body) {
            const reader = response.body.getReader();
            const stream = async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
              res.end();
            };
            await stream();
          } else {
            res.end();
          }
        } catch (error) {
          console.error('AI API proxy error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Proxy error' }));
        }
      });
    },
  };
}
