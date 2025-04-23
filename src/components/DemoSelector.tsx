import { useDemo } from '../game/stores/demoStore';

const categories = [
  {
    id: 'cameras',
    name: 'Camera System',
    description: 'Explore different camera types and behaviors',
  },
  { id: 'gameLoop', name: 'Game Loop', description: 'Explore the game engine loop system' },
  {
    id: 'physics',
    name: 'Physics System',
    description: 'Explore physics interactions with Rapier',
  },
] as const;

const cameraTypes = [
  {
    id: 'orbit',
    name: 'Orbit Camera',
    description: 'Standard orbit controls for debugging and model viewing',
  },
  {
    id: 'thirdPerson',
    name: 'Third Person',
    description: 'Follow camera with configurable offset',
  },
  { id: 'firstPerson', name: 'First Person', description: 'View from character perspective' },
  { id: 'fixed', name: 'Fixed Camera', description: 'Static camera with optional target tracking' },
  { id: 'cinematic', name: 'Cinematic', description: 'Scripted camera movements and sequences' },
] as const;

const gameLoopTypes = [
  {
    id: 'basic',
    name: 'Basic Game Loop',
    description: 'Demonstration of the core game engine loop',
  },
] as const;

const physicsTypes = [
  {
    id: 'basic',
    name: 'Basic Physics Demo',
    description: 'Interactive physics with boxes, spheres and colliders',
  },
  {
    id: 'advanced',
    name: 'Advanced Physics Demo',
    description: 'Joints, pendulums, seesaws, and interactive physics',
  },
] as const;

export const DemoSelector = () => {
  const { currentCategory, currentDemo, setCategory, setDemo, goBack } = useDemo();

  const containerStyle = {
    position: 'absolute' as const,
    top: 20,
    left: 20,
    background: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 8,
    color: 'white',
    fontFamily: 'sans-serif',
  };

  const buttonStyle = (isActive: boolean) => ({
    padding: '12px 20px',
    background: isActive ? '#4a9eff' : '#2a2a2a',
    border: 'none',
    borderRadius: 4,
    color: 'white',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
  });

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  };

  if (!currentCategory) {
    return (
      <div style={containerStyle}>
        <h2 style={{ margin: '0 0 16px 0' }}>Vibe Coder 3D Demos</h2>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategory(category.id)}
              style={buttonStyle(false)}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{category.name}</div>
              <div style={{ fontSize: '0.9em', opacity: 0.8 }}>{category.description}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Get demos based on current category
  const getDemosForCategory = () => {
    switch (currentCategory) {
      case 'cameras':
        return cameraTypes;
      case 'gameLoop':
        return gameLoopTypes;
      case 'physics':
        return physicsTypes;
      default:
        return [];
    }
  };

  // Get title based on current category
  const getCategoryTitle = () => {
    switch (currentCategory) {
      case 'cameras':
        return 'Camera System Demo';
      case 'gameLoop':
        return 'Game Loop Demo';
      case 'physics':
        return 'Physics System Demo';
      default:
        return 'Demo';
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button
          onClick={goBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '1.2em',
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0 }}>{getCategoryTitle()}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        {getDemosForCategory().map((demo) => (
          <button
            key={demo.id}
            onClick={() => setDemo(demo.id)}
            style={buttonStyle(currentDemo === demo.id)}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{demo.name}</div>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>{demo.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
