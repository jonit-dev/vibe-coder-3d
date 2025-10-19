import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { EngineProvider } from '@core/context';
import { initializeECS } from '@/core/lib/ecs/init';
import { initPrefabs } from '@/core/prefabs';
import Editor from '@/editor/Editor';
import { GlobalAssetLoaderModal } from '@/editor/components/shared/GlobalAssetLoaderModal';
import { Logger } from '@core/lib/logger';

// Create logger for startup timing
const startupLogger = Logger.create('App:Startup');

// Record app start time globally
(window as { __appStartTime?: number }).__appStartTime = performance.now();

/**
 * Main App component
 */
export default function App() {
  // Initialize the new ECS system and prefabs
  useEffect(() => {
    // Use a flag to prevent double registration in development StrictMode
    const isInitialized = (window as { __ecsSystemInitialized?: boolean }).__ecsSystemInitialized;
    if (isInitialized) {
      return;
    }

    // Track ECS initialization
    initializeECS();
    (window as { __ecsSystemInitialized?: boolean }).__ecsSystemInitialized = true;

    // Initialize prefabs asynchronously
    initPrefabs().catch((error) => {
      startupLogger.error('Failed to initialize prefabs:', error);
    });
  }, []);

  return (
    <EngineProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Editor />} />
        </Routes>
        {/* Global modals */}
        <GlobalAssetLoaderModal />
      </Router>
    </EngineProvider>
  );
}
