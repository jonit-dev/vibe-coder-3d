#!/usr/bin/env node

import fs from 'fs';

const fixes = [
  {
    file: 'src/core/components/jsx/Entity.tsx',
    search: '  debug,',
    replace: '  debug: _debug,',
  },
  {
    file: 'src/core/lib/ecs/components/ComponentDefinitions.ts',
    search: '  (eid, data) => {',
    replace: '  (_eid, _data) => {',
  },
  {
    file: 'src/core/lib/ecs/components/definitions/SoundComponent.ts',
    search: '  (eid, data) => {',
    replace: '  (_eid, _data) => {',
  },
  {
    file: 'src/core/lib/ecs/components/definitions/SoundComponent.ts',
    search: '  onAdd: (eid) => {',
    replace: '  onAdd: (_eid) => {',
  },
  {
    file: 'src/core/lib/ecs/queries/entityQueries.ts',
    search: '  const roots = findRootEntities();',
    replace: '  const _roots = findRootEntities();',
  },
  {
    file: 'src/core/lib/ecs/queries/entityQueries.ts',
    search: '    const count = entitiesWithMeshRenderer.length;',
    replace: '    const _count = entitiesWithMeshRenderer.length;',
  },
  {
    file: 'src/core/lib/perf/ci-performance-check.ts',
    search: '  const baselineData = JSON.parse(baselineContent);',
    replace: '  const _baselineData = JSON.parse(baselineContent);',
  },
  {
    file: 'src/editor/components/panels/MaterialsPanel/MaterialsPanel.tsx',
    search: '  const handleMaterialSave = (material: IMaterialDefinition) => {',
    replace: '  const handleMaterialSave = (_material: IMaterialDefinition) => {',
  },
  {
    file: 'src/editor/components/physics/EditorPhysicsIntegration.tsx',
    search: '      const rigidBodyData = rigidBodyComponent?.data;',
    replace: '      const _rigidBodyData = rigidBodyComponent?.data;',
  },
  {
    file: 'src/editor/components/physics/EditorPhysicsIntegration.tsx',
    search: '  const handleRigidBodyUpdate = (_: unknown, entityId: number) => {',
    replace: '  const handleRigidBodyUpdate = (_: unknown, _entityId: number) => {',
  },
  {
    file: 'src/editor/hooks/useEntitySynchronization.ts',
    search: "  useEvent('entity:updated', (event) => {",
    replace: "  useEvent('entity:updated', (_event) => {",
  },
  {
    file: 'src/editor/hooks/useStreamingSceneActions.ts',
    search: '        const summary = {',
    replace: '        const _summary = {',
  },
  {
    file: 'src/game/scripts/PlayerController.ts',
    search: '  onStart: (entityId: number) => {',
    replace: '  onStart: (_entityId: number) => {',
  },
  {
    file: 'src/game/scripts/PlayerController.ts',
    search: '  onUpdate: (deltaTime: number, entityId: number) => {',
    replace: '  onUpdate: (deltaTime: number, _entityId: number) => {',
  },
  {
    file: 'src/plugins/vite-plugin-scene-api.ts',
    search: '  function handleError(operation: string, details: string, error: unknown) {',
    replace: '  function handleError(_operation: string, _details: string, error: unknown) {',
  },
];

fixes.forEach(({ file, search, replace }) => {
  try {
    const filePath = `/home/jonit/projects/vibe-coder-3d/${file}`;
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(search)) {
      const newContent = content.replace(search, replace);
      fs.writeFileSync(filePath, newContent);
      console.log(`Fixed: ${file}`);
    }
  } catch (error) {
    console.log(`Skip: ${file} - ${error.message}`);
  }
});

console.log('Fixed unused variables');