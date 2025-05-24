import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('🔥🔥🔥 MAIN.TSX IS LOADING - THIS IS A TEST 🔥🔥🔥');

import { initializeComponentManager } from '@/core/dynamic-components/init';

import App from './App';
import './styles/index.css';

// Initialize the unified component manager system
console.log('[Main] 🚀 Initializing component manager...');
initializeComponentManager();
console.log('[Main] ✅ Component manager initialization complete');

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
