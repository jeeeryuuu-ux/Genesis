/**
 * @license Apache-2.0
 * GENESIS UNIVERSE MACRO VIEW
 *
 * Visualizes cosmic filament web structures and selectable galaxy nodes
 * at the macro-cosmological scale.
 */

import * as THREE from 'three';
import { generateGalaxy } from '../engine/hierarchy/galaxy.js';
import type { Galaxy, Universe } from '../core/types.js';
import { universeCoordsToScene } from './scale.js';

export interface UniverseViewCallbacks {
  onSelectGalaxy: (galaxy: Galaxy) => void;
  onEnterGalaxy: (galaxy: Galaxy) => void;
}

export class UniverseView {
  public group = new THREE.Group();
  private universe: Universe;
  private selectableGalaxies: Galaxy[] = [];
  private galaxyMeshes: THREE.Object3D[] = [];
  private filamentLines?: THREE.LineSegments;
  private points?: THREE.Points;

  constructor(universe: Universe, galaxyCount: number = 64) {
    this.universe = universe;
    this.buildUniverseScene(galaxyCount);
  }

  private buildUniverseScene(galaxyCount: number): void {
    // Deterministically generate a sample of galaxies across the universe filament web
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < galaxyCount; i++) {
      const galaxy = generateGalaxy(this.universe.seed, i);
      this.selectableGalaxies.push(galaxy);

      const [x, y, z] = universeCoordsToScene(galaxy.position);

      // Add galaxy visual marker
      const markerGroup = new THREE.Group();
      markerGroup.position.set(x, y, z);
      markerGroup.userData = { type: 'GALAXY', galaxy, index: i };

      // Galaxy core glow
      let coreColor = 0xffe6a8;
      if (galaxy.type === 'SPIRAL') coreColor = 0x9dc6ff;
      else if (galaxy.type === 'ELLIPTICAL') coreColor = 0xffd28a;
      else if (galaxy.type === 'LENTICULAR') coreColor = 0xffe0ba;
      else if (galaxy.type === 'IRREGULAR') coreColor = 0x8fffd8;

      const coreGeom = new THREE.SphereGeometry(3.5, 12, 12);
      const coreMat = new THREE.MeshBasicMaterial({ color: coreColor });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      markerGroup.add(coreMesh);

      // Galaxy disk / halo indicator
      const haloGeom = new THREE.RingGeometry(4.0, 9.0, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: coreColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      haloMesh.rotation.x = Math.PI / 2.5;
      markerGroup.add(haloMesh);

      this.group.add(markerGroup);
      this.galaxyMeshes.push(markerGroup);

      positions.push(x, y, z);
      const col = new THREE.Color(coreColor);
      colors.push(col.r, col.g, col.b);
    }

    // Connect nearby galaxies with subtle cosmic web filaments
    const linePositions: number[] = [];
    for (let i = 0; i < this.selectableGalaxies.length; i++) {
      const g1 = this.selectableGalaxies[i];
      const p1 = universeCoordsToScene(g1.position);

      for (let j = i + 1; j < this.selectableGalaxies.length; j++) {
        const g2 = this.selectableGalaxies[j];
        const p2 = universeCoordsToScene(g2.position);

        const dx = p1[0] - p2[0];
        const dy = p1[1] - p2[1];
        const dz = p1[2] - p2[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Connect only if relatively close in filament space
        if (dist < 180) {
          linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
        }
      }
    }

    if (linePositions.length > 0) {
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x304169,
        transparent: true,
        opacity: 0.25,
      });
      this.filamentLines = new THREE.LineSegments(lineGeom, lineMat);
      this.group.add(this.filamentLines);
    }
  }

  public getSelectableObjects(): THREE.Object3D[] {
    return this.galaxyMeshes;
  }

  public getGalaxyAtIndex(index: number): Galaxy | undefined {
    return this.selectableGalaxies[index];
  }

  public updateAnimation(deltaSeconds: number): void {
    // Subtle rotation of galaxy markers
    for (let i = 0; i < this.galaxyMeshes.length; i++) {
      this.galaxyMeshes[i].rotation.y += deltaSeconds * 0.2 * ((i % 2 === 0) ? 1 : -1);
    }
  }
}
