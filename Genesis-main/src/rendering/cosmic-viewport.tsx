/**
 * @license Apache-2.0
 * GENESIS THREE.JS COSMIC VIEWPORT
 *
 * Full-screen interactive WebGL viewport rendering multi-scale celestial environments.
 * Handles raycasting, pointer selection, double-click level navigation,
 * smooth camera transitions, and view disposal.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type {
  Galaxy,
  Moon,
  NavigationPath,
  Planet,
  ScaleTier,
  Star,
  StarSystem,
  Universe,
  Year,
} from '../core/types.js';
import { generateGalaxy } from '../engine/hierarchy/galaxy.js';
import { generatePlanet } from '../engine/hierarchy/planet.js';
import { generateStarSystem } from '../engine/hierarchy/star-system.js';
import type { SimulationEngine } from '../engine/simulation/engine.js';
import { CosmicCameraController } from './camera-controller.js';
import { GalaxyInteriorView } from './galaxy-interior-view.js';
import { disposeHierarchy } from './resource-manager.js';
import { SCALE_CONFIGS } from './scale.js';
import { StarSystemView } from './star-system-view.js';
import type { RendererStats } from './types.js';
import { UniverseView } from './universe-view.js';

export interface CosmicViewportProps {
  readonly universe: Universe;
  readonly path: NavigationPath;
  readonly simulationEngine: SimulationEngine;
  readonly onNavigate: (path: NavigationPath) => void;
  readonly onSelectGalaxy: (galaxy: Galaxy) => void;
  readonly onSelectSystem: (system: StarSystem) => void;
  readonly onSelectPlanet: (planet: Planet) => void;
  readonly onSelectMoon: (moon: Moon) => void;
  readonly onSelectStar: (star: Star) => void;
  readonly onStatsUpdate: (stats: RendererStats) => void;
  readonly onSimulationTick?: (year: Year) => void;
  readonly timeJumpTrigger?: number;
}

export const CosmicViewport: React.FC<CosmicViewportProps> = ({
  universe,
  path,
  simulationEngine,
  onNavigate,
  onSelectGalaxy,
  onSelectSystem,
  onSelectPlanet,
  onSelectMoon,
  onSelectStar,
  onStatsUpdate,
  onSimulationTick,
  timeJumpTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controllerRef = useRef<CosmicCameraController | null>(null);

  // Active view references
  const universeViewRef = useRef<UniverseView | null>(null);
  const galaxyViewRef = useRef<GalaxyInteriorView | null>(null);
  const systemViewRef = useRef<StarSystemView | null>(null);

  // Simulation engine ref for live loop access
  const simulationEngineRef = useRef<SimulationEngine>(simulationEngine);
  simulationEngineRef.current = simulationEngine;
  const onSimulationTickRef = useRef(onSimulationTick);
  onSimulationTickRef.current = onSimulationTick;

  // Warp pulse state
  const [showWarpFlash, setShowWarpFlash] = useState(false);

  // Current entity state cached for view synchronization
  const currentGalaxyRef = useRef<Galaxy | null>(null);
  const currentSystemRef = useRef<StarSystem | null>(null);

  // Raycaster & interaction state
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePointerRef = useRef(new THREE.Vector2());
  const lastTapTimeRef = useRef(0);
  const isPointerDraggingRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  // FPS measurement
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const currentFpsRef = useRef(60);

  // --------------------------------------------------------------------------
  // Scene View Builder (Universe vs. Galaxy vs. Star System)
  // --------------------------------------------------------------------------
  const rebuildSceneForTier = useCallback(
    (tier: ScaleTier, currentPath: NavigationPath) => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const controller = controllerRef.current;
      if (!scene || !camera || !controller) return;

      // 1. Cleanly dispose active subviews before instantiating new tier view
      if (universeViewRef.current) {
        disposeHierarchy(universeViewRef.current.group);
        scene.remove(universeViewRef.current.group);
        universeViewRef.current = null;
      }
      if (galaxyViewRef.current) {
        disposeHierarchy(galaxyViewRef.current.group);
        scene.remove(galaxyViewRef.current.group);
        galaxyViewRef.current = null;
      }
      if (systemViewRef.current) {
        disposeHierarchy(systemViewRef.current.group);
        scene.remove(systemViewRef.current.group);
        systemViewRef.current = null;
      }

      // Update camera controller scale tier
      controller.setScaleTier(tier);

      // 2. Build the appropriate tier scene
      switch (tier) {
        case 'UNIVERSE': {
          simulationEngineRef.current.clearActiveSystem();
          currentGalaxyRef.current = null;
          currentSystemRef.current = null;

          const uView = new UniverseView(universe, 64);
          universeViewRef.current = uView;
          scene.add(uView.group);

          controller.setCameraView(new THREE.Vector3(0, 0, 0), 550, Math.PI / 3, Math.PI / 4);
          break;
        }

        case 'GALAXY': {
          simulationEngineRef.current.clearActiveSystem();
          const gIndex = currentPath.galaxyIndex ?? 0;
          const galaxy = generateGalaxy(universe.seed, gIndex);
          currentGalaxyRef.current = galaxy;
          currentSystemRef.current = null;

          const gView = new GalaxyInteriorView(galaxy, 9000, 48);
          galaxyViewRef.current = gView;
          scene.add(gView.group);

          // If a star system is pre-selected, highlight it
          if (currentPath.systemIndex !== undefined) {
            gView.highlightSystem(currentPath.systemIndex);
          }

          controller.setCameraView(new THREE.Vector3(0, 0, 0), 280, Math.PI / 4, Math.PI / 3);
          break;
        }

        case 'STAR_SYSTEM':
        case 'STAR':
        case 'PLANET':
        case 'MOON': {
          const gIndex = currentPath.galaxyIndex ?? 0;
          const sIndex = currentPath.systemIndex ?? 0;
          const galaxy = currentGalaxyRef.current ?? generateGalaxy(universe.seed, gIndex);
          currentGalaxyRef.current = galaxy;

          const system = generateStarSystem(galaxy.seed, sIndex, galaxy.id);
          currentSystemRef.current = system;

          const sView = new StarSystemView(system);
          systemViewRef.current = sView;
          scene.add(sView.group);

          // Register active system with temporal simulation engine
          simulationEngineRef.current.setActiveSystem(system, sView.planets);
          const temporalState = simulationEngineRef.current.evaluateActiveSystem();
          sView.syncWithTemporalState(temporalState);

          if (currentPath.planetIndex !== undefined) {
            const planet = sView.selectPlanet(currentPath.planetIndex);
            if (planet && (tier === 'PLANET' || tier === 'MOON')) {
              // Focus camera closer to selected planet
              const node = sView.getPlanetNode(currentPath.planetIndex);
              if (node) {
                controller.setCameraView(node.group.position, 35, Math.PI / 3, Math.PI / 4);
              }
            } else {
              controller.setCameraView(new THREE.Vector3(0, 0, 0), 120, Math.PI / 3.5, Math.PI / 4);
            }
          } else {
            controller.setCameraView(new THREE.Vector3(0, 0, 0), 120, Math.PI / 3.5, Math.PI / 4);
          }
          break;
        }
      }
    },
    [universe]
  );

  // --------------------------------------------------------------------------
  // Raycasting & Interaction Handlers
  // --------------------------------------------------------------------------
  const handlePointerInteraction = useCallback(
    (clientX: number, clientY: number, isDoubleClick: boolean) => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const controller = controllerRef.current;
      if (!container || !camera || !controller) return;

      const rect = container.getBoundingClientRect();
      mousePointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mousePointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mousePointerRef.current, camera);

      // 1. UNIVERSE TIER PICKING
      if (path.tier === 'UNIVERSE' && universeViewRef.current) {
        const selectables = universeViewRef.current.getSelectableObjects();
        const intersects = raycasterRef.current.intersectObjects(selectables, true);

        if (intersects.length > 0) {
          let hitNode: THREE.Object3D | null = intersects[0].object;
          while (hitNode && (!hitNode.userData || hitNode.userData.type !== 'GALAXY')) {
            hitNode = hitNode.parent;
          }

          if (hitNode && hitNode.userData.galaxy) {
            const galaxy: Galaxy = hitNode.userData.galaxy;
            const index: number = hitNode.userData.index;
            onSelectGalaxy(galaxy);

            if (isDoubleClick) {
              // Cinematic transition into the galaxy
              controller.transitionTo(hitNode.position, 60, 650);
              setTimeout(() => {
                onNavigate({
                  tier: 'GALAXY',
                  universeSeed: universe.seed,
                  galaxyIndex: index,
                });
              }, 600);
            }
          }
        }
      }

      // 2. GALAXY TIER PICKING
      else if (path.tier === 'GALAXY' && galaxyViewRef.current) {
        const selectables = galaxyViewRef.current.getSelectableObjects();
        const intersects = raycasterRef.current.intersectObjects(selectables, true);

        if (intersects.length > 0) {
          let hitNode: THREE.Object3D | null = intersects[0].object;
          while (hitNode && (!hitNode.userData || hitNode.userData.type !== 'STAR_SYSTEM_NODE')) {
            hitNode = hitNode.parent;
          }

          if (hitNode && typeof hitNode.userData.systemIndex === 'number') {
            const systemIndex: number = hitNode.userData.systemIndex;
            const galaxy = currentGalaxyRef.current ?? generateGalaxy(universe.seed, path.galaxyIndex ?? 0);
            const system = generateStarSystem(galaxy.seed, systemIndex, galaxy.id);

            galaxyViewRef.current.highlightSystem(systemIndex);
            onSelectSystem(system);

            if (isDoubleClick) {
              // Zoom into the selected star system
              controller.transitionTo(hitNode.position, 20, 650);
              setTimeout(() => {
                onNavigate({
                  tier: 'STAR_SYSTEM',
                  universeSeed: universe.seed,
                  galaxyIndex: path.galaxyIndex ?? 0,
                  systemIndex,
                });
              }, 600);
            }
          }
        }
      }

      // 3. STAR SYSTEM TIER PICKING
      else if (
        (path.tier === 'STAR_SYSTEM' || path.tier === 'STAR' || path.tier === 'PLANET' || path.tier === 'MOON') &&
        systemViewRef.current
      ) {
        const selectables = systemViewRef.current.getSelectableObjects();
        const intersects = raycasterRef.current.intersectObjects(selectables, true);

        if (intersects.length > 0) {
          let hitNode: THREE.Object3D | null = intersects[0].object;
          while (
            hitNode &&
            (!hitNode.userData ||
              (hitNode.userData.type !== 'PLANET' &&
                hitNode.userData.type !== 'STAR' &&
                hitNode.userData.type !== 'MOON'))
          ) {
            hitNode = hitNode.parent;
          }

          if (hitNode) {
            if (hitNode.userData.type === 'PLANET' && hitNode.userData.planet) {
              const planet: Planet = hitNode.userData.planet;
              const slotIndex: number = hitNode.userData.systemSlotIndex;
              systemViewRef.current.selectPlanet(slotIndex);
              onSelectPlanet(planet);

              if (isDoubleClick) {
                // Focus camera onto the planet
                controller.transitionTo(hitNode.position, 30, 600);
                onNavigate({
                  tier: 'PLANET',
                  universeSeed: universe.seed,
                  galaxyIndex: path.galaxyIndex ?? 0,
                  systemIndex: path.systemIndex ?? 0,
                  planetIndex: slotIndex,
                });
              }
            } else if (hitNode.userData.type === 'STAR' && hitNode.userData.star) {
              const star: Star = hitNode.userData.star;
              onSelectStar(star);

              if (isDoubleClick) {
                controller.transitionTo(hitNode.position, 15, 600);
                onNavigate({
                  tier: 'STAR',
                  universeSeed: universe.seed,
                  galaxyIndex: path.galaxyIndex ?? 0,
                  systemIndex: path.systemIndex ?? 0,
                  starIndex: 0,
                });
              }
            } else if (hitNode.userData.type === 'MOON' && hitNode.userData.moon) {
              const moon: Moon = hitNode.userData.moon;
              onSelectMoon(moon);

              if (isDoubleClick) {
                controller.transitionTo(hitNode.position, 10, 500);
                onNavigate({
                  tier: 'MOON',
                  universeSeed: universe.seed,
                  galaxyIndex: path.galaxyIndex ?? 0,
                  systemIndex: path.systemIndex ?? 0,
                  planetIndex: path.planetIndex ?? 0,
                  moonIndex: hitNode.userData.moonIndex,
                });
              }
            }
          }
        }
      }
    },
    [
      path,
      universe,
      onSelectGalaxy,
      onSelectSystem,
      onSelectPlanet,
      onSelectMoon,
      onSelectStar,
      onNavigate,
    ]
  );

  // Pointer event listeners to distinguish click from drag
  const onPointerDown = (e: React.PointerEvent) => {
    isPointerDraggingRef.current = false;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    if (dx > 4 || dy > 4) {
      isPointerDraggingRef.current = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPointerDraggingRef.current) return;

    const now = performance.now();
    const isDouble = now - lastTapTimeRef.current < 320;
    lastTapTimeRef.current = now;

    handlePointerInteraction(e.clientX, e.clientY, isDouble);
  };

  // --------------------------------------------------------------------------
  // Mount WebGL Engine & Animation Loop
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Three.js Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05070f, 1.0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Camera & Scene
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 5000);
    cameraRef.current = camera;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // 4. Camera Controller
    const controller = new CosmicCameraController(camera, container);
    controllerRef.current = controller;

    // Build initial scene view
    rebuildSceneForTier(path.tier, path);

    // 5. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // 6. Animation Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const deltaSeconds = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // Update camera controller
      controller.update();

      // Update active tier animations
      if (universeViewRef.current) {
        universeViewRef.current.updateAnimation(deltaSeconds);
      }
      if (galaxyViewRef.current) {
        galaxyViewRef.current.updateAnimation(deltaSeconds);
      }
      if (systemViewRef.current) {
        systemViewRef.current.updateAnimation(deltaSeconds);
      }

      // Step simulation clock and sync temporal state when active
      const engine = simulationEngineRef.current;
      if (!engine.clock.isPaused) {
        engine.advance(engine.clock.speed);
        onSimulationTickRef.current?.(engine.clock.currentYear);
        if (systemViewRef.current) {
          const activeState = engine.getActiveSystemState();
          if (activeState) {
            systemViewRef.current.syncWithTemporalState(activeState);
          }
        }
      }

      // Render
      renderer.render(scene, camera);

      // Calculate Stats & FPS
      frameCountRef.current++;
      if (currentTime - lastFpsTimeRef.current >= 1000) {
        currentFpsRef.current = Math.round(
          (frameCountRef.current * 1000) / (currentTime - lastFpsTimeRef.current)
        );
        frameCountRef.current = 0;
        lastFpsTimeRef.current = currentTime;

        let visibleStars = 0;
        let visiblePlanets = 0;
        let visibleMoons = 0;

        if (galaxyViewRef.current) {
          visibleStars = galaxyViewRef.current.visualSample.totalSampleCount;
        } else if (systemViewRef.current) {
          visibleStars = systemViewRef.current.starSystem.stars.length;
          visiblePlanets = systemViewRef.current.planets.length;
          visibleMoons = systemViewRef.current.planets.reduce((acc, p) => acc + p.moonCount, 0);
        } else if (universeViewRef.current) {
          visibleStars = 64; // galaxy nodes
        }

        onStatsUpdate({
          fps: currentFpsRef.current,
          visibleStars,
          visiblePlanets,
          visibleMoons,
          objectCount: scene.children.length,
          drawCalls: renderer.info.render.calls,
          currentScale: path.tier,
        });
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controller.dispose();

      if (universeViewRef.current) {
        disposeHierarchy(universeViewRef.current.group);
      }
      if (galaxyViewRef.current) {
        disposeHierarchy(galaxyViewRef.current.group);
      }
      if (systemViewRef.current) {
        disposeHierarchy(systemViewRef.current.group);
      }

      disposeHierarchy(scene);
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run once on canvas mount

  // Watch for tier or path changes to switch scenes
  useEffect(() => {
    rebuildSceneForTier(path.tier, path);
  }, [path.tier, path.galaxyIndex, path.systemIndex, rebuildSceneForTier]);

  // Watch for external temporal updates (scrubbing, jumping, checkpoints)
  useEffect(() => {
    if (systemViewRef.current) {
      const activeState = simulationEngine.getActiveSystemState();
      if (activeState) {
        systemViewRef.current.syncWithTemporalState(activeState);
      }
    }
  }, [simulationEngine.clock.currentYear, simulationEngine]);

  // Handle temporal warp flash trigger
  useEffect(() => {
    if (timeJumpTrigger && timeJumpTrigger > 0) {
      setShowWarpFlash(true);
      const timer = setTimeout(() => setShowWarpFlash(false), 450);
      return () => clearTimeout(timer);
    }
  }, [timeJumpTrigger]);

  return (
    <div
      id="cosmic-canvas-container"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
    >
      {showWarpFlash && (
        <div
          id="genesis-temporal-warp-fx"
          className="absolute inset-0 bg-cyan-400/25 pointer-events-none mix-blend-screen transition-opacity duration-500 ease-out z-20"
        />
      )}
    </div>
  );
};
