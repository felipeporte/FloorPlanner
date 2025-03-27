import * as THREE from 'three';
import { setMode, getMode } from './editor/modeManager.js';
import { drawWall, getWalls, removeWall, clearWalls } from './editor/wallManager.js';
import { updatePreviewWall, hidePreviewWall } from './editor/preview.js';
import { drawFilledRoom } from './editor/roomManager.js';
import { updateLabels, clearLabels } from './editor/labelManager.js';

// Escena y cámara
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2, window.innerWidth / 2,
  window.innerHeight / 2, window.innerHeight / -2,
  1, 1000
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

// Grilla
const grid = new THREE.GridHelper(2000, 200, 0xcccccc, 0xeeeeee);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

// Puntos y materiales
const points = [];
const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const pointGeometry = new THREE.CircleGeometry(5, 16);

// Botones
document.getElementById('drawBtn').addEventListener('click', () => setMode('draw'));
document.getElementById('deleteBtn').addEventListener('click', () => setMode('delete'));
document.getElementById('resetBtn').addEventListener('click', resetScene);

// Eventos
window.addEventListener('click', handleClick);
window.addEventListener('mousemove', handleMouseMove);

// FUNCIONES

function handleClick(e) {
  if (e.target.tagName === 'BUTTON') return;

  const mode = getMode();

  if (mode === 'draw') {
    const point = getSnappedMousePosition(e);

    // Cierre del cuarto
    if (points.length >= 3 && point.distanceTo(points[0]) < 15) {
      drawWall(points[points.length - 1], points[0], scene);
      drawFilledRoom(points, scene);
      hidePreviewWall(scene);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      return;
    }

    addPoint(point);

    if (points.length > 1) {
      const from = points[points.length - 2];
      const to = points[points.length - 1];
      drawWall(from, to, scene);
    }
  }

  if (mode === 'delete') {
    const wall = getClickedWall(e);
    if (wall) removeWall(wall, scene);
  }
}

function handleMouseMove(e) {
  if (getMode() !== 'draw') return;
  if (points.length === 0) return;

  const snapPoint = getSnappedMousePosition(e);
  const lastPoint = points[points.length - 1];
  updatePreviewWall(lastPoint, snapPoint, scene);
}

function getSnappedMousePosition(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const pos = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
  const snap = 20;
  const snappedX = Math.round(pos.x / snap) * snap;
  const snappedY = Math.round(pos.y / snap) * snap;
  return new THREE.Vector3(snappedX, snappedY, 0);
}

function addPoint(vec3) {
  const mesh = new THREE.Mesh(pointGeometry, pointMaterial);
  mesh.position.copy(vec3);
  scene.add(mesh);
  points.push(vec3);
}

function getClickedWall(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(getWalls());
  return intersects.length > 0 ? intersects[0].object : null;
}

function resetScene() {
  points.length = 0;
  clearWalls(scene);
  hidePreviewWall(scene);
  clearLabels();
  scene.traverse((obj) => {
    if (obj.isMesh && obj.geometry.type === 'CircleGeometry') {
      scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    }
    if (obj.isMesh && obj.geometry.type === 'ShapeGeometry') {
      scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    }
  });

  setMode('draw');
  window.addEventListener('click', handleClick);
  window.addEventListener('mousemove', handleMouseMove);
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateLabels(camera); // ← esto actualiza la posición de los labels
}
animate();

