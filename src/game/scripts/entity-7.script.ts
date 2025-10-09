/// <reference path="./script-api.d.ts" />

// Hello World TypeScript Script
function onStart(): void {
  if (three.mesh) {
    three.material.setColor("#00ff00");
  }
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}