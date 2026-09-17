/**
 * @license Apache-2.0
 * GENESIS STAR SYSTEM VIEW
 *
 * Visualizes circumstellar architectures including:
 * - Multi-star stellar mechanics (Single, Binary, Trinary)
 * - Spectral classifications and blackbody luminosities
 * - Authoritative Habitable Zone boundary ring
 * - Planetary orbital paths preserving generator ordering
 * - Surface material/chromatic representations for 7 planetary classes
 * - Natural satellite (moon) orbits and bodies
 */

import * as THREE from 'three';
import type { Moon, Planet, Star, StarSystem } from '../core/types.js';
import { generateMoon } from '../engine/hierarchy/moon.js';
import { generatePlanet } from '../engine/hierarchy/planet.js';
import type { SystemTemporalState } from '../engine/simulation/types.js';
import { PLANET_PALETTES, SPECTRAL_COLORS } from './colors.js';
import {
  auToStarSystemUnits,
  moonOrbitToSceneUnits,
  moonRadiusToSceneUnits,
  planetRadiusToSceneUnits,
} from './scale.js';

export interface VisualPlanetNode {
  readonly planet: Planet;
  readonly planetMesh: THREE.Mesh;
  readonly orbitLine: THREE.LineLoop;
  readonly systemSlotIndex: number;
  readonly group: THREE.Group;
  readonly atmosphereMesh?: THREE.Mesh;
}

export interface VisualMoonNode {
  readonly moon: Moon;
  readonly moonMesh: THREE.Mesh;
  readonly orbitLine: THREE.LineLoop;
  readonly moonIndex: number;
  readonly group: THREE.Group;
}

export class StarSystemView {
  public group = new THREE.Group();
  public starSystem: StarSystem;
  public planets: Planet[] = [];

  private starMeshes: THREE.Object3D[] = [];
  private planetNodes: VisualPlanetNode[] = [];
  private moonNodes: VisualMoonNode[] = [];
  private habitableZoneMesh?: THREE.Mesh;
  private selectedPlanetMesh?: THREE.Mesh;
  private selectedMoonMesh?: THREE.Mesh;
  private selectionHalo?: THREE.Mesh;
  private isTemporalActive: boolean = false;

  constructor(starSystem: StarSystem) {
    this.starSystem = starSystem;

    // Deterministically generate all planets for this star system
    this.materializePlanets();

    // Build visual scene elements
    this.buildStars();
    this.buildHabitableZone();
    this.buildPlanetarySystem();
  }

  private materializePlanets(): void {
    const primaryStar = this.starSystem.stars[0];
    const lum = primaryStar?.luminositySolar ?? 1.0;
    const mass = primaryStar?.massSolar ?? 1.0;

    for (let p = 0; p < this.starSystem.planetCount; p++) {
      const planet = generatePlanet(
        this.starSystem.seed,
        p,
        this.starSystem.id,
        this.starSystem.name,
        lum,
        mass,
        false // Lazy moon instantiation
      );
      this.planets.push(planet);
    }
  }

  private buildStars(): void {
    const stars = this.starSystem.stars;

    if (stars.length === 1) {
      // Single Star System
      const starObj = this.createStarVisual(stars[0], new THREE.Vector3(0, 0, 0));
      this.starMeshes.push(starObj);
      this.group.add(starObj);
    } else if (stars.length === 2) {
      // Binary Star System orbiting barycenter
      const sep = 9.0;
      const star1 = this.createStarVisual(stars[0], new THREE.Vector3(-sep / 2, 0, 0));
      const star2 = this.createStarVisual(stars[1], new THREE.Vector3(sep / 2, 0, 0));
      this.starMeshes.push(star1, star2);
      this.group.add(star1);
      this.group.add(star2);
    } else if (stars.length >= 3) {
      // Trinary Star System: close binary pair + wider tertiary companion
      const sep = 7.0;
      const wideDist = 24.0;
      const star1 = this.createStarVisual(stars[0], new THREE.Vector3(-sep / 2, 0, 0));
      const star2 = this.createStarVisual(stars[1], new THREE.Vector3(sep / 2, 0, 0));
      const star3 = this.createStarVisual(stars[2], new THREE.Vector3(0, 0, wideDist));
      this.starMeshes.push(star1, star2, star3);
      this.group.add(star1);
      this.group.add(star2);
      this.group.add(star3);
    }
  }

  private createStarVisual(star: Star, position: THREE.Vector3): THREE.Object3D {
    const starGroup = new THREE.Group();
    starGroup.position.copy(position);

    const colorDef = SPECTRAL_COLORS[star.spectralClass];

    if (star.spectralClass === 'BLACK_HOLE') {
      // Singularity event horizon + bright accretion disc
      const horizonGeom = new THREE.SphereGeometry(2.5, 32, 32);
      const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const horizon = new THREE.Mesh(horizonGeom, horizonMat);
      starGroup.add(horizon);

      const discGeom = new THREE.RingGeometry(3.0, 7.5, 48);
      const discMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const disc = new THREE.Mesh(discGeom, discMat);
      disc.rotation.x = Math.PI / 2.3;
      starGroup.add(disc);

      starGroup.userData = {
        type: 'STAR',
        star,
        starMesh: horizon,
        coronaMesh: disc,
        baseRadius: 2.5,
      };
      return starGroup;
    }

    if (star.spectralClass === 'NEUTRON') {
      // Ultra-compact relativistic core
      const coreGeom = new THREE.SphereGeometry(1.2, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x73f2ff });
      const core = new THREE.Mesh(coreGeom, coreMat);
      starGroup.add(core);

      const coronaGeom = new THREE.SphereGeometry(2.6, 16, 16);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const corona = new THREE.Mesh(coronaGeom, coronaMat);
      starGroup.add(corona);

      starGroup.userData = {
        type: 'STAR',
        star,
        starMesh: core,
        coronaMesh: corona,
        baseRadius: 1.2,
      };
      return starGroup;
    }

    // Standard spectral star (O through M)
    const visualRadius = Math.min(8.0, Math.max(2.0, 2.5 + Math.log10(Math.max(0.1, star.radiusSolar)) * 2.2));
    const sphereGeom = new THREE.SphereGeometry(visualRadius, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: colorDef.hex,
    });
    const starMesh = new THREE.Mesh(sphereGeom, sphereMat);
    starGroup.add(starMesh);

    // Glowing corona halo
    const coronaGeom = new THREE.SphereGeometry(visualRadius * 1.35, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: colorDef.hex,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    starGroup.add(coronaMesh);

    starGroup.userData = {
      type: 'STAR',
      star,
      starMesh,
      coronaMesh,
      baseRadius: visualRadius,
    };

    return starGroup;
  }

  private buildHabitableZone(): void {
    const hz = this.starSystem.habitableZoneAU;
    const innerRadius = auToStarSystemUnits(hz.inner);
    const outerRadius = auToStarSystemUnits(hz.outer);

    // Render transparent green/cyan habitable zone band on the orbital plane
    const ringGeom = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.habitableZoneMesh = new THREE.Mesh(ringGeom, ringMat);
    this.habitableZoneMesh.rotation.x = Math.PI / 2;
    this.group.add(this.habitableZoneMesh);
  }

  private buildPlanetarySystem(): void {
    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];
      const orbitDistance = auToStarSystemUnits(planet.semiMajorAxisAU);
      const planetRadius = planetRadiusToSceneUnits(planet.radiusKm, planet.type);

      // 1. Orbital path line (elliptical with eccentricity)
      const orbitCurve = new THREE.EllipseCurve(
        0, 0,
        orbitDistance,
        orbitDistance * Math.sqrt(1 - planet.eccentricity * planet.eccentricity),
        0, 2 * Math.PI,
        false,
        0
      );
      const points = orbitCurve.getPoints(96);
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, 0, p.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: planet.hasBiosphere ? 0x38bdf8 : 0x334155,
        transparent: true,
        opacity: planet.hasBiosphere ? 0.6 : 0.35,
      });
      const orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
      this.group.add(orbitLine);

      // 2. Planet Position along orbit (derived deterministically from planet seed)
      const initialAngle = ((planet.seed & 0xffff) / 0xffff) * Math.PI * 2;
      const posX = Math.cos(initialAngle) * orbitDistance;
      const posZ = Math.sin(initialAngle) * orbitDistance;

      const planetGroup = new THREE.Group();
      planetGroup.position.set(posX, 0, posZ);
      planetGroup.userData = {
        type: 'PLANET',
        planet,
        systemSlotIndex: i,
        orbitDistance,
        angle: initialAngle,
        angularVelocity: (2 * Math.PI) / Math.max(10, planet.orbitalPeriodDays * 0.1),
      };

      // 3. Planet Mesh with specific type palette
      const palette = PLANET_PALETTES[planet.type];
      const planetGeom = new THREE.SphereGeometry(planetRadius, 24, 24);
      const planetMat = new THREE.MeshStandardMaterial({
        color: palette.primaryHex,
        roughness: palette.roughness,
        metalness: palette.metalness,
        emissive: palette.emissiveHex ?? 0x000000,
        emissiveIntensity: palette.emissiveHex ? 0.6 : 0.0,
      });
      const planetMesh = new THREE.Mesh(planetGeom, planetMat);
      planetGroup.add(planetMesh);

      // 4. Subtle atmospheric shell if applicable
      if (palette.atmosphereHex && planet.atmosphere.surfacePressureAtm > 0.2) {
        const atmoGeom = new THREE.SphereGeometry(planetRadius * 1.08, 20, 20);
        const atmoMat = new THREE.MeshBasicMaterial({
          color: palette.atmosphereHex,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        });
        planetGroup.add(new THREE.Mesh(atmoGeom, atmoMat));
      }

      this.group.add(planetGroup);

      this.planetNodes.push({
        planet,
        planetMesh,
        orbitLine,
        systemSlotIndex: i,
        group: planetGroup,
      });
    }
  }

  public getSelectableObjects(): THREE.Object3D[] {
    const selectable: THREE.Object3D[] = [];
    for (const node of this.planetNodes) {
      selectable.push(node.group);
    }
    for (const star of this.starMeshes) {
      selectable.push(star);
    }
    for (const moon of this.moonNodes) {
      selectable.push(moon.group);
    }
    return selectable;
  }

  public selectPlanet(planetIndex?: number): Planet | undefined {
    // Clear existing moon visual representations
    this.clearMoons();

    if (planetIndex === undefined) {
      if (this.selectionHalo) {
        this.group.remove(this.selectionHalo);
        this.selectionHalo = undefined;
      }
      this.selectedPlanetMesh = undefined;
      return undefined;
    }

    const node = this.planetNodes[planetIndex];
    if (!node) return undefined;

    this.selectedPlanetMesh = node.planetMesh;

    // Attach visual selection halo
    if (!this.selectionHalo) {
      const ringGeom = new THREE.RingGeometry(1.6, 2.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      this.selectionHalo = new THREE.Mesh(ringGeom, ringMat);
      this.selectionHalo.rotation.x = Math.PI / 2;
    }
    node.group.add(this.selectionHalo);

    // Materialize moons for this selected planet (lazy generation)
    this.buildMoonsForPlanet(node);

    return node.planet;
  }

  private buildMoonsForPlanet(node: VisualPlanetNode): void {
    const planet = node.planet;
    const planetRadiusUnits = planetRadiusToSceneUnits(planet.radiusKm, planet.type);

    for (let m = 0; m < planet.moonCount; m++) {
      const moon = generateMoon(
        planet.seed,
        m,
        planet.id,
        planet.name,
        planet.massEarth
      );

      const moonOrbitUnits = moonOrbitToSceneUnits(moon.orbitalDistanceKm, planetRadiusUnits);
      const moonRadiusUnits = moonRadiusToSceneUnits(moon.radiusKm);

      // Moon orbital line around planet
      const moonOrbitGeom = new THREE.BufferGeometry();
      const moonCurve = new THREE.EllipseCurve(0, 0, moonOrbitUnits, moonOrbitUnits, 0, 2 * Math.PI, false, 0);
      const moonPoints = moonCurve.getPoints(48);
      moonOrbitGeom.setFromPoints(moonPoints.map((p) => new THREE.Vector3(p.x, 0, p.y)));

      const moonOrbitMat = new THREE.LineBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.4,
      });
      const orbitLine = new THREE.LineLoop(moonOrbitGeom, moonOrbitMat);
      node.group.add(orbitLine);

      // Moon body
      const initialMoonAngle = ((moon.seed & 0xffff) / 0xffff) * Math.PI * 2;
      const moonPosX = Math.cos(initialMoonAngle) * moonOrbitUnits;
      const moonPosZ = Math.sin(initialMoonAngle) * moonOrbitUnits;

      const moonGroup = new THREE.Group();
      moonGroup.position.set(moonPosX, 0, moonPosZ);
      moonGroup.userData = {
        type: 'MOON',
        moon,
        moonIndex: m,
        orbitDistance: moonOrbitUnits,
        angle: initialMoonAngle,
        angularVelocity: (2 * Math.PI) / Math.max(2, moon.orbitalPeriodDays * 0.4),
      };

      const moonGeom = new THREE.SphereGeometry(moonRadiusUnits, 14, 14);
      const moonMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.9,
      });
      const moonMesh = new THREE.Mesh(moonGeom, moonMat);
      moonGroup.add(moonMesh);

      node.group.add(moonGroup);

      this.moonNodes.push({
        moon,
        moonMesh,
        orbitLine,
        moonIndex: m,
        group: moonGroup,
      });
    }
  }

  private clearMoons(): void {
    for (const moon of this.moonNodes) {
      if (moon.group.parent) {
        moon.group.parent.remove(moon.group);
      }
      if (moon.orbitLine.parent) {
        moon.orbitLine.parent.remove(moon.orbitLine);
      }
      moon.moonMesh.geometry.dispose();
      (moon.moonMesh.material as THREE.Material).dispose();
      moon.orbitLine.geometry.dispose();
      (moon.orbitLine.material as THREE.Material).dispose();
    }
    this.moonNodes = [];
  }

  public getPlanetAtIndex(index: number): Planet | undefined {
    return this.planets[index];
  }

  public getPlanetNode(index: number): VisualPlanetNode | undefined {
    return this.planetNodes[index];
  }

  /**
   * Synchronizes visual elements with temporal analytical simulation state.
   */
  public syncWithTemporalState(state: SystemTemporalState): void {
    this.isTemporalActive = true;

    // 1. Sync Stars (morph visual radius, corona luminosity, and spectral classification)
    for (const starGroup of this.starMeshes) {
      const star = starGroup.userData.star as Star | undefined;
      if (!star) continue;

      const tempStar = state.stars.get(star.id);
      if (!tempStar) continue;

      const starMesh = starGroup.userData.starMesh as THREE.Mesh | undefined;
      const coronaMesh = starGroup.userData.coronaMesh as THREE.Mesh | undefined;
      const baseRadius = (starGroup.userData.baseRadius as number) || 3.0;

      // Calculate evolved visual radius
      let visualRadius = Math.min(16.0, Math.max(0.6, 2.5 + Math.log10(Math.max(0.0001, tempStar.radiusSolar)) * 2.2));
      if (tempStar.stage === 'RED_GIANT') {
        visualRadius = Math.min(22.0, Math.max(8.0, visualRadius * 1.6));
      } else if (tempStar.stage === 'WHITE_DWARF') {
        visualRadius = 0.9;
      } else if (tempStar.stage === 'NEUTRON_STAR') {
        visualRadius = 0.7;
      } else if (tempStar.stage === 'BLACK_HOLE') {
        visualRadius = 2.5;
      }

      const scale = visualRadius / baseRadius;
      if (starMesh) {
        starMesh.scale.setScalar(scale);
        const colorHex = SPECTRAL_COLORS[tempStar.spectralClass]?.hex ?? 0xffffff;
        if (starMesh.material && 'color' in starMesh.material) {
          (starMesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        }
      }

      if (coronaMesh) {
        coronaMesh.scale.setScalar(scale);
        const lumFactor = Math.sqrt(Math.max(0.001, tempStar.luminositySolar));
        const targetOpacity = Math.min(0.7, Math.max(0.05, 0.28 * lumFactor));
        if (coronaMesh.material && 'opacity' in coronaMesh.material) {
          (coronaMesh.material as THREE.MeshBasicMaterial).opacity = targetOpacity;
        }
      }
    }

    // 2. Sync Circumstellar Habitable Zone
    if (this.habitableZoneMesh) {
      const hz = state.habitableZoneAU;
      const innerRadius = auToStarSystemUnits(hz.inner);
      const outerRadius = auToStarSystemUnits(hz.outer);

      this.habitableZoneMesh.geometry.dispose();
      this.habitableZoneMesh.geometry = new THREE.RingGeometry(
        Math.max(0.2, innerRadius),
        Math.max(innerRadius + 0.3, outerRadius),
        64
      );

      const primaryStar = state.stars.get(this.starSystem.stars[0]?.id);
      const isExtinct = (primaryStar?.luminositySolar ?? 1) < 0.0001 || primaryStar?.stage === 'BLACK_HOLE';
      (this.habitableZoneMesh.material as THREE.MeshBasicMaterial).opacity = isExtinct ? 0.02 : 0.12;
    }

    // 3. Sync Planets (Analytical Cartesian positions & climate colorations)
    for (const node of this.planetNodes) {
      const tempPlanet = state.planets.get(node.planet.id);
      if (!tempPlanet) continue;

      const posX = auToStarSystemUnits(tempPlanet.positionAU.x);
      const posZ = auToStarSystemUnits(tempPlanet.positionAU.z);
      node.group.position.set(posX, 0, posZ);

      // Reflect climate shifts on surface material
      const mat = node.planetMesh.material as THREE.MeshStandardMaterial;
      if (tempPlanet.iceCoverage > 0.8) {
        mat.color.setHex(0xe0f2fe); // Snowball state
      } else if (tempPlanet.effectiveTempKelvin > 500 && node.planet.type !== 'GAS_GIANT') {
        mat.color.setHex(0x991b1b); // Scorched state
      } else {
        mat.color.setHex(PLANET_PALETTES[node.planet.type].primaryHex);
      }
    }

    // 4. Sync Moons (Orbital positions relative to planet)
    for (const moonNode of this.moonNodes) {
      const tempMoon = state.moons.get(moonNode.moon.id);
      if (!tempMoon) continue;

      const orbitUnits = (moonNode.group.userData.orbitDistance as number) || 5;
      moonNode.group.position.x = Math.cos(tempMoon.orbitalPhaseRad) * orbitUnits;
      moonNode.group.position.z = Math.sin(tempMoon.orbitalPhaseRad) * orbitUnits;
    }
  }

  public updateAnimation(deltaSeconds: number): void {
    // 1. Rotate stars
    for (const star of this.starMeshes) {
      star.rotation.y += deltaSeconds * 0.1;
    }

    // 2. Orbit and spin planets
    for (const node of this.planetNodes) {
      node.planetMesh.rotation.y += deltaSeconds * 0.3;
      if (!this.isTemporalActive) {
        const data = node.group.userData;
        if (data && typeof data.angle === 'number') {
          data.angle += data.angularVelocity * deltaSeconds * 0.05;
          node.group.position.x = Math.cos(data.angle) * data.orbitDistance;
          node.group.position.z = Math.sin(data.angle) * data.orbitDistance;
        }
      }
    }

    // 3. Orbit moons around their parent planet
    for (const moon of this.moonNodes) {
      moon.moonMesh.rotation.y += deltaSeconds * 0.2;
      if (!this.isTemporalActive) {
        const data = moon.group.userData;
        if (data && typeof data.angle === 'number') {
          data.angle += data.angularVelocity * deltaSeconds * 0.1;
          moon.group.position.x = Math.cos(data.angle) * data.orbitDistance;
          moon.group.position.z = Math.sin(data.angle) * data.orbitDistance;
        }
      }
    }
  }
}
