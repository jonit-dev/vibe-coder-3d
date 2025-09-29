import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { EngineProvider } from '@core/context';
import { initializeECS } from '@/core/lib/ecs/init';
import Editor from '@/editor/Editor';
import { GlobalAssetLoaderModal } from '@/editor/components/shared/GlobalAssetLoaderModal';

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

    try {
      // Initialize the new component registry system
      initializeECS();
      (window as { __ecsSystemInitialized?: boolean }).__ecsSystemInitialized = true;
    } catch (error) {
      // ECS initialization failed - this is a critical error
      throw error;
    }
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
