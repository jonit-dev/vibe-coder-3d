/// <reference path="./script-api.d.ts" />

// Hello World TypeScript Script
function onStart(): void {
  const meshRenderer = entity.getComponent('MeshRenderer');
  if (meshRenderer) {
    console.log('Entity has a MeshRenderer component!');
    console.log('Hello world!');
  }
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}
