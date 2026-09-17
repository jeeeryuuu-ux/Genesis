/**
 * @license Apache-2.0
 * GENESIS THREE.JS RESOURCE LIFECYCLE & DISPOSAL MANAGER
 *
 * Enforces zero-leak WebGL resource cleanup when switching hierarchy views
 * (Universe <-> Galaxy <-> Star System <-> Planet).
 */

import * as THREE from 'three';

/**
 * Recursively disposes all geometries, materials, and textures attached to an Object3D hierarchy.
 */
export function disposeHierarchy(root: THREE.Object3D): void {
  root.traverse((child) => {
    // 1. Dispose Mesh / Points / Line geometries
    if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
      child.geometry.dispose();
    }

    // 2. Dispose Materials and associated textures
    if ('material' in child) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of materials) {
        if (mat instanceof THREE.Material) {
          // Dispose all texture maps
          for (const key of Object.keys(mat)) {
            const prop = (mat as unknown as Record<string, unknown>)[key];
            if (prop instanceof THREE.Texture) {
              prop.dispose();
            }
          }
          mat.dispose();
        }
      }
    }
  });

  // Clear children
  while (root.children.length > 0) {
    const child = root.children[0];
    root.remove(child);
  }
}

/**
 * Tracks and disposes allocated disposable items.
 */
export class ResourceTracker {
  private disposables: Set<{ dispose: () => void }> = new Set();

  public track<T extends { dispose: () => void }>(resource: T): T {
    this.disposables.add(resource);
    return resource;
  }

  public disposeAll(): void {
    for (const item of this.disposables) {
      try {
        item.dispose();
      } catch {
        // Ignore errors during batch cleanup
      }
    }
    this.disposables.clear();
  }

  public get size(): number {
    return this.disposables.size;
  }
}
