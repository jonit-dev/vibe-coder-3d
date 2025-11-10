/**
 * Web Worker for TypeScript transpilation
 *
 * Offloads TS -> JS transpilation from the main thread to prevent UI stutters
 * during script compilation.
 */

import * as ts from 'typescript';

/**
 * Message from main thread requesting transpilation
 */
interface ITranspileRequest {
  id: number;
  code: string;
}

/**
 * Response sent back to main thread with transpiled JS
 */
interface ITranspileResponse {
  id: number;
  code: string;
  error?: string;
}

/**
 * Transpile TypeScript code to JavaScript using the official TypeScript compiler
 * IMPORTANT: Scripts should NOT use export/import statements
 */
function transpileTypeScript(code: string): string {
  // Strip any export keywords that might have been added by the AI
  // This prevents "exports is not defined" errors
  const cleanedCode = code
    .replace(/^\s*export\s+/gm, '') // Remove "export " at start of lines
    .replace(/^\s*import\s+.*?;?\s*$/gm, ''); // Remove import statements

  const result = ts.transpileModule(cleanedCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2015, // Use ES2015 modules, then strip imports/exports
      removeComments: false,
      inlineSourceMap: false,
      inlineSources: false,
      declaration: false,
    },
  });

  // Strip any remaining export/import statements from transpiled output
  const cleanedOutput = result.outputText
    .replace(/^\s*export\s+/gm, '')
    .replace(/^\s*import\s+.*?;?\s*$/gm, '')
    .replace(/Object\.defineProperty\(exports,.*?\n/g, '') // Remove Object.defineProperty(exports, ...)
    .replace(/exports\.__esModule\s*=\s*true;?\s*\n?/g, '') // Remove exports.__esModule = true
    .replace(/exports\.\w+\s*=\s*/g, ''); // Remove exports.xxx =

  return cleanedOutput;
}

// Worker message handler
self.onmessage = (evt: MessageEvent<ITranspileRequest>) => {
  const { id, code } = evt.data;

  try {
    const transpiledCode = transpileTypeScript(code);

    const response: ITranspileResponse = {
      id,
      code: transpiledCode,
    };

    (self as unknown as Worker).postMessage(response);
  } catch (error) {
    const response: ITranspileResponse = {
      id,
      code: '',
      error: error instanceof Error ? error.message : String(error),
    };

    (self as unknown as Worker).postMessage(response);
  }
};
