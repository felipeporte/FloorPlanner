import * as THREE from 'three';

// Escena y cámara ortográfica
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2, window.innerWidth / 2,
  window.innerHeight / 2, window.innerHeight / -2,
  1, 1000
);
camera.position.z = 10;

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

// Grilla
const gridSize = 2000;
const gridDivisions = 200;
const grid = new THREE.GridHelper(gridSize, gridDivisions, 0xcccccc, 0xeeeeee);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

// Variables globales
const points = [];
const pointMeshes = [];
const distanceLabels = [];

const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const pointGeometry = new THREE.CircleGeometry(5, 16);

let previewWall = null;
let isPreviewing = false;

// Utilidad: convertir a pantalla
function toScreenPosition(vec, camera) {
  const vector = vec.clone().project(camera);
  return {
    x: (vector.x + 1) / 2 * window.innerWidth,
    y: -(vector.y - 1) / 2 * window.innerHeight
  };
}

// Mostrar etiqueta de distancia
function showDistanceLabel(a, b) {
  const midPoint = new THREE.Vector3(
    (a.x + b.x) / 2,
    (a.y + b.y) / 2,
    0
  );
  const pos = toScreenPosition(midPoint, camera);

  const dist = a.distanceTo(b);
  const label = document.createElement('div');
  label.textContent = dist.toFixed(0) + ' cm';
  label.style.position = 'absolute';
  label.style.left = `${pos.x}px`;
  label.style.top = `${pos.y}px`;
  label.style.color = '#333';
  label.style.fontSize = '12px';
  label.style.background = 'rgba(255,255,255,0.8)';
  label.style.padding = '2px 4px';
  label.style.borderRadius = '4px';
  label.style.pointerEvents = 'none';

  document.body.appendChild(label);
  distanceLabels.push({ label, pointA: a, pointB: b });
}

// Dibujar pared como rectángulo
function drawWall(from, to) {
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
  showDistanceLabel(from, to);
}

// Dibujar cuarto relleno
function drawFilledRoom(points) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.lineTo(points[0].x, points[0].y);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: 0xadd8e6,
    opacity: 0.3,
    transparent: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

// Previsualización
function updatePreviewWall(from, to) {
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
  isPreviewing = true;
}

// Click
function handleClick(e) {
  if (e.target.tagName === 'BUTTON') return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  const pos = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);

  // Snap
  const snapSize = 20;
  const snappedX = Math.round(pos.x / snapSize) * snapSize;
  const snappedY = Math.round(pos.y / snapSize) * snapSize;
  const newPoint = new THREE.Vector3(snappedX, snappedY, 0);

  // Cierre del cuarto
  if (points.length > 2) {
    const first = points[0];
    const dist = first.distanceTo(newPoint);
    if (dist < 15) {
      drawWall(points[points.length - 1], first);
      drawFilledRoom(points);

      // Eliminar preview
      if (previewWall) {
        scene.remove(previewWall);
        previewWall.geometry.dispose();
        previewWall.material.dispose();
        previewWall = null;
        isPreviewing = false;
      }

      // Detener input
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      return;
    }
  }

  // Crear punto
  const mesh = new THREE.Mesh(pointGeometry, pointMaterial);
  mesh.position.copy(newPoint);
  scene.add(mesh);
  pointMeshes.push(mesh);

  if (points.length > 0) {
    const last = points[points.length - 1];
    drawWall(last, newPoint);
  }

  points.push(newPoint);
}

// Mouse move
function handleMouseMove(e) {
  if (points.length === 0) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  const pos = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);

  const snapSize = 20;
  const snappedX = Math.round(pos.x / snapSize) * snapSize;
  const snappedY = Math.round(pos.y / snapSize) * snapSize;
  const snappedPoint = new THREE.Vector3(snappedX, snappedY, 0);

  const lastPoint = points[points.length - 1];
  updatePreviewWall(lastPoint, snappedPoint);
}

// Animar
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  distanceLabels.forEach(({ label, pointA, pointB }) => {
    const mid = new THREE.Vector3(
      (pointA.x + pointB.x) / 2,
      (pointA.y + pointB.y) / 2,
      0
    );
    const screenPos = toScreenPosition(mid, camera);
    label.style.left = `${screenPos.x}px`;
    label.style.top = `${screenPos.y}px`;
  });

  if (!isPreviewing && previewWall) {
    previewWall.visible = false;
  } else if (previewWall) {
    previewWall.visible = true;
  }
  isPreviewing = false;
}
animate();

// Reset
function resetPlano() {
  pointMeshes.forEach(mesh => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  pointMeshes.length = 0;
  points.length = 0;

  distanceLabels.forEach(({ label }) => {
    if (label && label.parentElement) {
      label.parentElement.removeChild(label);
    }
  });
  distanceLabels.length = 0;

  const toRemove = [];
  scene.traverse(obj => {
    if (
      obj.type === 'Mesh' &&
      (obj.geometry.type === 'PlaneGeometry' || obj.geometry.type === 'ShapeGeometry')
    ) {
      toRemove.push(obj);
    }
  });
  toRemove.forEach(mesh => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  if (previewWall) {
    scene.remove(previewWall);
    previewWall.geometry.dispose();
    previewWall.material.dispose();
    previewWall = null;
    isPreviewing = false;
  }

  window.addEventListener('click', handleClick);
  window.addEventListener('mousemove', handleMouseMove);
}

// Listeners
window.addEventListener('click', handleClick);
window.addEventListener('mousemove', handleMouseMove);
document.getElementById('resetBtn').addEventListener('click', resetPlano);
