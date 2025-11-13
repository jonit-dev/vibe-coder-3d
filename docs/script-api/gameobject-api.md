# GameObject API

The GameObject API provides comprehensive tools for creating, modifying, and managing entities at runtime. It's the primary tool for procedural content generation, dynamic object creation, and runtime entity manipulation.

## Overview

The GameObject API includes:

- Creating empty entities and primitive shapes
- Loading models from files
- Component attachment and management
- Entity hierarchy manipulation
- Runtime entity creation with full customization

## Core Methods

### `gameObject.createEntity(name, parent)`

Create a new empty entity.

**Parameters:**

- `name` (string, optional): Entity name (default: "Entity")
- `parent` (number, optional): Parent entity ID

**Returns:**

- `number`: Entity ID of the created entity

**Example:**

```javascript
function createEmptyObject() {
  const entityId = gameObject.createEntity('MyCustomObject');
  console.log('Created entity with ID:', entityId);
  return entityId;
}

function createChildObject(parentId) {
  const childId = gameObject.createEntity('ChildObject', parentId);
  console.log('Created child entity with ID:', childId);
  return childId;
}
```

### `gameObject.createPrimitive(kind, options)`

Create a primitive shape entity.

**Parameters:**

- `kind` ('cube' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'torus'): Primitive type
- `options` (object, optional): Creation options

**Options:**

- `name` (string): Entity name
- `parent` (number): Parent entity ID
- `transform` (object): Position, rotation, scale
- `material` (object): Color, metalness, roughness
- `physics` (object): Body type, collider, mass

**Returns:**

- `number`: Entity ID of the created primitive

**Example:**

```javascript
function createBasicCube() {
  const cubeId = gameObject.createPrimitive('cube', {
    name: 'RedCube',
    transform: { position: [0, 1, 0] },
    material: { color: '#ff0000' },
    physics: { body: 'dynamic', collider: 'box' },
  });
  return cubeId;
}
```

### `gameObject.createModel(model, options)`

Create a model entity from GLB/GLTF file.

**Parameters:**

- `model` (string): Path or asset ID of model file
- `options` (object, optional): Creation options

**Options:**

- `name` (string): Entity name
- `parent` (number): Parent entity ID
- `transform` (object): Position, rotation, scale
- `material` (object): Color overrides
- `physics` (object): Body type, collider, mass

**Returns:**

- `number`: Entity ID of the created model

**Example:**

```javascript
function loadCharacterModel() {
  const characterId = gameObject.createModel('/assets/characters/hero.glb', {
    name: 'HeroCharacter',
    transform: { position: [5, 0, 0], scale: 1 },
    physics: { body: 'dynamic', collider: 'capsule', mass: 1 },
  });
  return characterId;
}
```

### `gameObject.clone(source, overrides)`

Clone an existing entity with optional overrides.

**Parameters:**

- `source` (number): Entity ID to clone
- `options` (object, optional): Override options

**Options:**

- `name` (string): New entity name
- `parent` (number): New parent entity ID
- `transform` (object): Position, rotation, scale overrides

**Returns:**

- `number`: Entity ID of the cloned entity

**Example:**

```javascript
function duplicateEnemy(originalId) {
  const cloneId = gameObject.clone(originalId, {
    name: 'EnemyClone',
    transform: { position: [10, 0, 5] },
  });
  return cloneId;
}
```

### `gameObject.attachComponents(entityId, components)`

Attach components to an entity.

**Parameters:**

- `entityId` (number): Target entity ID
- `components` (Array): Array of components to attach

**Example:**

```javascript
function addComponentsToEntity(entityId) {
  gameObject.attachComponents(entityId, [
    { type: 'Light', data: { lightType: 'point', color: '#ffffff', intensity: 1 } },
    { type: 'Health', data: { current: 100, max: 100 } },
    { type: 'EnemyTag', data: {} },
  ]);
}
```

### `gameObject.setParent(entityId, parent)`

Set parent of an entity.

**Parameters:**

- `entityId` (number): Entity to reparent
- `parent` (number, optional): New parent entity ID (undefined = root)

**Example:**

```javascript
function attachWeaponToCharacter(characterId, weaponId) {
  gameObject.setParent(weaponId, characterId);
  console.log(`Attached weapon ${weaponId} to character ${characterId}`);
}
```

### `gameObject.setActive(entityId, active)`

Set active state of an entity.

**Parameters:**

- `entityId` (number): Target entity ID
- `active` (boolean): Active state

**Example:**

```javascript
function hideObject(entityId) {
  gameObject.setActive(entityId, false);
}

function showObject(entityId) {
  gameObject.setActive(entityId, true);
}
```

### `gameObject.destroy(target)`

Destroy an entity.

**Parameters:**

- `target` (number, optional): Entity ID to destroy (default: current entity)

**Example:**

```javascript
function destroyObject(entityId) {
  gameObject.destroy(entityId);
  console.log(`Destroyed entity ${entityId}`);
}

function destroySelf() {
  gameObject.destroy(); // Destroys current entity
}
```

## Complete Examples

### Procedural Level Generator

```javascript
const LevelGenerator = {
  tileSize: 2,
  levelSize: 20,
  levelData: [],
  generatedEntities: [],

  generateLevel(seed = Math.random()) {
    console.log(`Generating level with seed: ${seed}`);
    this.clearLevel();

    // Initialize level data
    this.levelData = Array(this.levelSize)
      .fill(null)
      .map(() => Array(this.levelSize).fill(0));

    // Generate terrain using noise-like pattern
    this.generateTerrain();

    // Place structures
    this.placeStructures();

    // Spawn entities
    this.spawnEnemies();
    this.spawnPickups();

    console.log(`Generated level with ${this.generatedEntities.length} entities`);
    return this.generatedEntities;
  },

  generateTerrain() {
    // Simple terrain generation pattern
    for (let x = 0; x < this.levelSize; x++) {
      for (let z = 0; z < this.levelSize; z++) {
        const height = this.calculateHeight(x, z);
        this.levelData[x][z] = height;

        if (height > 0) {
          this.createTile(x, height, z);
        }
      }
    }
  },

  calculateHeight(x, z) {
    // Simple height calculation using sine waves
    const centerX = this.levelSize / 2;
    const centerZ = this.levelSize / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);

    const height = Math.sin(distance * 0.3) * 2 + Math.cos(x * 0.5) * 1;
    return Math.max(0, Math.floor(height));
  },

  createTile(x, height, z) {
    const worldX = (x - this.levelSize / 2) * this.tileSize;
    const worldY = height * this.tileSize;
    const worldZ = (z - this.levelSize / 2) * this.tileSize;

    // Create ground tile
    const tileId = gameObject.createPrimitive('cube', {
      name: `Tile_${x}_${z}`,
      transform: {
        position: [worldX, worldY / 2, worldZ],
        scale: [this.tileSize, worldY, this.tileSize],
      },
      material: {
        color: this.getTileColor(x, z, height),
        roughness: 0.8,
      },
      physics: {
        body: 'static',
        collider: 'box',
      },
    });

    this.generatedEntities.push(tileId);

    // Add grass on top if height is 1
    if (height === 1) {
      const grassId = gameObject.createPrimitive('plane', {
        name: `Grass_${x}_${z}`,
        transform: {
          position: [worldX, worldY + 0.01, worldZ],
          rotation: [-90, 0, 0],
          scale: [this.tileSize, this.tileSize, 1],
        },
        material: {
          color: '#228B22',
        },
      });

      gameObject.setParent(grassId, tileId);
      this.generatedEntities.push(grassId);
    }
  },

  getTileColor(x, z, height) {
    // Color based on height
    if (height <= 1) return '#8B7355'; // Brown
    if (height <= 2) return '#696969'; // Gray
    if (height <= 3) return '#2F4F4F'; // Dark gray
    return '#FFFFFF'; // White for snow
  },

  placeStructures() {
    // Place a few structures around the level
    const structureCount = Math.floor(this.levelSize / 5);

    for (let i = 0; i < structureCount; i++) {
      const x = Math.floor(Math.random() * this.levelSize);
      const z = Math.floor(Math.random() * this.levelSize);

      if (this.levelData[x] && this.levelData[x][z] > 0) {
        this.createStructure(x, z);
      }
    }
  },

  createStructure(x, z) {
    const worldX = (x - this.levelSize / 2) * this.tileSize;
    const worldY = this.levelData[x][z] * this.tileSize;
    const worldZ = (z - this.levelSize / 2) * this.tileSize;

    // Create a simple tower
    const baseId = gameObject.createPrimitive('cylinder', {
      name: `Tower_${x}_${z}`,
      transform: {
        position: [worldX, worldY + 1, worldZ],
        scale: [1, 2, 1],
      },
      material: {
        color: '#8B4513',
        roughness: 0.7,
      },
      physics: {
        body: 'static',
        collider: 'cylinder',
      },
    });

    this.generatedEntities.push(baseId);

    // Add a roof
    const roofId = gameObject.createPrimitive('cone', {
      name: `TowerRoof_${x}_${z}`,
      transform: {
        position: [worldX, worldY + 3, worldZ],
        scale: [1.5, 1, 1.5],
      },
      material: {
        color: '#8B0000',
      },
    });

    gameObject.setParent(roofId, baseId);
    this.generatedEntities.push(roofId);

    // Add a light
    gameObject.attachComponents(baseId, [
      {
        type: 'Light',
        data: {
          lightType: 'point',
          color: '#FFFF99',
          intensity: 0.5,
          range: 10,
        },
      },
    ]);
  },

  spawnEnemies() {
    const enemyCount = Math.floor((this.levelSize * this.levelSize) / 50);

    for (let i = 0; i < enemyCount; i++) {
      const x = Math.floor(Math.random() * this.levelSize);
      const z = Math.floor(Math.random() * this.levelSize);

      if (this.levelData[x] && this.levelData[x][z] > 0) {
        this.spawnEnemy(x, z);
      }
    }
  },

  spawnEnemy(x, z) {
    const worldX = (x - this.levelSize / 2) * this.tileSize;
    const worldY = this.levelData[x][z] * this.tileSize + 2;
    const worldZ = (z - this.levelSize / 2) * this.tileSize;

    const enemyId = gameObject.createPrimitive('sphere', {
      name: 'Enemy',
      transform: {
        position: [worldX, worldY, worldZ],
        scale: 0.8,
      },
      material: {
        color: '#FF0000',
        roughness: 0.5,
      },
      physics: {
        body: 'dynamic',
        collider: 'sphere',
        mass: 1,
      },
    });

    // Add enemy components
    gameObject.attachComponents(enemyId, [
      {
        type: 'Health',
        data: { current: 50, max: 50 },
      },
      {
        type: 'EnemyTag',
        data: {},
      },
      {
        type: 'Movement',
        data: { speed: 2.0, patrolRadius: 5 },
      },
    ]);

    this.generatedEntities.push(enemyId);
  },

  spawnPickups() {
    const pickupCount = Math.floor((this.levelSize * this.levelSize) / 80);

    for (let i = 0; i < pickupCount; i++) {
      const x = Math.floor(Math.random() * this.levelSize);
      const z = Math.floor(Math.random() * this.levelSize);

      if (this.levelData[x] && this.levelData[x][z] > 0) {
        this.spawnPickup(x, z);
      }
    }
  },

  spawnPickup(x, z) {
    const worldX = (x - this.levelSize / 2) * this.tileSize;
    const worldY = this.levelData[x][z] * this.tileSize + 1;
    const worldZ = (z - this.levelSize / 2) * this.tileSize;

    const pickupType = Math.random() < 0.7 ? 'health' : 'ammo';
    const color = pickupType === 'health' ? '#00FF00' : '#0080FF';

    const pickupId = gameObject.createPrimitive('torus', {
      name: `${pickupType}Pickup`,
      transform: {
        position: [worldX, worldY, worldZ],
        scale: [0.3, 0.3, 0.3],
      },
      material: {
        color: color,
        metalness: 0.8,
        roughness: 0.2,
      },
      physics: {
        body: 'kinematic',
        collider: 'capsule',
      },
    });

    gameObject.attachComponents(pickupId, [
      {
        type: 'PickupTag',
        data: { type: pickupType, value: 25 },
      },
      {
        type: 'Rotation',
        data: { speed: 90 },
      },
    ]);

    this.generatedEntities.push(pickupId);
  },

  clearLevel() {
    console.log(`Clearing level (${this.generatedEntities.length} entities)`);
    this.generatedEntities.forEach((entityId) => {
      gameObject.destroy(entityId);
    });
    this.generatedEntities = [];
    this.levelData = [];
  },

  regenerate() {
    this.clearLevel();
    return this.generateLevel();
  },
};

function onStart() {
  // Generate initial level
  LevelGenerator.generateLevel();

  // Create spawn point
  const spawnPointId = gameObject.createPrimitive('plane', {
    name: 'SpawnPoint',
    transform: {
      position: [0, 1, 0],
      scale: [4, 4, 1],
    },
    material: {
      color: '#00FF00',
      opacity: 0.5,
    },
  });

  // Attach a light to spawn point
  gameObject.attachComponents(spawnPointId, [
    {
      type: 'Light',
      data: {
        lightType: 'point',
        color: '#00FF00',
        intensity: 1.0,
        range: 15,
      },
    },
  ]);

  console.log('Level generation complete');
}
```

### Character Creator System

```javascript
const CharacterCreator = {
  bodyParts: {
    head: { primitive: 'sphere', scale: [0.5, 0.5, 0.5] },
    torso: { primitive: 'cylinder', scale: [0.8, 1.2, 0.6] },
    leftArm: { primitive: 'cylinder', scale: [0.15, 0.8, 0.15] },
    rightArm: { primitive: 'cylinder', scale: [0.15, 0.8, 0.15] },
    leftLeg: { primitive: 'cylinder', scale: [0.2, 1.0, 0.2] },
    rightLeg: { primitive: 'cylinder', scale: [0.2, 1.0, 0.2] },
  },

  colors: {
    skin: ['#FDBCB4', '#F1C27D', '#E0AC69', '#C68642'],
    hair: ['#000000', '#8B4513', '#FFD700', '#FF6347'],
    clothes: ['#0000FF', '#FF0000', '#00FF00', '#FFD700', '#800080'],
  },

  createCharacter(options = {}) {
    const characterId = gameObject.createEntity('Character');
    console.log(`Creating character with ID: ${characterId}`);

    // Character customization options
    const config = {
      skinColor: this.colors.skin[0],
      hairColor: this.colors.hair[0],
      clothesColor: this.colors.clothes[0],
      ...options,
    };

    // Create body parts
    const bodyParts = this.createBodyParts(characterId, config);

    // Assemble character
    this.assembleCharacter(characterId, bodyParts);

    // Add character components
    this.addCharacterComponents(characterId, config);

    return characterId;
  },

  createBodyParts(rootId, config) {
    const parts = {};

    Object.entries(this.bodyParts).forEach(([partName, partConfig]) => {
      const partId = gameObject.createPrimitive(partConfig.primitive, {
        name: `Character_${partName}`,
        transform: {
          position: [0, 0, 0],
          scale: partConfig.scale,
        },
        material: {
          color: config.skinColor,
          roughness: 0.8,
        },
        physics:
          partName === 'torso'
            ? {
                body: 'dynamic',
                collider: 'capsule',
                mass: 1,
              }
            : undefined,
      });

      parts[partName] = partId;
      gameObject.setParent(partId, rootId);
    });

    return parts;
  },

  assembleCharacter(rootId, parts) {
    // Position torso as base
    const torso = entities.get(parts.torso);
    if (torso) {
      torso.transform.setPosition(0, 0, 0);
    }

    // Position head on torso
    const head = entities.get(parts.head);
    if (head && torso) {
      const torsoPos = torso.transform.position;
      head.transform.setPosition(torsoPos[0], torsoPos[1] + 1.2, torsoPos[2]);
    }

    // Position arms
    const leftArm = entities.get(parts.leftArm);
    const rightArm = entities.get(parts.rightArm);
    if (leftArm && rightArm && torso) {
      const torsoPos = torso.transform.position;

      leftArm.transform.setPosition(torsoPos[0] - 0.5, torsoPos[1] + 0.4, torsoPos[2]);

      rightArm.transform.setPosition(torsoPos[0] + 0.5, torsoPos[1] + 0.4, torsoPos[2]);
    }

    // Position legs
    const leftLeg = entities.get(parts.leftLeg);
    const rightLeg = entities.get(parts.rightLeg);
    if (leftLeg && rightLeg && torso) {
      const torsoPos = torso.transform.position;

      leftLeg.transform.setPosition(torsoPos[0] - 0.2, torsoPos[1] - 1.0, torsoPos[2]);

      rightLeg.transform.setPosition(torsoPos[0] + 0.2, torsoPos[1] - 1.0, torsoPos[2]);
    }

    // Add clothes (colored cylinders over torso)
    this.addClothes(parts.torso, config.clothesColor);

    // Add hair
    this.addHair(parts.head, config.hairColor);
  },

  addClothes(torsoId, clothesColor) {
    const clothesId = gameObject.createPrimitive('cylinder', {
      name: 'Character_Clothes',
      transform: {
        position: [0, 0, 0],
        scale: [0.85, 1.1, 0.65],
      },
      material: {
        color: clothesColor,
        roughness: 0.9,
      },
    });

    gameObject.setParent(clothesId, torsoId);

    // Position slightly in front of torso
    const clothes = entities.get(clothesId);
    const torso = entities.get(torsoId);
    if (clothes && torso) {
      const torsoPos = torso.transform.position;
      clothes.transform.setPosition(torsoPos[0], torsoPos[1], torsoPos[2] + 0.01);
    }
  },

  addHair(headId, hairColor) {
    const hairId = gameObject.createPrimitive('sphere', {
      name: 'Character_Hair',
      transform: {
        position: [0, 0.1, 0],
        scale: [0.55, 0.6, 0.55],
      },
      material: {
        color: hairColor,
        roughness: 0.6,
      },
    });

    gameObject.setParent(hairId, headId);
  },

  addCharacterComponents(characterId, config) {
    gameObject.attachComponents(characterId, [
      {
        type: 'Health',
        data: { current: 100, max: 100 },
      },
      {
        type: 'PlayerTag',
        data: {},
      },
      {
        type: 'Movement',
        data: { speed: 5.0 },
      },
      {
        type: 'CharacterController',
        data: {
          height: 1.8,
          radius: 0.3,
          slopeLimit: 45,
          stepOffset: 0.4,
        },
      },
    ]);

    // Add camera as child
    const cameraId = gameObject.createPrimitive('camera_placeholder', {
      name: 'CharacterCamera',
      transform: {
        position: [0, 1.6, 0],
      },
    });

    gameObject.attachComponents(cameraId, [
      {
        type: 'Camera',
        data: {
          fov: 75,
          near: 0.1,
          far: 1000,
          isMain: true,
        },
      },
    ]);

    gameObject.setParent(cameraId, characterId);
  },

  createCharacterVariations(count = 10) {
    const characters = [];

    for (let i = 0; i < count; i++) {
      const config = {
        skinColor: this.colors.skin[Math.floor(Math.random() * this.colors.skin.length)],
        hairColor: this.colors.hair[Math.floor(Math.random() * this.colors.hair.length)],
        clothesColor: this.colors.clothes[Math.floor(Math.random() * this.colors.clothes.length)],
      };

      const characterId = this.createCharacter(config);

      // Position character in a circle
      const angle = (i / count) * 2 * Math.PI;
      const radius = 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const character = entities.get(characterId);
      if (character) {
        character.transform.setPosition(x, 0, z);
        character.transform.setRotation(0, -angle * (180 / Math.PI), 0);
      }

      characters.push(characterId);
    }

    return characters;
  },
};

function onStart() {
  // Create player character
  const playerId = CharacterCreator.createCharacter({
    skinColor: CharacterCreator.colors.skin[1],
    hairColor: CharacterCreator.colors.hair[1],
    clothesColor: CharacterCreator.colors.clothes[0],
  });

  const player = entities.get(playerId);
  if (player) {
    player.transform.setPosition(0, 0, 0);
  }

  // Create NPC characters
  timer.setTimeout(() => {
    CharacterCreator.createCharacterVariations(5);
  }, 1000);

  console.log('Character creation complete');
}
```

### Weapon System

```javascript
const WeaponSystem = {
  weaponTypes: {
    pistol: {
      model: '/weapons/pistol.glb',
      scale: 0.1,
      damage: 15,
      fireRate: 0.3,
      recoil: 0.1,
    },
    rifle: {
      model: '/weapons/rifle.glb',
      scale: 0.15,
      damage: 25,
      fireRate: 0.1,
      recoil: 0.3,
    },
    shotgun: {
      model: '/weapons/shotgun.glb',
      scale: 0.2,
      damage: 80,
      fireRate: 1.0,
      recoil: 0.8,
      spread: 0.1,
    },
  },

  createWeapon(type, position, rotation = [0, 0, 0]) {
    const weaponConfig = this.weaponTypes[type];
    if (!weaponConfig) {
      console.error(`Unknown weapon type: ${type}`);
      return null;
    }

    // Try to load model, fallback to primitive
    let weaponId;
    try {
      weaponId = gameObject.createModel(weaponConfig.model, {
        name: `Weapon_${type}`,
        transform: {
          position: position,
          rotation: rotation,
          scale: weaponConfig.scale,
        },
        physics: {
          body: 'kinematic',
          collider: 'box',
          mass: 0.1,
        },
      });
    } catch (error) {
      console.warn(`Failed to load weapon model ${weaponConfig.model}, using primitive`);
      weaponId = this.createWeaponPrimitive(type, position, rotation, weaponConfig);
    }

    if (!weaponId) return null;

    // Add weapon components
    gameObject.attachComponents(weaponId, [
      {
        type: 'WeaponTag',
        data: {
          weaponType: type,
          damage: weaponConfig.damage,
          fireRate: weaponConfig.fireRate,
          recoil: weaponConfig.recoil,
          spread: weaponConfig.spread || 0,
        },
      },
      {
        type: 'PickupTag',
        data: {},
      },
    ]);

    // Create pickup effect
    this.createPickupEffect(weaponId);

    console.log(`Created ${type} weapon with ID: ${weaponId}`);
    return weaponId;
  },

  createWeaponPrimitive(type, position, rotation, config) {
    const primitiveMap = {
      pistol: 'cube',
      rifle: 'box',
      shotgun: 'cube',
    };

    const scaleMap = {
      pistol: [0.1, 0.05, 0.3],
      rifle: [0.15, 0.08, 0.5],
      shotgun: [0.2, 0.1, 0.6],
    };

    return gameObject.createPrimitive(primitiveMap[type] || 'cube', {
      name: `Weapon_${type}`,
      transform: {
        position: position,
        rotation: rotation,
        scale: scaleMap[type] || [0.1, 0.1, 0.3],
      },
      material: {
        color: '#2F4F4F',
        metalness: 0.8,
        roughness: 0.2,
      },
      physics: {
        body: 'kinematic',
        collider: 'box',
        mass: 0.1,
      },
    });
  },

  createPickupEffect(weaponId) {
    // Create glow effect
    const glowId = gameObject.createPrimitive('sphere', {
      name: 'WeaponGlow',
      transform: {
        position: [0, 0, 0],
        scale: [1.5, 1.5, 1.5],
      },
      material: {
        color: '#FFFF00',
        opacity: 0.3,
      },
    });

    gameObject.setParent(glowId, weaponId);

    // Add rotation animation
    gameObject.attachComponents(glowId, [
      {
        type: 'Rotation',
        data: { speed: 30, axis: [0, 1, 0] },
      },
    ]);
  },

  attachWeaponToCharacter(characterId, weaponId) {
    const character = entities.get(characterId);
    const weapon = entities.get(weaponId);

    if (!character || !weapon) return false;

    // Find hand position (approximate)
    const handPosition = [0.3, 0.8, 0.2];

    // Parent weapon to character
    gameObject.setParent(weaponId, characterId);

    // Position weapon in hand
    weapon.transform.setPosition(handPosition[0], handPosition[1], handPosition[2]);
    weapon.transform.setRotation(0, 0, -90); // Point forward

    // Remove pickup components
    // Note: This would require component removal functionality

    console.log(`Attached weapon to character ${characterId}`);
    return true;
  },

  createWeaponRack(position, types = ['pistol', 'rifle', 'shotgun']) {
    const rackId = gameObject.createEntity('WeaponRack');

    // Create rack base
    const baseId = gameObject.createPrimitive('box', {
      name: 'WeaponRack_Base',
      transform: {
        position: [position[0], position[1], position[2]],
        scale: [3, 0.1, 1],
      },
      material: {
        color: '#8B4513',
        roughness: 0.9,
      },
      physics: {
        body: 'static',
        collider: 'box',
      },
    });

    gameObject.setParent(baseId, rackId);

    // Create rack posts
    for (let i = 0; i < 4; i++) {
      const postX = position[0] + (i % 2) * 2.8 - 1.4;
      const postZ = position[2] + Math.floor(i / 2) * 0.8 - 0.4;

      const postId = gameObject.createPrimitive('cylinder', {
        name: `WeaponRack_Post_${i}`,
        transform: {
          position: [postX, position[1] + 0.5, postZ],
          scale: [0.05, 1, 0.05],
        },
        material: {
          color: '#654321',
          roughness: 0.8,
        },
        physics: {
          body: 'static',
          collider: 'cylinder',
        },
      });

      gameObject.setParent(postId, rackId);
    }

    // Place weapons on rack
    types.forEach((type, index) => {
      const weaponX = position[0] + (index % 2) * 2.2 - 1.1;
      const weaponZ = position[2] + Math.floor(index / 2) * 0.8 - 0.4;

      const weaponId = this.createWeapon(type, [weaponX, position[1] + 0.8, weaponZ]);
      if (weaponId) {
        const weapon = entities.get(weaponId);
        if (weapon) {
          weapon.transform.setRotation(0, 0, 0); // Lay flat on rack
        }
      }
    });

    return rackId;
  },
};

function onStart() {
  // Create weapon rack
  const rackId = WeaponSystem.createWeaponRack([5, 0, 5]);

  // Create individual weapons scattered around
  const weaponTypes = ['pistol', 'rifle', 'shotgun'];
  const weaponPositions = [
    [10, 1, 0],
    [-10, 1, 0],
    [0, 1, 10],
    [0, 1, -10],
  ];

  weaponPositions.forEach((position, index) => {
    const type = weaponTypes[index % weaponTypes.length];
    WeaponSystem.createWeapon(type, position);
  });

  console.log('Weapon system initialized');
}
```

## Best Practices

1. **Memory Management**: Always clean up created entities when no longer needed
2. **Hierarchy**: Use parent-child relationships for organized object structures
3. **Physics**: Set appropriate physics properties for realistic behavior
4. **Materials**: Use consistent materials for performance and visual cohesion
5. **Batching**: Group similar objects for better performance

## Performance Optimization

### Object Pooling

```javascript
const ObjectPool = {
  pools: new Map(),

  createPool(type, size) {
    const pool = [];
    for (let i = 0; i < size; i++) {
      const entityId = gameObject.createPrimitive('cube', {
        name: `Pooled_${type}_${i}`,
      });
      pool.push({ id: entityId, inUse: false });
    }
    this.pools.set(type, pool);
  },

  getFromPool(type) {
    const pool = this.pools.get(type);
    if (!pool) return null;

    const object = pool.find((obj) => !obj.inUse);
    if (object) {
      object.inUse = true;
      gameObject.setActive(object.id, true);
      return object.id;
    }

    return null;
  },

  returnToPool(type, entityId) {
    const pool = this.pools.get(type);
    if (!pool) return false;

    const object = pool.find((obj) => obj.id === entityId);
    if (object) {
      object.inUse = false;
      gameObject.setActive(object.id, false);
      return true;
    }

    return false;
  },
};
```

## Error Handling

- Validate entity IDs before using them
- Check for model file existence before loading
- Handle physics creation failures gracefully
- Verify component data before attachment
- Always confirm entity creation success before using entities

## Common Pitfalls

1. **Memory Leaks**: Forgetting to destroy created entities
2. **Physics Issues**: Creating physics bodies without proper mass or collision shapes
3. **Hierarchy Problems**: Creating circular parent-child relationships
4. **Component Conflicts**: Adding incompatible components to entities
5. **Scale Issues**: Using improper scale values that break physics
