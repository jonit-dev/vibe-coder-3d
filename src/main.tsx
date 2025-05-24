import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('🔥🔥🔥 MAIN.TSX IS LOADING - THIS IS A TEST 🔥🔥🔥');

import { registerBuiltInComponents } from '@/core/lib/built-in-components';
import { componentRegistry } from '@/core/lib/component-registry';

import App from './App';
import './styles/index.css';

// Register built-in components before rendering the app
// Optionally keep these logs, or gate them behind a debug flag
console.log('[Main] 🚀 Starting component registration...');
console.log('[Main] Registry before registration:', componentRegistry.getAllComponents().length);
registerBuiltInComponents();
console.log('[Main] Registry after registration:', componentRegistry.getAllComponents().length);
console.log('[Main] ✅ Component registration complete');

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
