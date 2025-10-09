/**
 * Script Compiler - Compiles AST to executable instructions
 */

import { IScriptAST, ILifecycleNode } from '../parser/IScriptAST';
import { ICompiledScript, ICompiledLifecycle, IInstruction } from './Instruction';
import { Opcode } from './Opcode';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('ScriptCompiler');

export interface IScriptCompiler {
  compile(ast: IScriptAST): ICompiledScript;
}

/**
 * Pattern-based compiler that converts lifecycle bodies to instruction lists
 */
export class ScriptCompiler implements IScriptCompiler {
  private debugMode: boolean;

  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  public compile(ast: IScriptAST): ICompiledScript {
    const lifecycles: Record<string, ICompiledLifecycle | undefined> = {};

    for (const lifecycleNode of ast.lifecycles) {
      lifecycles[lifecycleNode.name] = this.compileLifecycle(lifecycleNode);
    }

    return { lifecycles };
  }

  private compileLifecycle(node: ILifecycleNode): ICompiledLifecycle {
    const instructions: IInstruction[] = [];
    const body = node.body;

    // Console logging
    instructions.push(...this.compileConsoleLogs(body));

    // Transform operations (preferred API)
    instructions.push(...this.compileSetPosition(body));
    instructions.push(...this.compileSetRotation(body));
    instructions.push(...this.compileTranslate(body));
    instructions.push(...this.compileRotate(body));

    // Legacy transform operations
    instructions.push(...this.compileLegacyPosition(body));
    instructions.push(...this.compileLegacyRotation(body));

    // Time-based animations
    instructions.push(...this.compileSinusoidalMotion(body));
    instructions.push(...this.compileDeltaRotation(body));

    // Material operations
    instructions.push(...this.compileMaterialColor(body));

    return {
      name: node.name,
      instructions,
    };
  }

  private compileConsoleLogs(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const logRegex = /console\.log\s*\(([^)]*)\)/g;
    let match;

    while ((match = logRegex.exec(body)) !== null) {
      const args = match[1];
      // Extract string literals
      const strings = Array.from(args.matchAll(/['"`]([^'"`]+)['"`]/g)).map((m) => m[1]);
      if (strings.length > 0) {
        instructions.push({ op: Opcode.Log, args: strings });
      } else {
        instructions.push({ op: Opcode.Log, args: ['[script]'] });
      }
    }

    return instructions;
  }

  private compileSetPosition(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex = /entity\.transform\.setPosition\s*\(([^)]*)\)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const args = this.parseArguments(match[1]);
      if (args.length >= 3) {
        instructions.push({ op: Opcode.SetPosition, args: args.slice(0, 3) });
      }
    }

    return instructions;
  }

  private compileSetRotation(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex = /entity\.transform\.setRotation\s*\(([^)]*)\)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const args = this.parseArguments(match[1]);
      if (args.length >= 3) {
        instructions.push({ op: Opcode.SetRotation, args: args.slice(0, 3) });
      }
    }

    return instructions;
  }

  private compileTranslate(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex = /entity\.transform\.translate\s*\(([^)]*)\)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const args = this.parseArguments(match[1]);
      if (args.length >= 3) {
        instructions.push({ op: Opcode.Translate, args: args.slice(0, 3) });
      }
    }

    return instructions;
  }

  private compileRotate(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex = /entity\.transform\.rotate\s*\(([^)]*)\)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const args = this.parseArguments(match[1]);
      if (args.length >= 3) {
        instructions.push({ op: Opcode.Rotate, args: args.slice(0, 3) });
      }
    }

    return instructions;
  }

  private compileLegacyPosition(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex = /entity\.position\.([xyz])\s*=\s*([\d.-]+)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const axis = match[1];
      const value = match[2];

      if (axis === 'x') {
        instructions.push({ op: Opcode.LegacySetPosX, args: [value] });
      } else if (axis === 'y') {
        instructions.push({ op: Opcode.LegacySetPosY, args: [value] });
      } else if (axis === 'z') {
        instructions.push({ op: Opcode.LegacySetPosZ, args: [value] });
      }
    }

    return instructions;
  }

  private compileLegacyRotation(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];

    // Match assignment operators first (=)
    const assignRegex = /entity\.rotation\.([xyz])\s*=\s*([\d.-]+)/g;
    let match;

    while ((match = assignRegex.exec(body)) !== null) {
      const axis = match[1];
      const value = match[2];

      if (axis === 'x') instructions.push({ op: Opcode.LegacySetRotX, args: [value] });
      if (axis === 'y') instructions.push({ op: Opcode.LegacySetRotY, args: [value] });
      if (axis === 'z') instructions.push({ op: Opcode.LegacySetRotZ, args: [value] });
    }

    // Match addition operators (+=)
    const addRegex = /entity\.rotation\.([xyz])\s*\+=\s*([\d.-]+)/g;
    while ((match = addRegex.exec(body)) !== null) {
      const axis = match[1];
      const value = match[2];

      if (axis === 'x') instructions.push({ op: Opcode.LegacyAddRotX, args: [value] });
      if (axis === 'y') instructions.push({ op: Opcode.LegacyAddRotY, args: [value] });
      if (axis === 'z') instructions.push({ op: Opcode.LegacyAddRotZ, args: [value] });
    }

    // Match subtraction operators (-=)
    const subRegex = /entity\.rotation\.([xyz])\s*-=\s*([\d.-]+)/g;
    while ((match = subRegex.exec(body)) !== null) {
      const axis = match[1];
      const value = match[2];

      if (axis === 'x') instructions.push({ op: Opcode.LegacySubRotX, args: [value] });
      if (axis === 'y') instructions.push({ op: Opcode.LegacySubRotY, args: [value] });
      if (axis === 'z') instructions.push({ op: Opcode.LegacySubRotZ, args: [value] });
    }

    return instructions;
  }

  private compileSinusoidalMotion(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex =
      /entity\.position\.([xyz])\s*=\s*Math\.sin\s*\(\s*time\.time\s*\)\s*\*\s*([\d.-]+)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const axis = match[1];
      const amplitude = match[2];

      if (axis === 'x') instructions.push({ op: Opcode.SinusoidalPosX, args: [amplitude] });
      if (axis === 'y') instructions.push({ op: Opcode.SinusoidalPosY, args: [amplitude] });
      if (axis === 'z') instructions.push({ op: Opcode.SinusoidalPosZ, args: [amplitude] });
    }

    return instructions;
  }

  private compileDeltaRotation(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex = /entity\.rotation\.([xyz])\s*\+=\s*(?:time\.)?deltaTime(?:\s*\*\s*([\d.-]+))?/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const axis = match[1];
      const multiplier = match[2] || '1';

      if (axis === 'x') instructions.push({ op: Opcode.DeltaRotX, args: [multiplier] });
      if (axis === 'y') instructions.push({ op: Opcode.DeltaRotY, args: [multiplier] });
      if (axis === 'z') instructions.push({ op: Opcode.DeltaRotZ, args: [multiplier] });
    }

    return instructions;
  }

  private compileMaterialColor(body: string): IInstruction[] {
    const instructions: IInstruction[] = [];
    const regex = /three\.material\.setColor\s*\(([^)]*)\)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const arg = match[1];
      const colorMatch = arg.match(/['"`]([^'"`]+)['"`]/);
      if (colorMatch) {
        instructions.push({ op: Opcode.SetMaterialColor, args: [colorMatch[1]] });
      }
    }

    return instructions;
  }

  private parseArguments(argsString: string): string[] {
    return argsString.split(',').map((arg) => arg.trim());
  }
}
