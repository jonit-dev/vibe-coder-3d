import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { registerBuiltInArchetypes, registerBuiltInComponentGroups } from '@/core';
import { registerBuiltInComponents } from '@/core/dynamic-components/components/BuiltInComponents';
import { componentRegistry } from '@/core/lib/dynamic-components';
import Editor from '@/editor/Editor';
import { MainScene } from '@/game/scenes/MainScene';

/**
 * Main App component
 */
export default function App() {
  // Initialize component system globally with proper order
  useEffect(() => {
    // Remove verbose logs, keep only error logs or add a debug flag if needed
    // Use a flag to prevent double registration in development StrictMode
    const isInitialized = (window as any).__componentSystemInitialized;
    if (isInitialized) {
      console.log('Component system already initialized, skipping...');
      return;
    }

    try {
      // Step 1: Ensure built-in components are registered first
      console.log('Step 1: Registering built-in components...');
      registerBuiltInComponents(componentRegistry);
      console.log('✅ Built-in components registered');

      // Step 2: Register component groups
      console.log('Step 2: Registering built-in component groups...');
      registerBuiltInComponentGroups();
      console.log('✅ Component groups registered');

      // Step 3: Now register archetypes (they depend on components being available)
      console.log('Step 3: Registering built-in archetypes...');
      registerBuiltInArchetypes();
      console.log('✅ Archetypes registered');

      console.log('✅ Global Component System initialized successfully');
      (window as any).__componentSystemInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Global Component System:', error);
      console.error('Error details:', error);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScene />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </Router>
  );
}
