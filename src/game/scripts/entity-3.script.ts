// Hello World JavaScript Script
function onStart() {
  if (three.mesh) {
    three.material.setColor("#fffff");
    console.log("hello world!");
  }
}

function onUpdate(deltaTime) {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}