import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FloorPlanner2D } from './FloorPlanner2D.js';
import { build3D } from './FloorPlanner3D.js';
import { setMode } from './modeManager.js';
import { clearSegments } from './wallData.js';

// Canvas y renderers
const canvas2D = document.getElementById('canvas2D');
const canvas3D = document.getElementById('canvas3D');

const renderer2D = new THREE.WebGLRenderer({ canvas: canvas2D, antialias: true });
renderer2D.setSize(window.innerWidth, window.innerHeight);
renderer2D.setClearColor(0xffffff);

const renderer3D = new THREE.WebGLRenderer({ canvas: canvas3D, antialias: true });
renderer3D.setSize(window.innerWidth, window.innerHeight);
renderer3D.setClearColor(0xffffff);

// Escenas
const scene2D = new THREE.Scene();
const scene3D = new THREE.Scene();

// Cámaras
const camera2D = new THREE.OrthographicCamera(
  window.innerWidth / -2, window.innerWidth / 2,
  window.innerHeight / 2, window.innerHeight / -2,
  1, 1000
);
camera2D.position.z = 10;

const camera3D = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 1, 5000
);
camera3D.position.set(400, 400, 400);
camera3D.lookAt(0, 0, 0);

// Controls 3D
const controls = new OrbitControls(camera3D, canvas3D);
controls.enableDamping = true;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 0, 0);
controls.update();

// Estado
let currentMode = '2d';
const planner2D = new FloorPlanner2D(scene2D);

// Grillas
const grid2D = new THREE.GridHelper(2000, 200, 0xcccccc, 0xeeeeee);
grid2D.rotation.x = Math.PI / 2;
scene2D.add(grid2D);

const grid3D = new THREE.GridHelper(2000, 200, 0xcccccc, 0xeeeeee);
scene3D.add(grid3D);

// Funciones de modo
function switchTo2D() {
  canvas2D.style.display = 'block';
  canvas3D.style.display = 'none';
  currentMode = '2d';
}

function switchTo3D() {
  canvas2D.style.display = 'none';
  canvas3D.style.display = 'block';
  currentMode = '3d';

  scene3D.children
    .filter(obj => obj.isMesh && obj.geometry.type === 'BoxGeometry')
    .forEach(obj => {
      scene3D.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    });

  build3D(scene3D);
}

// Listeners
document.getElementById('mode2dBtn').addEventListener('click', switchTo2D);
document.getElementById('mode3dBtn').addEventListener('click', switchTo3D);
document.getElementById('drawBtn').addEventListener('click', () => setMode('draw'));
document.getElementById('resetBtn').addEventListener('click', () => {
  planner2D.clear();
  clearSegments();
});

// Clic para agregar puntos en 2D
window.addEventListener('click', (e) => {
  if (currentMode !== '2d') return;
  if (e.target.tagName === 'BUTTON') return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  const pos = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera2D);
  planner2D.addPoint(pos);
});

// Render loop
function animate() {
  requestAnimationFrame(animate);

  if (currentMode === '2d') {
    renderer2D.render(scene2D, camera2D);
  } else {
    controls.update();
    renderer3D.render(scene3D, camera3D);
  }
}
animate();
document.getElementById('unitSelect').addEventListener('change', (e) => {
    const [factor, label] = e.target.value.split(',');
    planner2D.labels.setUnits(parseFloat(factor), label);
  });
  