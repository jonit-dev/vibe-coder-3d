/// <reference path="./script-api.d.ts" />

// Hello World TypeScript Script
function onStart(): void {
  console.log('Hello world! Script started on entity:', entity.id);
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}
