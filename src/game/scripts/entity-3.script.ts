/// <reference path="./script-api.d.ts" />

// Hello World TypeScript Script
function onStart(): void {
  console.log('HELLO WORLD');
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}
