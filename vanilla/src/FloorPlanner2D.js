import * as THREE from 'three';
import { addSegment } from './wallData.js';
import { LabelManager2D } from './LabelManager2D.js';

export class FloorPlanner2D {
  constructor(scene) {
    this.scene = scene;
    this.points = [];
    this.lines = [];
    this.shapes = [];
    this.labels = new LabelManager2D(scene, 1, 'cm'); // unidad por defecto

    this.material = new THREE.LineBasicMaterial({ color: 0x000000 });
    this.pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.pointGeometry = new THREE.CircleGeometry(5, 16);
  }

  addPoint(pos) {
    const snap = 20;
    const snapped = new THREE.Vector3(
      Math.round(pos.x / snap) * snap,
      Math.round(pos.y / snap) * snap,
      0
    );

    const pointMesh = new THREE.Mesh(this.pointGeometry, this.pointMaterial);
    pointMesh.position.copy(snapped);
    this.scene.add(pointMesh);
    this.points.push(snapped);

    const len = this.points.length;
    if (len > 1) {
      const from = this.points[len - 2];
      const to = this.points[len - 1];

      // Calcular la dirección y longitud de la p
      
      const angle = Math.atan2(direction.y, direction.x);

      // Crear geometría de la pared (rectángulo)
      const wallHeight = 10; // Altura de la pared en 2D
      const geometry = new THREE.PlaneGeometry(length, wallHeight);

      // Materiales para el borde y el fondo
      const material = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 }); // Fondo gris claro
      const borderMaterial = new THREE.LineBasicMaterial({ color: 0x555555 }); // Borde gris oscuro

      // Crear el mesh de la pared
      const wall = new THREE.Mesh(geometry, material);
      wall.position.set(
        (from.x + to.x) / 2,
        (from.y + to.y) / 2,
        0
      );
      wall.rotation.z = angle; // Rotar para alinear con la dirección
      this.scene.add(wall);
      this.lines.push(wall);

      // Crear el borde de la pared
      const borderGeometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      const border = new THREE.Line(borderGeometry, borderMaterial);
      this.scene.add(border);

      // Etiqueta de distancia
      const distance = from.distanceTo(to);
      const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
      this.labels.createLabel(distance, mid);

      addSegment(from, to);
    }

    if (len >= 3 && snapped.distanceTo(this.points[0]) < 15) {
      this.closeRoom();
    }
  }

  closeRoom() {
    const shape = new THREE.Shape(this.points);
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0xf0f0f0, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.shapes.push(mesh);
  }

  clear() {
    [...this.lines, ...this.shapes].forEach(obj => {
      this.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    });
    this.labels.clear();
    this.points = [];
    this.lines = [];
    this.shapes = [];
  }
}
