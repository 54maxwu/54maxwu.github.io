export function setCameraFov(camera, value, target = value) {
  if (Math.abs(value - target) < 0.0001) value = target;
  if (camera.fov === value) return;
  camera.fov = value;
  camera.updateProjectionMatrix();
}
