function onStart(): void {
  console.log('Rotating cube script started!');
}

function onUpdate(deltaTime: number): void {
  // Rotate the cube around Y axis (up/down) at 45 degrees per second
  entity.transform.rotate(0, deltaTime * 45, 0);
}
