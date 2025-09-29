import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { EngineProvider } from '@core/context';
import { initializeECS } from '@/core/lib/ecs/init';
import Editor from '@/editor/Editor';
import { GlobalAssetLoaderModal } from '@/editor/components/shared/GlobalAssetLoaderModal';
import { Logger } from '@core/lib/logger';

// Create logger for startup timing
const startupLogger = Logger.create('App:Startup');

// Record app start time globally
(window as any).__appStartTime = performance.now();
startupLogger.milestone('App Start');

/**
 * Main App component
 */
export default function App() {
  // Initialize the new ECS system
  useEffect(() => {
    // Use a flag to prevent double registration in development StrictMode
    const isInitialized = (window as { __ecsSystemInitialized?: boolean }).__ecsSystemInitialized;
    if (isInitialized) {
      return;
    }

    // Track ECS initialization
    const completeECSInit = startupLogger.startTracker('ECS System Initialization');
    initializeECS();
    (window as { __ecsSystemInitialized?: boolean }).__ecsSystemInitialized = true;
    completeECSInit();

    startupLogger.milestone('App Initialization Complete');
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
