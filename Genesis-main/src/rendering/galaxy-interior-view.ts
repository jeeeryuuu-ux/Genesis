/**
 * @license Apache-2.0
 * GENESIS GALAXY INTERIOR VIEW
 *
 * Renders the interior stellar environment of a galaxy at the kiloparsec scale.
 * Utilizes GPU-efficient BufferGeometry point clouds, central core structures,
 * morphology-specific galactic distributions, and interactive star system anchor nodes.
 */

import * as THREE from 'three';
import type { Galaxy, StarSystem } from '../core/types.js';
import { sampleGalaxyStars } from './galaxy-sampling.js';
import type { GalaxyVisualSample, SelectableSystemNode } from './types.js';

export class GalaxyInteriorView {
  public group = new THREE.Group();
  public galaxy: Galaxy;
  public visualSample: GalaxyVisualSample;

  private starPoints: THREE.Points;
  private coreGroup = new THREE.Group();
  private dustDisk?: THREE.Mesh;
  private systemNodeMeshes: THREE.Object3D[] = [];
  private selectionMarker?: THREE.Mesh;

  constructor(galaxy: Galaxy, sampleCount: number = 9000, selectableCount: number = 48) {
    this.galaxy = galaxy;
    this.visualSample = sampleGalaxyStars(galaxy, sampleCount, selectableCount);

    this.starPoints = this.buildStarPointCloud();
    this.group.add(this.starPoints);

    this.buildGalacticCore();
    this.group.add(this.coreGroup);

    this.buildDustStructure();
    this.buildSelectableSystemNodes();
  }

  private buildStarPointCloud(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(this.visualSample.positions, 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(this.visualSample.colors, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return new THREE.Points(geometry, material);
  }

  private buildGalacticCore(): void {
    // 1. Supermassive Black Hole Event Horizon
    const coreRadius = Math.min(6.0, Math.max(2.5, Math.log10(this.galaxy.coreBlackHoleMassSolar) * 0.8));
    const horizonGeom = new THREE.SphereGeometry(coreRadius, 24, 24);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const horizonMesh = new THREE.Mesh(horizonGeom, horizonMat);
    this.coreGroup.add(horizonMesh);

    // 2. Accretion Disk / Glowing Core Corona
    const accretionGeom = new THREE.RingGeometry(coreRadius * 1.1, coreRadius * 3.8, 36);
    const accretionMat = new THREE.MeshBasicMaterial({
      color: this.galaxy.type === 'SPIRAL' ? 0xb5d4ff : 0xffcb78,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const accretionMesh = new THREE.Mesh(accretionGeom, accretionMat);
    accretionMesh.rotation.x = Math.PI / 2;
    this.coreGroup.add(accretionMesh);

    // 3. Central Spheroidal Core Glow
    const glowGeom = new THREE.SphereGeometry(coreRadius * 2.5, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffeed1,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    this.coreGroup.add(glowMesh);
  }

  private buildDustStructure(): void {
    if (this.galaxy.type === 'SPIRAL' || this.galaxy.type === 'LENTICULAR') {
      const diskRadius = Math.min(140, Math.max(70, this.galaxy.radiusLightYears / 500));
      const diskGeom = new THREE.RingGeometry(diskRadius * 0.2, diskRadius * 0.95, 48);
      const diskMat = new THREE.MeshBasicMaterial({
        color: 0x141829,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      });
      this.dustDisk = new THREE.Mesh(diskGeom, diskMat);
      this.dustDisk.rotation.x = Math.PI / 2;
      this.group.add(this.dustDisk);
    }
  }

  private buildSelectableSystemNodes(): void {
    const nodeGeom = new THREE.SphereGeometry(1.2, 10, 10);

    for (const node of this.visualSample.selectableSystems) {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(...node.position);
      nodeGroup.userData = {
        type: 'STAR_SYSTEM_NODE',
        systemIndex: node.systemIndex,
        systemSeed: node.systemSeed,
        name: node.name,
      };

      // Glowing central beacon
      const nodeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
      });
      const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
      nodeGroup.add(nodeMesh);

      // Subtle target ring around selectable star system
      const ringGeom = new THREE.RingGeometry(1.8, 2.5, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x7aa2f7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      nodeGroup.add(ringMesh);

      this.group.add(nodeGroup);
      this.systemNodeMeshes.push(nodeGroup);
    }
  }

  public getSelectableObjects(): THREE.Object3D[] {
    return this.systemNodeMeshes;
  }

  public highlightSystem(systemIndex?: number): void {
    if (systemIndex === undefined) {
      if (this.selectionMarker) {
        this.group.remove(this.selectionMarker);
        this.selectionMarker = undefined;
      }
      return;
    }

    const targetNode = this.visualSample.selectableSystems.find(
      (s) => s.systemIndex === systemIndex
    );
    if (!targetNode) return;

    if (!this.selectionMarker) {
      const geom = new THREE.RingGeometry(3.0, 4.0, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      this.selectionMarker = new THREE.Mesh(geom, mat);
      this.selectionMarker.rotation.x = Math.PI / 2;
      this.group.add(this.selectionMarker);
    }

    this.selectionMarker.position.set(...targetNode.position);
  }

  public getSystemNode(systemIndex: number): SelectableSystemNode | undefined {
    return this.visualSample.selectableSystems.find((s) => s.systemIndex === systemIndex);
  }

  public updateAnimation(deltaSeconds: number): void {
    // Subtle differential galactic disk rotation
    this.starPoints.rotation.y += deltaSeconds * 0.015;
    this.coreGroup.rotation.y += deltaSeconds * 0.04;
    if (this.dustDisk) {
      this.dustDisk.rotation.z += deltaSeconds * 0.012;
    }

    // Gentle pulse on selection marker if active
    if (this.selectionMarker) {
      const time = performance.now() * 0.003;
      const scale = 1.0 + Math.sin(time) * 0.15;
      this.selectionMarker.scale.set(scale, scale, scale);
    }
  }
}
