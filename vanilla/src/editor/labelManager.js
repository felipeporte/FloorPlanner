import * as THREE from 'three';

const labels = [];

export function createDistanceLabel(a, b) {
  const midPoint = new THREE.Vector3(
    (a.x + b.x) / 2,
    (a.y + b.y) / 2,
    0
  );

  const label = document.createElement('div');
  label.textContent = a.distanceTo(b).toFixed(0) + ' cm';
  label.style.position = 'absolute';
  label.style.color = '#333';
  label.style.fontSize = '12px';
  label.style.background = 'rgba(255,255,255,0.8)';
  label.style.padding = '2px 4px';
  label.style.borderRadius = '4px';
  label.style.pointerEvents = 'none';

  document.body.appendChild(label);
  labels.push({ label, pointA: a.clone(), pointB: b.clone() });
}

export function updateLabels(camera) {
  labels.forEach(({ label, pointA, pointB }) => {
    const mid = new THREE.Vector3(
      (pointA.x + pointB.x) / 2,
      (pointA.y + pointB.y) / 2,
      0
    );

    const vector = mid.clone().project(camera);
    const x = (vector.x + 1) / 2 * window.innerWidth;
    const y = -(vector.y - 1) / 2 * window.innerHeight;
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
  });
}

export function clearLabels() {
  labels.forEach(({ label }) => label.remove());
  labels.length = 0;
}
