/**
 * Transpile Service - Manages worker-based TypeScript transpilation
 *
 * Offloads TS -> JS transpilation to a Web Worker to prevent main thread blocking.
 * Falls back to main-thread transpilation if worker initialization fails.
 */

import * as ts from 'typescript';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('TranspileService');

/**
 * Transpile input
 */
export interface ITranspileInput {
  code: string;
}

/**
 * Transpile output (JS code)
 */
export interface ITranspileOutput {
  code: string;
}

/**
 * Message sent to worker
 */
interface ITranspileRequest {
  id: number;
  code: string;
}

/**
 * Response from worker
 */
interface ITranspileResponse {
  id: number;
  code: string;
  error?: string;
}

/**
 * Transpile Service for worker-based TypeScript transpilation
 */
export class TranspileService {
  private worker: Worker | null = null;
  private nextId = 0;
  private pending = new Map<
    number,
    {
      resolve: (output: ITranspileOutput) => void;
      reject: (error: Error) => void;
    }
  >();
  private initialized = false;
  private fallbackToMain = false;

  /**
   * Initialize the worker (lazy initialization)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Attempt to create worker
      // Note: In Vite, worker files need special handling
      // This is a placeholder - actual worker instantiation depends on build setup
      this.worker = new Worker(new URL('./worker/transpile.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (evt: MessageEvent<ITranspileResponse>) => {
        const { id, code, error } = evt.data;
        const pending = this.pending.get(id);

        if (!pending) {
          logger.warn(`Received response for unknown request ID: ${id}`);
          return;
        }

        this.pending.delete(id);

        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve({ code });
        }
      };

      this.worker.onerror = (error) => {
        logger.error('Worker error:', error);
        // Fall back to main thread for future transpilations
        this.fallbackToMain = true;
      };

      this.initialized = true;
      logger.info('Transpile worker initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize transpile worker, falling back to main thread:', error);
      this.fallbackToMain = true;
      this.initialized = true;
    }
  }

  /**
   * Transpile TypeScript code to JavaScript
   */
  async transpile(input: ITranspileInput): Promise<ITranspileOutput> {
    // Ensure initialized
    if (!this.initialized) {
      await this.init();
    }

    // Fallback to main thread if worker unavailable
    if (this.fallbackToMain || !this.worker) {
      return this.transpileOnMainThread(input);
    }

    // Use worker
    return this.transpileInWorker(input);
  }

  /**
   * Transpile using worker
   */
  private transpileInWorker(input: ITranspileInput): Promise<ITranspileOutput> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;

      this.pending.set(id, { resolve, reject });

      const request: ITranspileRequest = {
        id,
        code: input.code,
      };

      this.worker!.postMessage(request);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Transpilation timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Fallback: transpile on main thread using TypeScript compiler
   */
  private transpileOnMainThread(input: ITranspileInput): Promise<ITranspileOutput> {
    try {
      const result = ts.transpileModule(input.code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.None,
          removeComments: false,
          inlineSourceMap: false,
          inlineSources: false,
          declaration: false,
        },
      });

      return Promise.resolve({ code: result.outputText });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.initialized = false;
      logger.info('Transpile worker terminated');
    }
  }
}
