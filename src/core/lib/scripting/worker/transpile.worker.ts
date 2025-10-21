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
 */
function transpileTypeScript(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      removeComments: false,
      inlineSourceMap: false,
      inlineSources: false,
      declaration: false,
    },
  });
  return result.outputText;
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
