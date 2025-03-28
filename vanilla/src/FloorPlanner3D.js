import * as THREE from 'three';
import { getSegments } from './wallData.js';

export function build3D(scene) {
  const wallHeight = 250;

  getSegments().forEach(({ from, to }) => {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    const angle = Math.atan2(direction.y, direction.x);
    const center = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

    const geometry = new THREE.BoxGeometry(length, wallHeight, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x999999 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(center.x, wallHeight / 2, center.y);
    wall.rotation.y = -angle;

    scene.add(wall);
  });
}