/**
 * Tests for Script API Parser
 */

import { describe, it, expect } from 'vitest';
import { parseScriptAPIs } from '../scriptApiParser';

describe('scriptApiParser', () => {
  it('should parse global API declarations', async () => {
    const mockApiFile = `
      /** Current entity API */
      const entity: IEntityScriptAPI;

      /** Math utilities */
      const math: IMathAPI;

      /** Script parameters configured in the editor */
      const parameters: Record<string, unknown>;
    `;

    const apis = await parseScriptAPIs(mockApiFile);

    expect(apis).toHaveLength(3);
    expect(apis[0]).toMatchObject({
      name: 'entity',
      description: 'Current entity API',
      type: 'global',
      interfaceName: 'IEntityScriptAPI',
    });
    expect(apis[1]).toMatchObject({
      name: 'math',
      description: 'Math utilities',
      type: 'global',
    });
    expect(apis[2]).toMatchObject({
      name: 'parameters',
      description: 'Script parameters configured in the editor',
      type: 'global',
      properties: ['(dynamic - defined by user)'],
    });
  });

  it('should extract methods and properties from interfaces', async () => {
    const mockApiFile = `
      /** Transform API */
      const transform: ITransformAPI;

      interface ITransformAPI {
        /** Get or set position */
        position: [number, number, number];
        readonly id: number;

        /** Translate entity */
        translate(x: number, y: number, z: number): void;
        /** Rotate entity */
        rotate(x: number, y: number, z: number): void;
      }
    `;

    const apis = await parseScriptAPIs(mockApiFile);

    expect(apis).toHaveLength(1);
    expect(apis[0].name).toBe('transform');
    expect(apis[0].properties).toContain('position');
    expect(apis[0].properties).toContain('id');
    expect(apis[0].methods).toContain('translate');
    expect(apis[0].methods).toContain('rotate');
  });

  it('should categorize APIs correctly', async () => {
    const mockApiFile = `
      /** Current entity API */
      const entity: IEntityScriptAPI;

      /** Keyboard and mouse input */
      const input: IInputAPI;

      /** RigidBody component accessor */
      const rigidBody: IRigidBodyAccessor;

      /** Scene queries and raycasting */
      const query: IQueryAPI;
    `;

    const apis = await parseScriptAPIs(mockApiFile);

    expect(apis.find((a) => a.name === 'entity')?.category).toBe('Core');
    expect(apis.find((a) => a.name === 'input')?.category).toBe('Input');
    expect(apis.find((a) => a.name === 'rigidBody')?.category).toBe('Physics');
    expect(apis.find((a) => a.name === 'query')?.category).toBe('Scene');
  });

  it('should handle nested interfaces', async () => {
    const mockApiFile = `
      /** Material API */
      const material: IMaterialAPI;

      interface IMaterialAPI {
        /** Material color */
        color: string;

        /** Set color */
        setColor(hex: string): void;
      }
    `;

    const apis = await parseScriptAPIs(mockApiFile);

    expect(apis).toHaveLength(1);
    expect(apis[0].properties).toContain('color');
    expect(apis[0].methods).toContain('setColor');
  });
});
