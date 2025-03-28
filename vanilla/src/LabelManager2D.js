import * as THREE from 'three';

export class LabelManager2D {
  constructor(scene) {
    this.scene = scene;
    this.labels = [];
  }

  createLabel(text, position) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(text, 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(80, 20, 1);
    sprite.position.copy(position);

    this.scene.add(sprite);
    this.labels.push(sprite);
  }

  clear() {
    this.labels.forEach(label => {
      this.scene.remove(label);
      label.material.map.dispose();
      label.material.dispose();
    });
    this.labels = [];
  }
}