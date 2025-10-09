import { describe, it, expect, vi } from 'vitest';
import { InstructionRunner } from '../InstructionRunner';
import { ICompiledLifecycle } from '../../compiler/Instruction';
import { Opcode } from '../../compiler/Opcode';
import { IScriptContext } from '../../ScriptAPI';

describe('InstructionRunner', () => {
  const runner = new InstructionRunner();

  const createMockContext = (): IScriptContext => {
    return {
      entity: {
        id: 1,
        name: 'Test Entity',
        transform: {
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          setPosition: vi.fn((x, y, z) => {
            (mockContext.entity.transform.position as [number, number, number]) = [x, y, z];
          }),
          setRotation: vi.fn((x, y, z) => {
            (mockContext.entity.transform.rotation as [number, number, number]) = [x, y, z];
          }),
          setScale: vi.fn((x, y, z) => {
            (mockContext.entity.transform.scale as [number, number, number]) = [x, y, z];
          }),
          translate: vi.fn(),
          rotate: vi.fn(),
          lookAt: vi.fn(),
          forward: vi.fn(() => [0, 0, 1] as [number, number, number]),
          right: vi.fn(() => [1, 0, 0] as [number, number, number]),
          up: vi.fn(() => [0, 1, 0] as [number, number, number]),
        },
        getComponent: vi.fn(),
        setComponent: vi.fn(),
        hasComponent: vi.fn(),
        removeComponent: vi.fn(),
        destroy: vi.fn(),
      },
      time: {
        time: 1.0,
        deltaTime: 0.016,
        frameCount: 60,
      },
      input: {} as any,
      math: {} as any,
      console: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      three: {
        material: {
          setColor: vi.fn(),
          getColor: vi.fn(() => '#ffffff'),
          setOpacity: vi.fn(),
          getOpacity: vi.fn(() => 1),
        },
        object3D: {} as any,
        scene: {} as any,
      },
      events: {} as any,
      audio: {} as any,
      timer: {} as any,
      query: {} as any,
      prefab: {} as any,
      entities: {} as any,
      parameters: {},
    };
  };

  let mockContext = createMockContext();

  describe('Console operations', () => {
    it('should execute Log instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.Log, args: ['Hello', 'World'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.console.log).toHaveBeenCalledWith('Hello', 'World');
    });
  });

  describe('Transform operations - preferred API', () => {
    it('should execute SetPosition instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.SetPosition, args: ['1', '2', '3'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setPosition).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should execute SetRotation instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.SetRotation, args: ['0.5', '1.0', '1.5'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setRotation).toHaveBeenCalledWith(0.5, 1.0, 1.5);
    });

    it('should execute Translate instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.Translate, args: ['0.1', '0', '0'] }],
      };

      runner.run(lifecycle, mockContext, 0.016);

      expect(mockContext.entity.transform.translate).toHaveBeenCalledWith(0.1, 0, 0);
    });

    it('should execute Rotate instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.Rotate, args: ['0', '0.01', '0'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.rotate).toHaveBeenCalledWith(0, 0.01, 0);
    });
  });

  describe('Legacy position operations', () => {
    it('should execute LegacySetPosX instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.LegacySetPosX, args: ['5'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setPosition).toHaveBeenCalledWith(5, 0, 0);
    });

    it('should execute LegacySetPosY instruction', () => {
      mockContext = createMockContext();
      mockContext.entity.transform.position = [1, 2, 3];
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.LegacySetPosY, args: ['10'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setPosition).toHaveBeenCalledWith(1, 10, 3);
    });

    it('should execute LegacySetPosZ instruction', () => {
      mockContext = createMockContext();
      mockContext.entity.transform.position = [1, 2, 3];
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.LegacySetPosZ, args: ['15'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setPosition).toHaveBeenCalledWith(1, 2, 15);
    });
  });

  describe('Legacy rotation operations', () => {
    it('should execute LegacySetRotY instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.LegacySetRotY, args: ['1.5'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setRotation).toHaveBeenCalledWith(0, 1.5, 0);
    });

    it('should execute LegacyAddRotY instruction', () => {
      mockContext = createMockContext();
      mockContext.entity.transform.rotation = [0, 1, 0];
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.LegacyAddRotY, args: ['0.01'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setRotation).toHaveBeenCalledWith(0, 1.01, 0);
    });

    it('should execute LegacySubRotZ instruction', () => {
      mockContext = createMockContext();
      mockContext.entity.transform.rotation = [0, 0, 2];
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.LegacySubRotZ, args: ['0.5'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.entity.transform.setRotation).toHaveBeenCalledWith(0, 0, 1.5);
    });
  });

  describe('Time-based animations', () => {
    it('should execute SinusoidalPosY instruction', () => {
      mockContext = createMockContext();
      mockContext.time.time = Math.PI / 2; // sin(PI/2) = 1
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.SinusoidalPosY, args: ['2'] }],
      };

      runner.run(lifecycle, mockContext);

      // sin(PI/2) * 2 ≈ 2
      expect(mockContext.entity.transform.setPosition).toHaveBeenCalledWith(
        0,
        expect.closeTo(2, 1),
        0,
      );
    });

    it('should execute DeltaRotY instruction', () => {
      mockContext = createMockContext();
      const deltaTime = 0.016;
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.DeltaRotY, args: ['1'] }],
      };

      runner.run(lifecycle, mockContext, deltaTime);

      expect(mockContext.entity.transform.setRotation).toHaveBeenCalledWith(0, 0.016, 0);
    });

    it('should execute DeltaRotX instruction with multiplier', () => {
      mockContext = createMockContext();
      const deltaTime = 0.016;
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.DeltaRotX, args: ['2'] }],
      };

      runner.run(lifecycle, mockContext, deltaTime);

      expect(mockContext.entity.transform.setRotation).toHaveBeenCalledWith(0.032, 0, 0);
    });
  });

  describe('Material operations', () => {
    it('should execute SetMaterialColor instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.SetMaterialColor, args: ['#ff0000'] }],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.three.material.setColor).toHaveBeenCalledWith('#ff0000');
    });
  });

  describe('Multiple instructions', () => {
    it('should execute multiple instructions in sequence', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [
          { op: Opcode.Log, args: ['Starting'] },
          { op: Opcode.SetPosition, args: ['1', '2', '3'] },
          { op: Opcode.SetMaterialColor, args: ['blue'] },
          { op: Opcode.Log, args: ['Done'] },
        ],
      };

      runner.run(lifecycle, mockContext);

      expect(mockContext.console.log).toHaveBeenCalledTimes(2);
      expect(mockContext.entity.transform.setPosition).toHaveBeenCalledOnce();
      expect(mockContext.three.material.setColor).toHaveBeenCalledOnce();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty instructions array', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [],
      };

      expect(() => runner.run(lifecycle, mockContext)).not.toThrow();
    });

    it('should handle Noop instruction', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.Noop, args: [] }],
      };

      expect(() => runner.run(lifecycle, mockContext)).not.toThrow();
    });
  });

  describe('DeltaTime handling', () => {
    it('should pass deltaTime to onUpdate lifecycle', () => {
      mockContext = createMockContext();
      const deltaTime = 0.016;
      const lifecycle: ICompiledLifecycle = {
        name: 'onUpdate',
        instructions: [{ op: Opcode.DeltaRotY, args: ['1'] }],
      };

      runner.run(lifecycle, mockContext, deltaTime);

      expect(mockContext.entity.transform.setRotation).toHaveBeenCalledWith(0, deltaTime, 0);
    });

    it('should not require deltaTime for onStart lifecycle', () => {
      mockContext = createMockContext();
      const lifecycle: ICompiledLifecycle = {
        name: 'onStart',
        instructions: [{ op: Opcode.SetPosition, args: ['1', '2', '3'] }],
      };

      expect(() => runner.run(lifecycle, mockContext)).not.toThrow();
    });
  });
});
