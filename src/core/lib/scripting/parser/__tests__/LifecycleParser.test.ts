import { describe, it, expect } from 'vitest';
import { LifecycleParser } from '../LifecycleParser';

describe('LifecycleParser', () => {
  const parser = new LifecycleParser();

  describe('Function declarations', () => {
    it('should parse simple function declaration', () => {
      const code = `
        function onStart() {
          console.log("started");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(1);
      expect(ast.lifecycles[0].name).toBe('onStart');
      expect(ast.lifecycles[0].body).toContain('console.log');
    });

    it('should parse multiple lifecycle functions', () => {
      const code = `
        function onStart() {
          console.log("start");
        }

        function onUpdate() {
          entity.position.x += 1;
        }

        function onDestroy() {
          console.log("destroy");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(3);
      expect(ast.lifecycles.map((l) => l.name)).toEqual(['onStart', 'onUpdate', 'onDestroy']);
    });

    it('should parse function with parameters', () => {
      const code = `
        function onUpdate(deltaTime) {
          entity.position.x += deltaTime;
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].name).toBe('onUpdate');
      expect(ast.lifecycles[0].body).toContain('deltaTime');
    });

    it('should parse function with type annotation', () => {
      const code = `
        function onStart(): void {
          console.log("test");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].name).toBe('onStart');
    });
  });

  describe('Arrow functions', () => {
    it('should parse const arrow function', () => {
      const code = `
        const onStart = () => {
          console.log("start");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(1);
      expect(ast.lifecycles[0].name).toBe('onStart');
    });

    it('should parse let arrow function', () => {
      const code = `
        let onUpdate = () => {
          entity.position.y = 5;
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].name).toBe('onUpdate');
    });

    it('should parse var arrow function', () => {
      const code = `
        var onDestroy = () => {
          cleanup();
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].name).toBe('onDestroy');
    });

    it('should parse arrow function without const/let/var', () => {
      const code = `
        onStart = () => {
          init();
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].name).toBe('onStart');
    });

    it('should parse arrow function with parameters', () => {
      const code = `
        const onUpdate = (deltaTime) => {
          entity.rotation.y += deltaTime;
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].name).toBe('onUpdate');
    });

    it('should parse arrow function with type annotation', () => {
      const code = `
        const onStart = (): void => {
          setup();
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].name).toBe('onStart');
    });
  });

  describe('Nested braces', () => {
    it('should handle nested braces in function body', () => {
      const code = `
        function onStart() {
          if (true) {
            console.log("nested");
          }
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].body).toContain('if');
      expect(ast.lifecycles[0].body).toContain('nested');
    });

    it('should handle deeply nested braces', () => {
      const code = `
        function onUpdate() {
          if (x > 0) {
            for (let i = 0; i < 10; i++) {
              while (true) {
                break;
              }
            }
          }
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].body).toContain('for');
      expect(ast.lifecycles[0].body).toContain('while');
    });
  });

  describe('Comments', () => {
    it('should handle comments in body', () => {
      const code = `
        function onStart() {
          // This is a comment
          console.log("test");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      // Tokenizer skips comments, so just verify the code is parsed
      expect(ast.lifecycles[0].body).toContain('console.log');
    });

    it('should handle block comments', () => {
      const code = `
        function onStart() {
          /* Block comment */
          console.log("test");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      // Tokenizer skips comments, so just verify the code is parsed
      expect(ast.lifecycles[0].body).toContain('console.log');
    });
  });

  describe('All lifecycle methods', () => {
    it('should parse all five lifecycle methods', () => {
      const code = `
        function onStart() { init(); }
        function onUpdate() { update(); }
        function onDestroy() { cleanup(); }
        function onEnable() { enable(); }
        function onDisable() { disable(); }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(5);

      const names = ast.lifecycles.map((l) => l.name);
      expect(names).toContain('onStart');
      expect(names).toContain('onUpdate');
      expect(names).toContain('onDestroy');
      expect(names).toContain('onEnable');
      expect(names).toContain('onDisable');
    });
  });

  describe('Non-lifecycle functions', () => {
    it('should ignore non-lifecycle functions', () => {
      const code = `
        function helper() {
          return 42;
        }

        function onStart() {
          helper();
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(1);
      expect(ast.lifecycles[0].name).toBe('onStart');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty script', () => {
      const code = '';
      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(0);
    });

    it('should handle only whitespace', () => {
      const code = '   \n\t  ';
      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(0);
    });

    it('should handle empty function body', () => {
      const code = `
        function onStart() {
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].body.trim()).toBe('');
    });

    it('should handle single-line function', () => {
      const code = 'function onStart() { console.log("test"); }';

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].body).toContain('console.log');
    });
  });

  describe('Complex patterns', () => {
    it('should parse function with string containing braces', () => {
      const code = `
        function onStart() {
          console.log("{ test }");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles[0].body).toContain('console.log');
      expect(ast.lifecycles[0].body).toContain('"{ test }"');
    });

    it('should parse function with object literals', () => {
      const code = `
        function onStart() {
          const obj = { x: 1, y: 2 };
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      // Tokenizer doesn't preserve exact whitespace, just verify structure
      expect(ast.lifecycles[0].body).toContain('const');
      expect(ast.lifecycles[0].body).toContain('obj');
      expect(ast.lifecycles[0].body).toContain('{');
      expect(ast.lifecycles[0].body).toContain('}');
    });
  });

  describe('Mixed declaration styles', () => {
    it('should parse mixed function and arrow function declarations', () => {
      const code = `
        function onStart() {
          console.log("function");
        }

        const onUpdate = () => {
          console.log("arrow");
        }
      `;

      const ast = parser.parse(code);

      expect(ast.isValid).toBe(true);
      expect(ast.lifecycles).toHaveLength(2);
      expect(ast.lifecycles[0].name).toBe('onStart');
      expect(ast.lifecycles[1].name).toBe('onUpdate');
    });
  });
});
