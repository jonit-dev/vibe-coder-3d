import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { DemoSelector } from '../components/DemoSelector'
import { MenuBackground } from '../components/MenuBackground'
import { CameraDemo } from '../demos/CameraDemo'
import { useDemo } from '../stores/demoStore'

export const MainScene = () => {
  const { currentCategory, currentDemo } = useDemo()

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas>
        <Suspense fallback={null}>
          {currentCategory === 'cameras' ? (
            <>
              {currentDemo === 'orbit' && <CameraDemo type="orbit" />}
              {currentDemo === 'thirdPerson' && <CameraDemo type="thirdPerson" />}
              {currentDemo === 'firstPerson' && <CameraDemo type="firstPerson" />}
              {currentDemo === 'fixed' && <CameraDemo type="fixed" />}
              {currentDemo === 'cinematic' && <CameraDemo type="cinematic" />}

              {/* Default scene elements */}
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <gridHelper args={[20, 20]} />
              {!currentDemo && <OrbitControls />}
            </>
          ) : (
            <>
              <PerspectiveCamera
                makeDefault
                position={[0, 0, 15]}
                fov={50}
              />
              <MenuBackground />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
              />
            </>
          )}
        </Suspense>
      </Canvas>
      <DemoSelector />
    </div>
  )
} 
