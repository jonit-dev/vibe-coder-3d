import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { initializeECS } from '@/core/lib/ecs/init';
import Editor from '@/editor/Editor';

/**
 * Main App component
 */
export default function App() {
  // Initialize the new ECS system
  useEffect(() => {
    // Use a flag to prevent double registration in development StrictMode
    const isInitialized = (window as any).__ecsSystemInitialized;
    if (isInitialized) {
      console.log('ECS system already initialized, skipping...');
      return;
    }

    try {
      // Initialize the new component registry system
      initializeECS();
      console.log('✅ ECS System initialized successfully');
      (window as any).__ecsSystemInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize ECS System:', error);
      console.error('Error details:', error);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Editor />} />
      </Routes>
    </Router>
  );
}
