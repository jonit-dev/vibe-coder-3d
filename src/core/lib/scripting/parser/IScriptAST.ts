/**
 * Script AST - Abstract Syntax Tree for parsed scripts
 */

export interface ILifecycleNode {
  name: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable';
  body: string;
}

export interface IScriptAST {
  lifecycles: ILifecycleNode[];
  isValid: boolean;
  parseError?: string;
}
