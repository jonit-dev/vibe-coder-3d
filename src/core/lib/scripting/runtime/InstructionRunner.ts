/**
 * Instruction Runner - Executes compiled script instructions
 */

import { ICompiledLifecycle } from '../compiler/Instruction';
import { IScriptContext } from '../ScriptAPI';
import { OperationsRegistry } from './OperationsRegistry';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('InstructionRunner');

export interface IInstructionRunner {
  run(lifecycle: ICompiledLifecycle, ctx: IScriptContext, dt?: number): void;
}

export class InstructionRunner implements IInstructionRunner {
  private registry: OperationsRegistry;
  private debugMode: boolean;

  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.registry = new OperationsRegistry(debugMode);
  }

  public run(lifecycle: ICompiledLifecycle, ctx: IScriptContext, dt?: number): void {
    try {
      for (const instruction of lifecycle.instructions) {
        this.registry.execute(instruction.op, ctx, instruction.args, dt);
      }
    } catch (error) {
      logger.error(`Error executing lifecycle ${lifecycle.name}:`, error);
      throw error;
    }
  }
}
