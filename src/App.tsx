import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Editor from '@/components/Editor';
import { MainScene } from '@/game/scenes/MainScene';

/**
 * Main App component
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScene />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </Router>
  );
}
