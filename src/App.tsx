import DebugMenu from '@game/components/ui/DebugMenu';
import MainScene from '@game/scenes/MainScene';

export default function App() {
  return (
    <div className="app">
      <MainScene />
      <DebugMenu />
    </div>
  );
} 
