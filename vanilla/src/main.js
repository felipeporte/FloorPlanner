import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { setMode, getMode } from './editor/modeManager.js';
import { drawWall, getWalls, removeWall, clearWalls } from './editor/wallManager.js';
import { addWallSegment, getWallSegments, clearWallSegments } from './editor/wallData.js';

// Escena
const scene = new THREE.Scene();

// Cámaras
const orthoCamera = new THREE.OrthographicCamera(
  window.innerWidth / -2, window.innerWidth / 2,
  window.innerHeight / 2, window.innerHeight / -2,
  1, 2000
);
orthoCamera.position.z = 10;

const perspCamera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 1, 5000
);
perspCamera.position.set(500, 500, 500);
perspCamera.lookAt(0, 0, 0);

// Control de cámara
let currentCamera = orthoCamera;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(perspCamera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = false; // solo en modo 3D

// Grilla
const grid = new THREE.GridHelper(2000, 200, 0xcccccc, 0xeeeeee);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

// Estado
const points = [];
const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const pointGeometry = new THREE.CircleGeometry(5, 16);

// Botones
document.getElementById('drawBtn').addEventListener('click', () => setMode('draw'));
document.getElementById('moveBtn').addEventListener('click', () => setMode('move'));
document.getElementById('deleteBtn').addEventListener('click', () => setMode('delete'));
document.getElementById('resetBtn').addEventListener('click', resetScene);
document.getElementById('mode2dBtn').addEventListener('click', enter2DMode);
document.getElementById('mode3dBtn').addEventListener('click', enter3DMode);

// Eventos 2D
setMode('draw');
window.addEventListener('click', handleClick);

// FUNCIONES

function handleClick(e) {
  if (e.target.tagName === 'BUTTON') return;
  const mode = getMode();

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  const pos = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(currentCamera);
  const snapped = snapPoint(pos);

  if (mode === 'draw') {
    if (points.length >= 3 && snapped.distanceTo(points[0]) < 15) {
      drawWall(points[points.length - 1], points[0], scene);
      addWallSegment(points[points.length - 1], points[0]);
      return;
    }

    const mesh = new THREE.Mesh(pointGeometry, pointMaterial);
    mesh.position.copy(snapped);
    scene.add(mesh);
    points.push(snapped);

    if (points.length > 1) {
      drawWall(points[points.length - 2], snapped, scene);
      addWallSegment(points[points.length - 2], snapped);
    }
  }

  if (mode === 'delete') {
    const wall = getClickedWall(e);
    if (wall) removeWall(wall, scene);
  }

  // Modo mover puede agregarse aquí después
}

function getClickedWall(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, currentCamera);
  const intersects = raycaster.intersectObjects(getWalls());
  return intersects.length > 0 ? intersects[0].object : null;
}

function snapPoint(vec3) {
  const snap = 20;
  const x = Math.round(vec3.x / snap) * snap;
  const y = Math.round(vec3.y / snap) * snap;
  return new THREE.Vector3(x, y, 0);
}

function resetScene() {
  points.length = 0;
  clearWalls(scene);
  clearWallSegments();

  scene.traverse(obj => {
    if (obj.isMesh && obj.geometry.type === 'CircleGeometry') {
      scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    }
    if (obj.isMesh && obj.geometry.type === 'BoxGeometry') {
      scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    }
  });

  setMode('draw');
  currentCamera = orthoCamera;
  controls.enableRotate = false;
  controls.object = perspCamera;
}

function enter3DMode() {
  clearWalls(scene);

  const wallHeight = 250;
  getWallSegments().forEach(({ from, to }) => {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    const angle = Math.atan2(direction.y, direction.x);
    const center = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

    const geometry = new THREE.BoxGeometry(length, 10, wallHeight);
    const material = new THREE.MeshBasicMaterial({ color: 0x999999 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(center.x, center.y, wallHeight / 2);
    wall.rotation.z = angle;
    scene.add(wall);
  });

  currentCamera = perspCamera;
  controls.enableRotate = true;
}

function enter2DMode() {
  // eliminar paredes 3D
  scene.children
    .filter(obj => obj.isMesh && obj.geometry.type === 'BoxGeometry')
    .forEach(obj => {
      scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    });

  currentCamera = orthoCamera;
  controls.enableRotate = false;
}

// RENDER LOOP
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, currentCamera);
}
animate();
