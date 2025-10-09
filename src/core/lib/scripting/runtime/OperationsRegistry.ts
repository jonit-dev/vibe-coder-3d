/**
 * Operations Registry - Maps opcodes to executable operations
 */

import { Opcode } from '../compiler/Opcode';
import { IScriptContext } from '../ScriptAPI';
import { parseNumericExpression } from './TimeMath';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('OperationsRegistry');

export type OperationHandler = (
  context: IScriptContext,
  args: unknown[],
  deltaTime?: number,
) => void;

export class OperationsRegistry {
  private operations: Map<Opcode, OperationHandler>;
  private debugMode: boolean;

  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.operations = new Map();
    this.registerDefaultOperations();
  }

  public register(opcode: Opcode, handler: OperationHandler): void {
    this.operations.set(opcode, handler);
  }

  public execute(
    opcode: Opcode,
    context: IScriptContext,
    args: unknown[],
    deltaTime?: number,
  ): void {
    const handler = this.operations.get(opcode);
    if (handler) {
      handler(context, args, deltaTime);
    } else {
      if (this.debugMode) {
        logger.warn(`Unknown opcode: ${opcode}`);
      }
    }
  }

  private registerDefaultOperations(): void {
    // Console operations
    this.register(Opcode.Log, (ctx, args) => {
      ctx.console.log(...args.map(String));
    });

    // Transform operations (preferred API)
    this.register(Opcode.SetPosition, (ctx, args, dt) => {
      const x = parseNumericExpression(String(args[0] || 0), dt);
      const y = parseNumericExpression(String(args[1] || 0), dt);
      const z = parseNumericExpression(String(args[2] || 0), dt);
      ctx.entity.transform.setPosition(x, y, z);
    });

    this.register(Opcode.SetRotation, (ctx, args, dt) => {
      const x = parseNumericExpression(String(args[0] || 0), dt);
      const y = parseNumericExpression(String(args[1] || 0), dt);
      const z = parseNumericExpression(String(args[2] || 0), dt);
      ctx.entity.transform.setRotation(x, y, z);
    });

    this.register(Opcode.SetScale, (ctx, args, dt) => {
      const x = parseNumericExpression(String(args[0] || 1), dt);
      const y = parseNumericExpression(String(args[1] || 1), dt);
      const z = parseNumericExpression(String(args[2] || 1), dt);
      ctx.entity.transform.setScale(x, y, z);
    });

    this.register(Opcode.Translate, (ctx, args, dt) => {
      const x = parseNumericExpression(String(args[0] || 0), dt);
      const y = parseNumericExpression(String(args[1] || 0), dt);
      const z = parseNumericExpression(String(args[2] || 0), dt);
      ctx.entity.transform.translate(x, y, z);
    });

    this.register(Opcode.Rotate, (ctx, args, dt) => {
      const x = parseNumericExpression(String(args[0] || 0), dt);
      const y = parseNumericExpression(String(args[1] || 0), dt);
      const z = parseNumericExpression(String(args[2] || 0), dt);
      ctx.entity.transform.rotate(x, y, z);
    });

    // Legacy position operations
    this.register(Opcode.LegacySetPosX, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [, y, z] = ctx.entity.transform.position;
      ctx.entity.transform.setPosition(value, y, z);
    });

    this.register(Opcode.LegacySetPosY, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, , z] = ctx.entity.transform.position;
      ctx.entity.transform.setPosition(x, value, z);
    });

    this.register(Opcode.LegacySetPosZ, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y] = ctx.entity.transform.position;
      ctx.entity.transform.setPosition(x, y, value);
    });

    // Legacy rotation operations
    this.register(Opcode.LegacySetRotX, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [, y, z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(value, y, z);
    });

    this.register(Opcode.LegacySetRotY, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, , z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x, value, z);
    });

    this.register(Opcode.LegacySetRotZ, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x, y, value);
    });

    this.register(Opcode.LegacyAddRotX, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y, z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x + value, y, z);
    });

    this.register(Opcode.LegacyAddRotY, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y, z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x, y + value, z);
    });

    this.register(Opcode.LegacyAddRotZ, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y, z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x, y, z + value);
    });

    this.register(Opcode.LegacySubRotX, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y, z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x - value, y, z);
    });

    this.register(Opcode.LegacySubRotY, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y, z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x, y - value, z);
    });

    this.register(Opcode.LegacySubRotZ, (ctx, args, dt) => {
      const value = parseNumericExpression(String(args[0] || 0), dt);
      const [x, y, z] = ctx.entity.transform.rotation;
      ctx.entity.transform.setRotation(x, y, z - value);
    });

    // Time-based animations
    this.register(Opcode.SinusoidalPosX, (ctx, args) => {
      const amplitude = parseFloat(String(args[0] || 1));
      const value = Math.sin(ctx.time.time) * amplitude;
      const [, y, z] = ctx.entity.transform.position;
      ctx.entity.transform.setPosition(value, y, z);
    });

    this.register(Opcode.SinusoidalPosY, (ctx, args) => {
      const amplitude = parseFloat(String(args[0] || 1));
      const value = Math.sin(ctx.time.time) * amplitude;
      const [x, , z] = ctx.entity.transform.position;
      ctx.entity.transform.setPosition(x, value, z);
    });

    this.register(Opcode.SinusoidalPosZ, (ctx, args) => {
      const amplitude = parseFloat(String(args[0] || 1));
      const value = Math.sin(ctx.time.time) * amplitude;
      const [x, y] = ctx.entity.transform.position;
      ctx.entity.transform.setPosition(x, y, value);
    });

    this.register(Opcode.DeltaRotX, (ctx, args, dt) => {
      const multiplier = parseFloat(String(args[0] || 1));
      if (dt !== undefined) {
        const [x, y, z] = ctx.entity.transform.rotation;
        ctx.entity.transform.setRotation(x + dt * multiplier, y, z);
      }
    });

    this.register(Opcode.DeltaRotY, (ctx, args, dt) => {
      const multiplier = parseFloat(String(args[0] || 1));
      if (dt !== undefined) {
        const [x, y, z] = ctx.entity.transform.rotation;
        ctx.entity.transform.setRotation(x, y + dt * multiplier, z);
      }
    });

    this.register(Opcode.DeltaRotZ, (ctx, args, dt) => {
      const multiplier = parseFloat(String(args[0] || 1));
      if (dt !== undefined) {
        const [x, y, z] = ctx.entity.transform.rotation;
        ctx.entity.transform.setRotation(x, y, z + dt * multiplier);
      }
    });

    // Material operations
    this.register(Opcode.SetMaterialColor, (ctx, args) => {
      const color = String(args[0] || '#ffffff');
      ctx.three.material.setColor(color);
    });

    // No-op
    this.register(Opcode.Noop, () => {
      // Do nothing
    });
  }
}
