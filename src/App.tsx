import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import HelloWorld from './core/components/HelloWorld';

export default function App() {
  return (
    <div className="app">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <HelloWorld position={[0, 0, 0]} />
        <OrbitControls />
      </Canvas>
    </div>
  );
} 
