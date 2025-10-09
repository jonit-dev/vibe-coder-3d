/// <reference path="./script-api.d.ts" />

// Hello World TypeScript Script
function onStart(): void {
  console.log('Hello, World! This is a TypeScript script...UPDATED!');
  if (three.mesh) {
    three.material.setColor('#00ff00');
  }
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}
