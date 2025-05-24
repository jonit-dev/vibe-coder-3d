import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import {
  registerBuiltInArchetypes,
  registerBuiltInComponentGroups,
  registerBuiltInComponents,
} from '@/core';
import Editor from '@/editor/Editor';
import { MainScene } from '@/game/scenes/MainScene';

/**
 * Main App component
 */
export default function App() {
  // Initialize component system globally
  useEffect(() => {
    console.log('🚀 Initializing Global Component System...');

    // Use a flag to prevent double registration in development StrictMode
    const isInitialized = (window as any).__componentSystemInitialized;
    if (isInitialized) {
      console.log('Component system already initialized, skipping...');
      return;
    }

    try {
      console.log('Registering built-in components...');
      registerBuiltInComponents();
      console.log('✅ Components registered');

      console.log('Registering built-in archetypes...');
      registerBuiltInArchetypes();
      console.log('✅ Archetypes registered');

      console.log('Registering built-in component groups...');
      registerBuiltInComponentGroups();
      console.log('✅ Component groups registered');

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
