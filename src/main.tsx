import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './styles/index.css';
import { Logger } from '@/core/lib/logger';

// Initialize custom shape discovery
import '@/core/lib/rendering/shapes/discovery';

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
