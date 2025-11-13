# Entities API

The Entities API provides powerful tools for finding, referencing, and managing entities across your game. It complements the local entity API by allowing you to work with any entity in the scene, not just the current one.

## Overview

The Entities API includes:

- Entity reference resolution from various identifier types
- Direct entity access by ID
- Entity searching by name and tags
- Entity existence checking

## Core Types

### IEntityRef

Entity reference structure that can identify entities in multiple ways:

```typescript
interface IEntityRef {
  entityId?: number; // Fast path when stable ID is available
  guid?: string; // Stable ID if available
  path?: string; // Scene path fallback (e.g., "Root/Enemy[2]/Weapon")
}
```

## Core Methods

### `entities.fromRef(ref)`

Resolve entity reference to entity API.

**Parameters:**

- `ref` (IEntityRef | number | string): Entity reference, ID, or path

**Returns:**

- `IEntityScriptAPI | null`: Entity API or null if not found

**Example:**

```javascript
// Using entity ID
const entity = entities.fromRef(123);

// Using GUID
const entity = entities.fromRef({ guid: 'abc-123-def-456' });

// Using scene path
const entity = entities.fromRef({ path: 'Root/Enemies/Enemy[0]' });

// Using direct ID (shorthand)
const entity = entities.fromRef(456);
```

### `entities.get(entityId)`

Get entity by ID.

**Parameters:**

- `entityId` (number): Entity ID

**Returns:**

- `IEntityScriptAPI | null`: Entity API or null if not found

**Example:**

```javascript
function onCollisionEnter(otherEntityId) {
  const other = entities.get(otherEntityId);
  if (other) {
    console.log('Collided with:', other.name);
    if (other.hasComponent('EnemyTag')) {
      takeDamage(10);
    }
  }
}
```

### `entities.findByName(name)`

Find entities by name.

**Parameters:**

- `name` (string): Entity name to search for

**Returns:**

- `IEntityScriptAPI[]`: Array of entities with matching name

**Example:**

```javascript
function findDoors() {
  const doors = entities.findByName('Door');
  console.log(`Found ${doors.length} doors`);

  doors.forEach((door) => {
    if (door.meshRenderer) {
      door.meshRenderer.material.setColor('#8B4513'); // Brown
    }
  });
}
```

### `entities.findByTag(tag)`

Find entities by tag.

**Parameters:**

- `tag` (string): Tag to search for

**Returns:**

- `IEntityScriptAPI[]`: Array of entities with matching tag

**Example:**

```javascript
function findEnemiesInRange(radius) {
  const enemies = entities.findByTag('enemy');
  const myPos = entity.transform.position;
  const nearbyEnemies = [];

  enemies.forEach((enemy) => {
    const enemyPos = enemy.transform.position;
    const distance = math.distance(
      myPos[0],
      myPos[1],
      myPos[2],
      enemyPos[0],
      enemyPos[1],
      enemyPos[2],
    );

    if (distance <= radius) {
      nearbyEnemies.push(enemy);
    }
  });

  return nearbyEnemies;
}
```

### `entities.exists(entityId)`

Check if entity exists.

**Parameters:**

- `entityId` (number): Entity ID to check

**Returns:**

- `boolean`: True if entity exists

**Example:**

```javascript
let targetId = null;

function onUpdate() {
  // Check if our target still exists
  if (targetId && !entities.exists(targetId)) {
    console.log('Target destroyed!');
    targetId = null;
    findNewTarget();
  }
}
```

## Complete Examples

### Team Management System

```javascript
const TeamSystem = {
  teams: new Map(), // entityId -> teamName
  teamMembers: new Map(), // teamName -> Set<entityId>

  addEntityToTeam(entityId, teamName) {
    // Remove from previous team if any
    this.removeEntityFromTeam(entityId);

    // Add to new team
    this.teams.set(entityId, teamName);
    if (!this.teamMembers.has(teamName)) {
      this.teamMembers.set(teamName, new Set());
    }
    this.teamMembers.get(teamName).add(entityId);

    console.log(`Entity ${entityId} joined team ${teamName}`);
    events.emit('team_changed', { entityId, teamName, action: 'joined' });
  },

  removeEntityFromTeam(entityId) {
    const oldTeam = this.teams.get(entityId);
    if (oldTeam && this.teamMembers.has(oldTeam)) {
      this.teamMembers.get(oldTeam).delete(entityId);
      if (this.teamMembers.get(oldTeam).size === 0) {
        this.teamMembers.delete(oldTeam);
      }
    }
    this.teams.delete(entityId);

    if (oldTeam) {
      console.log(`Entity ${entityId} left team ${oldTeam}`);
      events.emit('team_changed', { entityId, teamName: oldTeam, action: 'left' });
    }
  },

  getEntityTeam(entityId) {
    return this.teams.get(entityId);
  },

  getTeamMembers(teamName) {
    return this.teamMembers.get(teamName) || new Set();
  },

  isEnemy(entityId1, entityId2) {
    const team1 = this.getEntityTeam(entityId1);
    const team2 = this.getEntityTeam(entityId2);
    return team1 && team2 && team1 !== team2;
  },

  findEnemiesInRadius(entityId, radius) {
    const myTeam = this.getEntityTeam(entityId);
    const myPos = entities.get(entityId)?.transform.position;
    if (!myPos) return [];

    const enemies = [];
    this.teamMembers.forEach((members, teamName) => {
      if (teamName === myTeam) return; // Skip my own team

      members.forEach((memberId) => {
        const member = entities.get(memberId);
        if (!member || !member.isActive()) return;

        const memberPos = member.transform.position;
        const distance = math.distance(
          myPos[0],
          myPos[1],
          myPos[2],
          memberPos[0],
          memberPos[1],
          memberPos[2],
        );

        if (distance <= radius) {
          enemies.push({
            id: memberId,
            entity: member,
            distance: distance,
            team: teamName,
          });
        }
      });
    });

    // Sort by distance
    enemies.sort((a, b) => a.distance - b.distance);
    return enemies;
  },

  getTeamStats() {
    const stats = {};
    this.teamMembers.forEach((members, teamName) => {
      stats[teamName] = {
        memberCount: members.size,
        activeCount: Array.from(members).filter((id) => {
          const entity = entities.get(id);
          return entity && entity.isActive();
        }).length,
      };
    });
    return stats;
  },
};

function onStart() {
  // Initialize teams based on existing entities
  const enemies = entities.findByTag('enemy');
  enemies.forEach((enemy) => {
    TeamSystem.addEntityToTeam(enemy.id, 'enemies');
  });

  const players = entities.findByTag('player');
  players.forEach((player) => {
    TeamSystem.addEntityToTeam(player.id, 'players');
  });

  // Listen for new entities
  events.on('entity_spawned', (payload) => {
    if (payload.team) {
      TeamSystem.addEntityToTeam(payload.entityId, payload.team);
    }
  });
}

function onCollisionEnter(otherEntityId) {
  const otherTeam = TeamSystem.getEntityTeam(otherEntityId);
  const myTeam = TeamSystem.getEntityTeam(entity.id);

  if (otherTeam && myTeam && otherTeam !== myTeam) {
    console.log(`Hostile collision with ${otherTeam} team!`);
    takeDamage(5);
  }
}
```

### Entity Tracking System

```javascript
const EntityTracker = {
  trackedEntities: new Map(), // entityId -> tracking data
  updateInterval: null,

  startTracking(entityId, trackingData = {}) {
    const entity = entities.get(entityId);
    if (!entity) {
      console.error(`Cannot track non-existent entity: ${entityId}`);
      return false;
    }

    this.trackedEntities.set(entityId, {
      entity: entity,
      startTime: time.time,
      lastSeen: time.time,
      lastPosition: [...entity.transform.position],
      distanceTraveled: 0,
      trackingData: trackingData,
    });

    console.log(`Started tracking entity ${entityId} (${entity.name})`);
    return true;
  },

  stopTracking(entityId) {
    if (this.trackedEntities.has(entityId)) {
      const trackingData = this.trackedEntities.get(entityId);
      this.trackedEntities.delete(entityId);
      console.log(`Stopped tracking entity ${entityId}`);
      return trackingData;
    }
    return null;
  },

  updateTracking() {
    this.trackedEntities.forEach((trackingData, entityId) => {
      const entity = entities.get(entityId);
      if (!entity || !entity.isActive()) {
        console.log(`Tracked entity ${entityId} no longer exists or is inactive`);
        this.trackedEntities.delete(entityId);
        events.emit('tracking_lost', { entityId });
        return;
      }

      const currentPos = entity.transform.position;
      const lastPos = trackingData.lastPosition;

      // Calculate distance traveled
      const distance = math.distance(
        lastPos[0],
        lastPos[1],
        lastPos[2],
        currentPos[0],
        currentPos[1],
        currentPos[2],
      );

      if (distance > 0.01) {
        // Only count significant movement
        trackingData.distanceTraveled += distance;
        trackingData.lastPosition = [...currentPos];
        trackingData.lastSeen = time.time;

        // Emit movement event
        events.emit('entity_moved', {
          entityId: entityId,
          position: currentPos,
          distance: distance,
          totalDistance: trackingData.distanceTraveled,
        });
      }

      // Check for long inactivity
      const inactiveTime = time.time - trackingData.lastSeen;
      if (inactiveTime > 30) {
        // 30 seconds
        console.log(`Entity ${entityId} inactive for ${inactiveTime}s`);
        events.emit('entity_inactive', {
          entityId: entityId,
          inactiveTime: inactiveTime,
        });
      }
    });
  },

  getTrackedEntities() {
    return Array.from(this.trackedEntities.keys());
  },

  getTrackingData(entityId) {
    return this.trackedEntities.get(entityId);
  },

  getEntitiesInArea(center, radius) {
    const nearbyEntities = [];

    this.trackedEntities.forEach((trackingData, entityId) => {
      const distance = math.distance(
        center[0],
        center[1],
        center[2],
        trackingData.lastPosition[0],
        trackingData.lastPosition[1],
        trackingData.lastPosition[2],
      );

      if (distance <= radius) {
        nearbyEntities.push({
          entityId: entityId,
          entity: trackingData.entity,
          distance: distance,
          trackingData: trackingData,
        });
      }
    });

    nearbyEntities.sort((a, b) => a.distance - b.distance);
    return nearbyEntities;
  },

  generateReport() {
    const report = {
      totalTracked: this.trackedEntities.size,
      activeEntities: 0,
      totalDistance: 0,
      averageTrackingTime: 0,
    };

    const now = time.time;
    this.trackedEntities.forEach((trackingData) => {
      const entity = entities.get(trackingData.entity.id);
      if (entity && entity.isActive()) {
        report.activeEntities++;
      }

      report.totalDistance += trackingData.distanceTraveled;
      report.averageTrackingTime += now - trackingData.startTime;
    });

    if (report.totalTracked > 0) {
      report.averageTrackingTime /= report.totalTracked;
    }

    return report;
  },
};

function onStart() {
  // Start tracking all enemies
  const enemies = entities.findByTag('enemy');
  enemies.forEach((enemy) => {
    EntityTracker.startTracking(enemy.id, { type: 'enemy' });
  });

  // Track player
  const players = entities.findByTag('player');
  players.forEach((player) => {
    EntityTracker.startTracking(player.id, { type: 'player' });
  });

  // Start update loop
  EntityTracker.updateInterval = timer.setInterval(() => {
    EntityTracker.updateTracking();
  }, 1000);

  // Generate report every 30 seconds
  timer.setInterval(() => {
    const report = EntityTracker.generateReport();
    console.log('Entity Tracking Report:', report);
  }, 30000);
}

function onDestroy() {
  if (EntityTracker.updateInterval) {
    timer.clearInterval(EntityTracker.updateInterval);
  }
}
```

### Entity Registry and Catalog

```javascript
const EntityRegistry = {
  catalog: new Map(), // entityType -> Set<entityId>
  entityMetadata: new Map(), // entityId -> metadata
  typeHierarchy: new Map(), // entityType -> parentType
  searchIndex: new Map(), // property/value -> Set<entityId>

  registerEntity(entityId, entityType, metadata = {}) {
    const entity = entities.get(entityId);
    if (!entity) {
      console.error(`Cannot register non-existent entity: ${entityId}`);
      return false;
    }

    // Add to type catalog
    if (!this.catalog.has(entityType)) {
      this.catalog.set(entityType, new Set());
    }
    this.catalog.get(entityType).add(entityId);

    // Store metadata
    this.entityMetadata.set(entityId, {
      entityType: entityType,
      registeredAt: time.time,
      ...metadata,
    });

    // Index searchable properties
    this.indexEntityProperties(entityId, metadata);

    console.log(`Registered entity ${entityId} as type ${entityType}`);
    events.emit('entity_registered', { entityId, entityType, metadata });
    return true;
  },

  unregisterEntity(entityId) {
    const metadata = this.entityMetadata.get(entityId);
    if (!metadata) return false;

    // Remove from type catalog
    if (this.catalog.has(metadata.entityType)) {
      this.catalog.get(metadata.entityType).delete(entityId);
      if (this.catalog.get(metadata.entityType).size === 0) {
        this.catalog.delete(metadata.entityType);
      }
    }

    // Remove from search index
    this.removeEntityFromIndex(entityId);

    // Remove metadata
    this.entityMetadata.delete(entityId);

    console.log(`Unregistered entity ${entityId}`);
    events.emit('entity_unregistered', { entityId });
    return true;
  },

  indexEntityProperties(entityId, metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      const indexKey = `${key}:${value}`;
      if (!this.searchIndex.has(indexKey)) {
        this.searchIndex.set(indexKey, new Set());
      }
      this.searchIndex.get(indexKey).add(entityId);
    });
  },

  removeEntityFromIndex(entityId) {
    const metadata = this.entityMetadata.get(entityId);
    if (!metadata) return;

    Object.entries(metadata).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      const indexKey = `${key}:${value}`;
      if (this.searchIndex.has(indexKey)) {
        this.searchIndex.get(indexKey).delete(entityId);
        if (this.searchIndex.get(indexKey).size === 0) {
          this.searchIndex.delete(indexKey);
        }
      }
    });
  },

  findByType(entityType) {
    const entityIds = this.catalog.get(entityType);
    if (!entityIds) return [];

    return Array.from(entityIds)
      .map((id) => entities.get(id))
      .filter((entity) => entity && entity.isActive());
  },

  findByProperty(property, value) {
    const indexKey = `${property}:${value}`;
    const entityIds = this.searchIndex.get(indexKey);
    if (!entityIds) return [];

    return Array.from(entityIds)
      .map((id) => entities.get(id))
      .filter((entity) => entity && entity.isActive());
  },

  findWhere(predicate) {
    const results = [];
    this.entityMetadata.forEach((metadata, entityId) => {
      const entity = entities.get(entityId);
      if (entity && entity.isActive() && predicate(metadata, entity)) {
        results.push(entity);
      }
    });
    return results;
  },

  getEntityMetadata(entityId) {
    return this.entityMetadata.get(entityId);
  },

  updateEntityMetadata(entityId, updates) {
    const currentMetadata = this.entityMetadata.get(entityId);
    if (!currentMetadata) return false;

    // Remove old property indexes
    Object.keys(updates).forEach((key) => {
      if (currentMetadata[key] !== undefined) {
        const oldIndexKey = `${key}:${currentMetadata[key]}`;
        if (this.searchIndex.has(oldIndexKey)) {
          this.searchIndex.get(oldIndexKey).delete(entityId);
        }
      }
    });

    // Update metadata
    Object.assign(currentMetadata, updates);

    // Add new property indexes
    this.indexEntityProperties(entityId, updates);

    events.emit('entity_metadata_updated', { entityId, updates });
    return true;
  },

  getCatalogStats() {
    const stats = {
      totalEntities: this.entityMetadata.size,
      totalTypes: this.catalog.size,
      indexedProperties: this.searchIndex.size,
      typeDistribution: {},
    };

    this.catalog.forEach((entitySet, entityType) => {
      stats.typeDistribution[entityType] = entitySet.size;
    });

    return stats;
  },

  search(query) {
    const results = [];

    // Simple search implementation
    this.entityMetadata.forEach((metadata, entityId) => {
      const entity = entities.get(entityId);
      if (!entity || !entity.isActive()) return;

      // Check if query matches any metadata property
      const matches = Object.entries(metadata).some(([key, value]) => {
        return value && value.toString().toLowerCase().includes(query.toLowerCase());
      });

      if (matches) {
        results.push({
          entity: entity,
          metadata: metadata,
          relevance: this.calculateRelevance(query, metadata),
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    return results.map((result) => result.entity);
  },

  calculateRelevance(query, metadata) {
    const queryLower = query.toLowerCase();
    let relevance = 0;

    Object.entries(metadata).forEach(([key, value]) => {
      if (!value) return;

      const valueStr = value.toString().toLowerCase();
      if (valueStr === queryLower) {
        relevance += 10; // Exact match
      } else if (valueStr.includes(queryLower)) {
        relevance += 5; // Partial match
      }
    });

    return relevance;
  },
};

function onStart() {
  // Auto-register existing entities
  const allEntities = [
    ...entities.findByTag('enemy'),
    ...entities.findByTag('player'),
    ...entities.findByTag('pickup'),
    ...entities.findByTag('weapon'),
  ];

  allEntities.forEach((entity) => {
    const metadata = {
      name: entity.name,
      position: entity.transform.position,
      health: entity.getComponent('Health')?.current || 100,
    };

    let entityType = 'unknown';
    if (entity.hasComponent('EnemyTag')) entityType = 'enemy';
    else if (entity.hasComponent('PlayerTag')) entityType = 'player';
    else if (entity.hasComponent('PickupTag')) entityType = 'pickup';
    else if (entity.hasComponent('WeaponTag')) entityType = 'weapon';

    EntityRegistry.registerEntity(entity.id, entityType, metadata);
  });

  // Log catalog stats
  timer.setTimeout(() => {
    console.log('Entity Catalog Stats:', EntityRegistry.getCatalogStats());
  }, 2000);
}
```

### Entity Relationship Manager

```javascript
const RelationshipManager = {
  relationships: new Map(), // entityId -> Set<relatedEntityId>
  relationshipTypes: new Map(), // [entityId, relatedEntityId] -> type
  reverseRelationships: new Map(), // entityId -> Set<relatedEntityId>

  addRelationship(entityId1, entityId2, type = 'related') {
    if (!entities.exists(entityId1) || !entities.exists(entityId2)) {
      console.error('Cannot create relationship between non-existent entities');
      return false;
    }

    // Add forward relationship
    if (!this.relationships.has(entityId1)) {
      this.relationships.set(entityId1, new Set());
    }
    this.relationships.get(entityId1).add(entityId2);

    // Add reverse relationship
    if (!this.reverseRelationships.has(entityId2)) {
      this.reverseRelationships.set(entityId2, new Set());
    }
    this.reverseRelationships.get(entityId2).add(entityId1);

    // Store relationship type
    this.relationshipTypes.set(`${entityId1}:${entityId2}`, type);

    console.log(`Added ${type} relationship: ${entityId1} -> ${entityId2}`);
    events.emit('relationship_added', {
      entityId1,
      entityId2,
      type,
    });
    return true;
  },

  removeRelationship(entityId1, entityId2) {
    // Remove forward relationship
    if (this.relationships.has(entityId1)) {
      this.relationships.get(entityId1).delete(entityId2);
      if (this.relationships.get(entityId1).size === 0) {
        this.relationships.delete(entityId1);
      }
    }

    // Remove reverse relationship
    if (this.reverseRelationships.has(entityId2)) {
      this.reverseRelationships.get(entityId2).delete(entityId1);
      if (this.reverseRelationships.get(entityId2).size === 0) {
        this.reverseRelationships.delete(entityId2);
      }
    }

    // Remove relationship type
    const typeKey = `${entityId1}:${entityId2}`;
    const type = this.relationshipTypes.get(typeKey);
    this.relationshipTypes.delete(typeKey);

    if (type) {
      console.log(`Removed ${type} relationship: ${entityId1} -> ${entityId2}`);
      events.emit('relationship_removed', {
        entityId1,
        entityId2,
        type,
      });
    }
  },

  getRelatedEntities(entityId, type = null) {
    const related = this.relationships.get(entityId);
    if (!related) return [];

    let result = Array.from(related);
    if (type) {
      result = result.filter((relatedId) => {
        const relationType = this.relationshipTypes.get(`${entityId}:${relatedId}`);
        return relationType === type;
      });
    }

    return result.map((id) => entities.get(id)).filter((entity) => entity && entity.isActive());
  },

  getRelationshipsTo(entityId, type = null) {
    const related = this.reverseRelationships.get(entityId);
    if (!related) return [];

    let result = Array.from(related);
    if (type) {
      result = result.filter((relatedId) => {
        const relationType = this.relationshipTypes.get(`${relatedId}:${entityId}`);
        return relationType === type;
      });
    }

    return result.map((id) => entities.get(id)).filter((entity) => entity && entity.isActive());
  },

  hasRelationship(entityId1, entityId2, type = null) {
    const relationType = this.relationshipTypes.get(`${entityId1}:${entityId2}`);
    if (!relationType) return false;
    return type ? relationType === type : true;
  },

  findPath(startId, endId, maxDepth = 5) {
    const visited = new Set();
    const queue = [{ id: startId, path: [startId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift();

      if (id === endId) {
        return path;
      }

      if (path.length >= maxDepth || visited.has(id)) {
        continue;
      }

      visited.add(id);

      const related = this.relationships.get(id);
      if (related) {
        related.forEach((relatedId) => {
          if (!visited.has(relatedId)) {
            queue.push({
              id: relatedId,
              path: [...path, relatedId],
            });
          }
        });
      }
    }

    return null; // No path found
  },

  getRelationshipGraph() {
    const graph = {};
    this.relationships.forEach((relatedSet, entityId) => {
      graph[entityId] = Array.from(relatedSet).map((relatedId) => ({
        id: relatedId,
        type: this.relationshipTypes.get(`${entityId}:${relatedId}`),
      }));
    });
    return graph;
  },

  cleanupInvalidRelationships() {
    let cleanedCount = 0;

    this.relationships.forEach((relatedSet, entityId) => {
      if (!entities.exists(entityId)) {
        // Remove all relationships from invalid entity
        relatedSet.forEach((relatedId) => {
          this.removeRelationship(entityId, relatedId);
          cleanedCount++;
        });
      } else {
        // Remove relationships to non-existent entities
        const invalidRelated = Array.from(relatedSet).filter(
          (relatedId) => !entities.exists(relatedId),
        );

        invalidRelated.forEach((relatedId) => {
          this.removeRelationship(entityId, relatedId);
          cleanedCount++;
        });
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} invalid relationships`);
    }

    return cleanedCount;
  },
};

// Example: Party system
const PartySystem = {
  parties: new Map(), // partyId -> Set<memberIds>
  entityToParty: new Map(), // entityId -> partyId

  createParty(members = []) {
    const partyId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.parties.set(partyId, new Set());

    members.forEach((memberId) => {
      this.addToParty(memberId, partyId);
    });

    console.log(`Created party ${partyId} with ${members.length} members`);
    return partyId;
  },

  addToParty(entityId, partyId) {
    if (!this.parties.has(partyId)) {
      console.error(`Party ${partyId} does not exist`);
      return false;
    }

    // Remove from previous party if any
    const previousParty = this.entityToParty.get(entityId);
    if (previousParty) {
      this.removeFromParty(entityId);
    }

    // Add to new party
    this.parties.get(partyId).add(entityId);
    this.entityToParty.set(entityId, partyId);

    // Create relationships with all party members
    const members = this.parties.get(partyId);
    members.forEach((memberId) => {
      if (memberId !== entityId) {
        RelationshipManager.addRelationship(entityId, memberId, 'party_member');
        RelationshipManager.addRelationship(memberId, entityId, 'party_member');
      }
    });

    console.log(`Added entity ${entityId} to party ${partyId}`);
    events.emit('party_joined', { entityId, partyId });
    return true;
  },

  removeFromParty(entityId) {
    const partyId = this.entityToParty.get(entityId);
    if (!partyId) return false;

    const party = this.parties.get(partyId);
    if (party) {
      party.delete(entityId);
      if (party.size === 0) {
        this.parties.delete(partyId);
        console.log(`Party ${partyId} dissolved (no members)`);
      }
    }

    // Remove party relationships
    const relatedEntities = RelationshipManager.getRelatedEntities(entityId, 'party_member');
    relatedEntities.forEach((relatedEntity) => {
      if (relatedEntity) {
        RelationshipManager.removeRelationship(entityId, relatedEntity.id, 'party_member');
        RelationshipManager.removeRelationship(relatedEntity.id, entityId, 'party_member');
      }
    });

    this.entityToParty.delete(entityId);
    console.log(`Removed entity ${entityId} from party ${partyId}`);
    events.emit('party_left', { entityId, partyId });
    return true;
  },

  getPartyMembers(entityId) {
    const partyId = this.entityToParty.get(entityId);
    if (!partyId) return [];

    const party = this.parties.get(partyId);
    if (!party) return [];

    return Array.from(party)
      .map((id) => entities.get(id))
      .filter((entity) => entity && entity.isActive());
  },

  getPartyStats() {
    const stats = {
      totalParties: this.parties.size,
      totalMembers: this.entityToParty.size,
      averagePartySize: 0,
    };

    if (stats.totalParties > 0) {
      let totalSize = 0;
      this.parties.forEach((party) => {
        totalSize += party.size;
      });
      stats.averagePartySize = totalSize / stats.totalParties;
    }

    return stats;
  },
};
```

## Best Practices

1. **Caching**: Cache entity lookups when used frequently in update loops
2. **Validation**: Always check if entities exist before using them
3. **Performance**: Use tags for efficient grouping instead of searching by name
4. **Memory**: Clean up references to destroyed entities to prevent memory leaks
5. **Type Safety**: Use consistent entity identification methods across your codebase

## Search Optimization

### Hybrid Searching

```javascript
function findEntities(criteria) {
  let candidates = [];

  // Start with most efficient search method
  if (criteria.type) {
    candidates = entities.findByTag(criteria.type);
  } else if (criteria.name) {
    candidates = entities.findByName(criteria.name);
  }

  // Then apply additional filters
  if (criteria.properties) {
    candidates = candidates.filter((entity) => {
      return Object.entries(criteria.properties).every(([key, value]) => {
        const component = entity.getComponent(key);
        return component && component === value;
      });
    });
  }

  return candidates;
}
```

### Batch Processing

```javascript
function processEntitiesInBatches(entityIds, batchSize = 10) {
  for (let i = 0; i < entityIds.length; i += batchSize) {
    const batch = entityIds.slice(i, i + batchSize);
    batch.forEach((entityId) => {
      const entity = entities.get(entityId);
      if (entity && entity.isActive()) {
        processEntity(entity);
      }
    });

    // Yield control periodically
    if (i % (batchSize * 10) === 0) {
      // Potentially yield to other systems
    }
  }
}
```

## Error Handling

- Entity IDs can become invalid if entities are destroyed
- Always check for null returns from entity lookups
- Tags and names may change - verify entity properties after lookup
- Use `entities.exists()` to validate entity IDs before complex operations
