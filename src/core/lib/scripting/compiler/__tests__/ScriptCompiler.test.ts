import { describe, it, expect } from 'vitest';
import { ScriptCompiler } from '../ScriptCompiler';
import { Opcode } from '../Opcode';
import { IScriptAST } from '../../parser/IScriptAST';

describe('ScriptCompiler', () => {
  const compiler = new ScriptCompiler();

  describe('Console operations', () => {
    it('should compile console.log with string literal', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'console.log("Hello World");',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle).toBeDefined();
      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.Log);
      expect(lifecycle?.instructions[0].args).toEqual(['Hello World']);
    });

    it('should compile multiple console.log statements', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'console.log("First"); console.log("Second");',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions).toHaveLength(2);
      expect(lifecycle?.instructions[0].args).toEqual(['First']);
      expect(lifecycle?.instructions[1].args).toEqual(['Second']);
    });
  });

  describe('Transform operations - preferred API', () => {
    it('should compile entity.transform.setPosition', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'entity.transform.setPosition(1, 2, 3);',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.SetPosition);
      expect(lifecycle?.instructions[0].args).toEqual(['1', '2', '3']);
    });

    it('should compile entity.transform.setRotation', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'entity.transform.setRotation(0.5, 1.0, 1.5);',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.SetRotation);
      expect(lifecycle?.instructions[0].args).toEqual(['0.5', '1.0', '1.5']);
    });

    it('should compile entity.transform.translate', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.transform.translate(0.1, 0, 0);',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.Translate);
    });

    it('should compile entity.transform.rotate', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.transform.rotate(0, 0.01, 0);',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.Rotate);
    });
  });

  describe('Legacy transform operations', () => {
    it('should compile entity.position.x = value', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'entity.position.x = 5;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.LegacySetPosX);
      expect(lifecycle?.instructions[0].args).toEqual(['5']);
    });

    it('should compile entity.position.y and z', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'entity.position.y = 10; entity.position.z = 15;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions).toHaveLength(2);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.LegacySetPosY);
      expect(lifecycle?.instructions[1].op).toBe(Opcode.LegacySetPosZ);
    });

    it('should compile entity.rotation.y = value', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'entity.rotation.y = 1.5;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions[0].op).toBe(Opcode.LegacySetRotY);
    });

    it('should compile entity.rotation.y += value', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.rotation.y += 0.01;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions[0].op).toBe(Opcode.LegacyAddRotY);
    });

    it('should compile entity.rotation.z -= value', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.rotation.z -= 0.01;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions[0].op).toBe(Opcode.LegacySubRotZ);
    });
  });

  describe('Time-based animations', () => {
    it('should compile sinusoidal motion', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.position.y = Math.sin(time.time) * 2;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.SinusoidalPosY);
      expect(lifecycle?.instructions[0].args).toEqual(['2']);
    });

    it('should compile delta rotation', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.rotation.y += deltaTime;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions[0].op).toBe(Opcode.DeltaRotY);
      expect(lifecycle?.instructions[0].args).toEqual(['1']);
    });

    it('should compile delta rotation with multiplier', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.rotation.x += deltaTime * 2;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions[0].op).toBe(Opcode.DeltaRotX);
      expect(lifecycle?.instructions[0].args).toEqual(['2']);
    });

    it('should compile delta rotation with time.deltaTime', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: 'entity.rotation.z += time.deltaTime;',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions[0].op).toBe(Opcode.DeltaRotZ);
    });
  });

  describe('Material operations', () => {
    it('should compile three.material.setColor', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'three.material.setColor("#ff0000");',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions).toHaveLength(1);
      expect(lifecycle?.instructions[0].op).toBe(Opcode.SetMaterialColor);
      expect(lifecycle?.instructions[0].args).toEqual(['#ff0000']);
    });

    it('should compile setColor with single quotes', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: "three.material.setColor('blue');",
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions[0].args).toEqual(['blue']);
    });
  });

  describe('Multiple lifecycles', () => {
    it('should compile all lifecycle methods', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          { name: 'onStart', body: 'console.log("start");' },
          { name: 'onUpdate', body: 'entity.rotation.y += deltaTime;' },
          { name: 'onDestroy', body: 'console.log("destroy");' },
          { name: 'onEnable', body: 'console.log("enable");' },
          { name: 'onDisable', body: 'console.log("disable");' },
        ],
      };

      const compiled = compiler.compile(ast);

      expect(compiled.lifecycles['onStart']).toBeDefined();
      expect(compiled.lifecycles['onUpdate']).toBeDefined();
      expect(compiled.lifecycles['onDestroy']).toBeDefined();
      expect(compiled.lifecycles['onEnable']).toBeDefined();
      expect(compiled.lifecycles['onDisable']).toBeDefined();
    });
  });

  describe('Complex scripts', () => {
    it('should compile script with multiple operations', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onUpdate',
            body: `
              console.log("updating");
              entity.rotation.y += deltaTime;
              entity.position.y = Math.sin(time.time) * 2;
              three.material.setColor("#00ff00");
            `,
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onUpdate'];

      expect(lifecycle?.instructions.length).toBeGreaterThan(3);
      expect(lifecycle?.instructions.some((i) => i.op === Opcode.Log)).toBe(true);
      expect(lifecycle?.instructions.some((i) => i.op === Opcode.DeltaRotY)).toBe(true);
      expect(lifecycle?.instructions.some((i) => i.op === Opcode.SinusoidalPosY)).toBe(true);
      expect(lifecycle?.instructions.some((i) => i.op === Opcode.SetMaterialColor)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty lifecycle body', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: '',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions).toHaveLength(0);
    });

    it('should handle unknown API calls gracefully', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'unknown.api.call();',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      // Unknown calls are simply ignored
      expect(lifecycle?.instructions).toHaveLength(0);
    });

    it('should handle malformed patterns', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'entity.position.x = ;', // Missing value
          },
        ],
      };

      const compiled = compiler.compile(ast);

      // Should not throw, just ignore invalid patterns
      expect(compiled).toBeDefined();
    });
  });

  describe('Whitespace handling', () => {
    it('should handle various whitespace patterns', () => {
      const ast: IScriptAST = {
        isValid: true,
        lifecycles: [
          {
            name: 'onStart',
            body: 'entity.transform.setPosition(  1  ,  2  ,  3  );',
          },
        ],
      };

      const compiled = compiler.compile(ast);
      const lifecycle = compiled.lifecycles['onStart'];

      expect(lifecycle?.instructions[0].args.map((a) => String(a).trim())).toEqual(['1', '2', '3']);
    });
  });
});
