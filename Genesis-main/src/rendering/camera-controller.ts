/**
 * @license Apache-2.0
 * GENESIS CAMERA & ORBIT CONTROLLER
 *
 * Lightweight, zero-dependency camera controller with smooth spherical orbiting,
 * inertia, zoom boundaries tailored per ScaleTier, and cinematic camera interpolation.
 */

import * as THREE from 'three';
import { SCALE_CONFIGS } from './scale.js';
import type { ScaleTier } from '../core/types.js';

export interface CameraTransitionTarget {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly durationMs?: number;
}

export class CosmicCameraController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  // Spherical orbit coordinates
  private spherical = new THREE.Spherical(400, Math.PI / 3, Math.PI / 4);
  public currentTarget = new THREE.Vector3(0, 0, 0);

  // Transition state
  private isTransitioning = false;
  private transitionStartTime = 0;
  private transitionDuration = 1000;
  private startPosition = new THREE.Vector3();
  private startTarget = new THREE.Vector3();
  private endPosition = new THREE.Vector3();
  private endTarget = new THREE.Vector3();

  // Pointer drag state
  private isPointerDown = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private touchStartDistance = 0;

  // Bounds
  private minDistance = 20;
  private maxDistance = 1200;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.bindEvents();
    this.updateCameraPosition();
  }

  public setScaleTier(tier: ScaleTier): void {
    const cfg = SCALE_CONFIGS[tier];
    this.minDistance = cfg.minCameraDistance;
    this.maxDistance = cfg.maxCameraDistance;
    this.camera.near = cfg.cameraNear;
    this.camera.far = cfg.cameraFar;
    this.camera.updateProjectionMatrix();

    // Clamp radius if outside tier bounds
    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius)
    );
    this.updateCameraPosition();
  }

  public setCameraView(
    target: THREE.Vector3,
    distance: number,
    theta: number = Math.PI / 4,
    phi: number = Math.PI / 3
  ): void {
    this.currentTarget.copy(target);
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
    this.spherical.theta = theta;
    this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));
    this.updateCameraPosition();
  }

  /**
   * Smoothly interpolates the camera to a new position and target.
   */
  public transitionTo(
    newTarget: THREE.Vector3,
    distance: number,
    durationMs: number = 850
  ): void {
    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
    this.transitionDuration = durationMs;

    this.startPosition.copy(this.camera.position);
    this.startTarget.copy(this.currentTarget);

    this.endTarget.copy(newTarget);
    const clampedDist = Math.max(this.minDistance, Math.min(this.maxDistance, distance));

    // Preserve viewing angle direction from current spherical coords
    const offset = new THREE.Vector3().setFromSpherical(
      new THREE.Spherical(clampedDist, this.spherical.phi, this.spherical.theta)
    );
    this.endPosition.copy(newTarget).add(offset);
  }

  public update(): void {
    if (this.isTransitioning) {
      const elapsed = performance.now() - this.transitionStartTime;
      const t = Math.min(1.0, elapsed / this.transitionDuration);

      // Smooth cubic ease-in-out: 3t^2 - 2t^3
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.startPosition, this.endPosition, ease);
      this.currentTarget.lerpVectors(this.startTarget, this.endTarget, ease);
      this.camera.lookAt(this.currentTarget);

      if (t >= 1.0) {
        this.isTransitioning = false;
        // Resynchronize spherical coordinates with current camera state
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.currentTarget);
        this.spherical.setFromVector3(offset);
      }
    } else {
      this.updateCameraPosition();
    }
  }

  private updateCameraPosition(): void {
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.currentTarget).add(offset);
    this.camera.lookAt(this.currentTarget);
  }

  private bindEvents(): void {
    const el = this.domElement;

    // Mouse events
    el.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });

    // Touch events
    el.addEventListener('touchstart', this.onTouchStart, { passive: false });
    el.addEventListener('touchmove', this.onTouchMove, { passive: false });
    el.addEventListener('touchend', this.onTouchEnd);
  }

  public dispose(): void {
    const el = this.domElement;
    el.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    el.removeEventListener('wheel', this.onWheel);
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove', this.onTouchMove);
    el.removeEventListener('touchend', this.onTouchEnd);
  }

  private onMouseDown = (e: MouseEvent) => {
    // Only orbit on left mouse drag without modifier keys
    if (e.button === 0) {
      this.isPointerDown = true;
      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      this.isTransitioning = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerDown) return;

    const deltaX = e.clientX - this.previousPointerPosition.x;
    const deltaY = e.clientY - this.previousPointerPosition.y;

    this.previousPointerPosition = { x: e.clientX, y: e.clientY };

    const rotateSpeed = 0.005;
    this.spherical.theta -= deltaX * rotateSpeed;
    this.spherical.phi -= deltaY * rotateSpeed;

    // Constrain phi to avoid pole singularity
    this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
    this.updateCameraPosition();
  };

  private onMouseUp = () => {
    this.isPointerDown = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.isTransitioning = false;

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius * zoomFactor)
    );
    this.updateCameraPosition();
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.isPointerDown = true;
      this.previousPointerPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.isTransitioning = false;
    } else if (e.touches.length === 2) {
      this.isPointerDown = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && this.isPointerDown) {
      const deltaX = e.touches[0].clientX - this.previousPointerPosition.x;
      const deltaY = e.touches[0].clientY - this.previousPointerPosition.y;
      this.previousPointerPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const rotateSpeed = 0.006;
      this.spherical.theta -= deltaX * rotateSpeed;
      this.spherical.phi -= deltaY * rotateSpeed;
      this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
      this.updateCameraPosition();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      if (this.touchStartDistance > 0) {
        const pinchRatio = this.touchStartDistance / Math.max(1, currentDistance);
        this.spherical.radius = Math.max(
          this.minDistance,
          Math.min(this.maxDistance, this.spherical.radius * pinchRatio)
        );
        this.updateCameraPosition();
      }
      this.touchStartDistance = currentDistance;
    }
  };

  private onTouchEnd = () => {
    this.isPointerDown = false;
    this.touchStartDistance = 0;
  };
}
