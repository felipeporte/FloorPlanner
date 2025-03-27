import * as THREE from 'three';

let previewWall = null;

export function updatePreviewWall(from, to, scene) {
  const wallThickness = 10;
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const angle = Math.atan2(direction.y, direction.x);
  const center = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  if (!previewWall) {
    const geometry = new THREE.PlaneGeometry(1, wallThickness);
    const material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.4,
    });
    previewWall = new THREE.Mesh(geometry, material);
    scene.add(previewWall);
  }

  previewWall.scale.x = length;
  previewWall.position.copy(center);
  previewWall.rotation.z = angle;
  previewWall.visible = true;
}

export function hidePreviewWall(scene) {
  if (previewWall) {
    scene.remove(previewWall);
    previewWall.geometry.dispose();
    previewWall.material.dispose();
    previewWall = null;
  }
}
