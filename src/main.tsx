import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './styles/index.css';
import { Logger } from '@/core/lib/logger';

// Initialize custom shape discovery (old automatic system)
// import '@/core/lib/rendering/shapes/discovery';

// NOTE: Custom shapes are now defined as JSON data and rendered in Rust
// No TypeScript shape descriptors needed - shapes are registered via JSON configuration

// Configure logger based on environment
if (import.meta.env.PROD) {
  Logger.configureForProduction();
} else {
  Logger.configureForDevelopment();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
