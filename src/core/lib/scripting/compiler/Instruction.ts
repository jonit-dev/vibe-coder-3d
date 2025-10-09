/**
 * Instruction definitions for compiled scripts
 */

import { Opcode } from './Opcode';
import { ILifecycleNode } from '../parser/IScriptAST';

export interface IInstruction {
  op: Opcode;
  args: unknown[];
}

export interface ICompiledLifecycle {
  name: ILifecycleNode['name'];
  instructions: IInstruction[];
}

export interface ICompiledScript {
  lifecycles: Record<string, ICompiledLifecycle | undefined>;
}
