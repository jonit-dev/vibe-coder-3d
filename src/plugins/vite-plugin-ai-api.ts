/**
 * Vite plugin to proxy AI API requests to Z.AI
 * Avoids CORS issues by proxying through Vite dev server
 */

import type { Plugin } from 'vite';

const Z_AI_BASE_URL = 'https://api.z.ai/api/anthropic';

export function aiApiPlugin(): Plugin {
  return {
    name: 'ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        try {
          // Build target URL
          const targetPath = req.url?.replace('/api/ai', '') || '';
          const targetURL = `${Z_AI_BASE_URL}${targetPath}`;

          // Forward all important headers
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          // Anthropic SDK uses 'x-api-key' header, but Z.AI expects 'Authorization: Bearer <token>'
          const apiKey = req.headers['x-api-key'];
          if (apiKey) {
            const token = Array.isArray(apiKey) ? apiKey[0] : apiKey;
            headers.Authorization = `Bearer ${token}`;
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
