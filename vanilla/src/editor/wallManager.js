import * as THREE from 'three';
import { createDistanceLabel } from './labelManager.js';

const walls = [];

export function drawWall(from, to, scene) {
  const wallThickness = 10;
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const angle = Math.atan2(direction.y, direction.x);
  const center = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  const geometry = new THREE.PlaneGeometry(length, wallThickness);
  const material = new THREE.MeshBasicMaterial({ color: 0x444444 });
  const wall = new THREE.Mesh(geometry, material);

  wall.position.copy(center);
  wall.rotation.z = angle;

  scene.add(wall);
  walls.push(wall);

  createDistanceLabel(from, to); // 👈 Mostrar etiqueta
  return wall;
}

export function getWalls() {
  return walls;
}

export function removeWall(wall, scene) {
  scene.remove(wall);
  wall.geometry.dispose();
  wall.material.dispose();
  const index = walls.indexOf(wall);
  if (index !== -1) walls.splice(index, 1);
}

export function clearWalls(scene) {
  walls.forEach(wall => {
    scene.remove(wall);
    wall.geometry.dispose();
    wall.material.dispose();
  });
  walls.length = 0;
}
