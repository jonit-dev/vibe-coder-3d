import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Initialize ECS system for tests
import { initializeCoreECS } from '../core/lib/ecs/init';
initializeCoreECS();

// Global cleanup after each test to prevent memory leaks
afterEach(() => {
  // Clear DirectScriptExecutor singleton to prevent context/timer accumulation
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DirectScriptExecutor } = require('../core/lib/scripting/DirectScriptExecutor');
    const executor = DirectScriptExecutor.getInstance();
    executor.clearAll();
  } catch {
    // DirectScriptExecutor may not be loaded in all tests
  }

  // Clear global event bus handlers to prevent cross-test leaks
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { clearAllEvents, flushBatchedEvents } = require('../core/lib/events');
    flushBatchedEvents();
    clearAllEvents();
  } catch {
    // events module may not be used in all tests
  }
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0) as unknown as number);
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock WebGL context for Three.js
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        // Basic WebGL mock
        createShader: vi.fn(),
        createProgram: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        useProgram: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        uniform1f: vi.fn(),
        uniform2f: vi.fn(),
        uniform3f: vi.fn(),
        uniform4f: vi.fn(),
        uniformMatrix4fv: vi.fn(),
        drawArrays: vi.fn(),
        drawElements: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        blendFunc: vi.fn(),
        clear: vi.fn(),
        clearColor: vi.fn(),
        clearDepth: vi.fn(),
        depthFunc: vi.fn(),
        viewport: vi.fn(),
        getExtension: vi.fn(),
        getParameter: vi.fn(() => 'WebGL mock'),
        getProgramParameter: vi.fn(() => true),
        getShaderParameter: vi.fn(() => true),
        getUniformLocation: vi.fn(),
        getAttribLocation: vi.fn(),
      };
    }
    return null;
  }),
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Worker
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  // Suppress specific React 19 warnings in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: componentWillMount') ||
      args[0].includes('three.js'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};
