import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Apply CORS headers to response
 * @param res - The HTTP response object
 * @param origin - The allowed origin (default: '*')
 */
export const applyCors = (res: ServerResponse, origin = '*'): void => {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

/**
 * Read and parse JSON body from request
 * @param req - The HTTP request object
 * @param limitBytes - Maximum payload size in bytes (default: 5MB)
 * @returns Parsed JSON data
 * @throws Error if payload exceeds limit or JSON is invalid
 */
export const readJsonBody = async <T>(
  req: IncomingMessage,
  limitBytes = 5_000_000,
): Promise<T> => {
  let body = '';
  let size = 0;

  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Payload too large'));
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => resolve());
    req.on('error', reject);
  });

  return JSON.parse(body) as T;
};

/**
 * Send JSON response
 * @param res - The HTTP response object
 * @param statusCode - HTTP status code
 * @param data - Data to send as JSON
 */
export const sendJson = (res: ServerResponse, statusCode: number, data: unknown): void => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

/**
 * Send error response
 * @param res - The HTTP response object
 * @param statusCode - HTTP status code
 * @param error - Error message or object
 */
export const sendError = (res: ServerResponse, statusCode: number, error: string | Error): void => {
  const message = error instanceof Error ? error.message : error;
  sendJson(res, statusCode, { error: message });
};
