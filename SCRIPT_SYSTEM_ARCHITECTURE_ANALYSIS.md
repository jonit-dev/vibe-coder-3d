# Script System Architecture Analysis

## Current State Assessment

### What Works

- ✅ Scripts compile successfully (regex patterns match)
- ✅ Scripts execute (entity-7 shows executionCount: 65)
- ✅ Good API design with proper sandboxing
- ✅ Comprehensive APIs (13 different APIs exposed)
- ✅ Security through limited scope

### What's Broken

- ❌ Pattern-based approach fundamentally limited
- ❌ Can only support pre-defined regex patterns
- ❌ No real variables, conditionals, or loops
- ❌ TypeScript types promise full API but only patterns work
- ❌ Developer confusion and hidden limitations

## The Core Problem

**The regex-based compiler cannot handle real programming.**

Example issues:

```typescript
// ✅ Works - matches pattern
entity.transform.rotate(0, 0.01, 0);

// ❌ Breaks - variable not in pattern
const speed = 0.01;
entity.transform.rotate(0, speed, 0);

// ❌ Breaks - conditional
if (time.time > 5) {
  entity.transform.rotate(0, 0.01, 0);
}

// ❌ Breaks - loop
for (let i = 0; i < 3; i++) {
  console.log(i);
}
```

## Why Real Game Engines Don't Do This

### Unity

- Uses **real C# compiler** (Roslyn)
- Full language support
- Compile-time type checking
- JIT/AOT compilation for performance

### Unreal

- Uses **real C++ compiler** (Clang/MSVC)
- Or visual scripting (Blueprints) with proper node execution
- Full language features
- Native code performance

### Godot

- Uses **GDScript interpreter** with proper parser
- Or C# via Mono
- Real AST-based execution
- Proper debugger support

## Recommended Migration Path

### Option 1: Function() Constructor (Immediate Fix)

**Complexity:** Low
**Time:** 1-2 days
**Security:** Medium

Replace the parser/compiler/runner with direct Function() execution:

```typescript
// Current: 3 separate systems (Parser → Compiler → Runner)
const ast = parser.parse(code);
const compiled = compiler.compile(ast);
runner.run(compiled, context);

// Proposed: Direct execution
const scriptFn = new Function(
  'entity',
  'three',
  'time',
  'input',
  'math',
  'console',
  'events',
  'audio',
  'timer',
  'query',
  'prefab',
  'entities',
  'parameters',
  `
  'use strict';
  ${code}
  return { onStart, onUpdate, onDestroy, onEnable, onDisable };
  `,
);

const lifecycle = scriptFn(...Object.values(context));
lifecycle.onUpdate?.(time.deltaTime);
```

**Pros:**

- ✅ Supports ALL JavaScript features
- ✅ No pattern matching needed
- ✅ Still sandboxed (no outer scope access)
- ✅ Maintains existing API design
- ✅ Works with existing script files
- ✅ Simple implementation

**Cons:**

- ⚠️ CSP might block (can be configured)
- ⚠️ Less secure than VM
- ⚠️ No CPU/memory limits

### Option 2: QuickJS VM (Proper Solution)

**Complexity:** Medium
**Time:** 1-2 weeks
**Security:** High

Use a proper JavaScript VM in WebAssembly:

```typescript
import { newQuickJSWASMModuleFromVariant, mJs } from '@jitl/quickjs-wasmfile-release-sync';

class ScriptVM {
  private module: QuickJSWASMModule;

  async init() {
    this.module = await newQuickJSWASMModuleFromVariant(mJs());
  }

  execute(code: string, context: IScriptContext) {
    const vm = this.module.newContext();

    // Set up APIs
    const entity = vm.newObject();
    const transform = vm.newObject();
    transform.setProp(
      'rotate',
      vm.newFunction('rotate', (x, y, z) => {
        context.entity.transform.rotate(x, y, z);
      }),
    );
    entity.setProp('transform', transform);
    vm.setProp(vm.global, 'entity', entity);

    // Execute with timeout
    vm.runtime.setMemoryLimit(10 * 1024 * 1024); // 10MB
    vm.runtime.setMaxStackSize(512 * 1024); // 512KB

    const result = vm.evalCode(code);

    vm.dispose();
    return result;
  }
}
```

**Pros:**

- ✅ True sandboxing with limits
- ✅ Enforces CPU/memory quotas
- ✅ Full JavaScript support
- ✅ Can't access browser APIs
- ✅ Production-ready security

**Cons:**

- ⚠️ More complex setup
- ⚠️ ~1MB WASM bundle
- ⚠️ Learning curve
- ⚠️ Performance overhead

### Option 3: TypeScript Compilation + Sandboxing

**Complexity:** High
**Time:** 2-4 weeks
**Security:** Medium-High

Actually compile TypeScript and run in sandboxed iframe:

```typescript
import * as ts from 'typescript';

class TypeScriptScriptExecutor {
  compile(code: string): string {
    const result = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
    });
    return result.outputText;
  }

  execute(compiled: string, context: IScriptContext) {
    // Use sandboxed iframe with postMessage
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.srcdoc = `
      <script>
        const entity = ${JSON.stringify(context.entity)};
        ${compiled}
        parent.postMessage({ type: 'result', data: { onStart, onUpdate } }, '*');
      </script>
    `;
  }
}
```

**Pros:**

- ✅ Real TypeScript support
- ✅ Type checking
- ✅ Good security
- ✅ Familiar developer experience

**Cons:**

- ⚠️ Complex iframe communication
- ⚠️ Serialization overhead
- ⚠️ Harder to debug
- ⚠️ Large TypeScript bundle

## Recommendation: Start with Option 1

**Why:**

1. **Immediate impact** - fixes the fundamental limitation today
2. **Low risk** - small code change, big improvement
3. **Preserves existing work** - all your API design stays
4. **Easy to migrate** - can move to VM later
5. **Proven approach** - many tools use Function() constructor

**Migration Steps:**

1. **Add feature flag** (1 hour)

   ```typescript
   const USE_DIRECT_EXECUTION = import.meta.env.VITE_DIRECT_SCRIPT_EXECUTION === 'true';
   ```

2. **Implement direct execution** (4 hours)

   - Create `DirectScriptExecutor.ts`
   - Wire into `ScriptSystem.ts`
   - Test with existing scripts

3. **Test thoroughly** (4 hours)

   - Run all integration tests
   - Test with complex scripts
   - Check performance

4. **Document** (2 hours)

   - Update script API docs
   - Add examples of new capabilities
   - Migration guide for users

5. **Enable by default** (1 hour)
   - Remove old parser/compiler/runner
   - Clean up dead code

**Total time:** ~2 days

## What About Your Current Issue?

The script `entity.transform.rotate(0, deltaTime * 0.5, 0)` **should work** with the current system. The regex matches it correctly.

**Likely causes:**

1. ✅ Script IS executing (executionCount: 65 proves it)
2. ❓ Transform updates not syncing to Three.js
3. ❓ Rotation happening but not visible
4. ❓ Some other system conflict

**Debug steps:**

1. Check browser console for "Rotating" log
2. Add logger to OperationsRegistry.ts to see opcodes
3. Check if Transform component is actually updating
4. Verify Three.js object is connected

Let me know which option you prefer and I can help implement it!
