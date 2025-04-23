import Scene from '@core/components/Scene';
import Stats from '@core/components/Stats';
import { useEngineStore } from '@core/state/engineStore';
import HelloCube from '@game/components/world/HelloCube';

export default function MainScene() {
  const { debug } = useEngineStore();

  return (
    <Scene
      cameraPosition={[0, 2, 5]}
      background="#1a1a2e"
    >
      <axesHelper visible={debug} />
      <gridHelper visible={debug} />

      <HelloCube position={[0, 0, 0]} />
      <HelloCube position={[-2, 0, -1]} color="#4c72b0" />
      <HelloCube position={[2, 0, -1]} color="#55a868" />

      <Stats />
    </Scene>
  );
} 
