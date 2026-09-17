/**
 * @license Apache-2.0
 * GENESIS ASTRONOMICAL COLOR & SHADING PALETTES
 *
 * Accurate chromatic mapping corresponding directly to spectral classification,
 * blackbody surface temperatures, and planetary composition envelopes.
 */

import type { PlanetType, SpectralClass } from '../core/types.js';

export interface ColorRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly hex: number;
  readonly hexStr: string;
}

export const SPECTRAL_COLORS: Record<SpectralClass, ColorRGB> = {
  O: { r: 0.62, g: 0.76, b: 1.0, hex: 0x9ec2ff, hexStr: '#9ec2ff' }, // Deep blue-white (~38,000 K)
  B: { r: 0.75, g: 0.84, b: 1.0, hex: 0xbfd7ff, hexStr: '#bfd7ff' }, // Blue-white (~18,000 K)
  A: { r: 0.90, g: 0.93, b: 1.0, hex: 0xe6edff, hexStr: '#e6edff' }, // Pure white (~8,800 K)
  F: { r: 1.0, g: 0.98, b: 0.88, hex: 0xfffae0, hexStr: '#fffae0' }, // Yellow-white (~6,800 K)
  G: { r: 1.0, g: 0.89, b: 0.58, hex: 0xffe394, hexStr: '#ffe394' }, // Yellow Sun-like (~5,600 K)
  K: { r: 1.0, g: 0.72, b: 0.38, hex: 0xffb861, hexStr: '#ffb861' }, // Warm orange (~4,400 K)
  M: { r: 1.0, g: 0.42, b: 0.22, hex: 0xff6b38, hexStr: '#ff6b38' }, // Cool red dwarf (~3,000 K)
  NEUTRON: { r: 0.45, g: 0.95, b: 1.0, hex: 0x73f2ff, hexStr: '#73f2ff' }, // Relativistic cyan (~400,000 K)
  BLACK_HOLE: { r: 0.08, g: 0.05, b: 0.12, hex: 0x140d1f, hexStr: '#140d1f' }, // Event horizon singularity
};

export interface PlanetColorPalette {
  readonly primaryHex: number;
  readonly secondaryHex: number;
  readonly atmosphereHex?: number;
  readonly emissiveHex?: number;
  readonly roughness: number;
  readonly metalness: number;
}

export const PLANET_PALETTES: Record<PlanetType, PlanetColorPalette> = {
  TERRESTRIAL: {
    primaryHex: 0x2e6b4e,      // Continental greenery / landmass
    secondaryHex: 0x23528f,    // Liquid oceans
    atmosphereHex: 0x82b6ff,   // Rayleigh scattering sky
    roughness: 0.7,
    metalness: 0.05,
  },
  OCEAN: {
    primaryHex: 0x11467e,      // Pelagic deep water
    secondaryHex: 0x1e78a6,    // Shallow continental shelf
    atmosphereHex: 0x94d2ff,   // Dense aqueous atmosphere
    roughness: 0.3,
    metalness: 0.1,
  },
  DESERT: {
    primaryHex: 0xc48b49,      // Iron-oxide dunes / arid highlands
    secondaryHex: 0x8d5c32,    // Exposed bedrock
    atmosphereHex: 0xdebe99,   // Hazy dust troposphere
    roughness: 0.85,
    metalness: 0.02,
  },
  GAS_GIANT: {
    primaryHex: 0xd6995c,      // Ammonia & hydrocarbon clouds
    secondaryHex: 0xb56d3a,    // Banded equatorial belts
    roughness: 0.6,
    metalness: 0.0,
  },
  ICE_GIANT: {
    primaryHex: 0x3d9fc2,      // Methane azure atmosphere
    secondaryHex: 0x246c8a,    // Sub-cloud mantle
    roughness: 0.5,
    metalness: 0.0,
  },
  LAVA: {
    primaryHex: 0x241d1d,      // Solidified basalt crust
    secondaryHex: 0x110f0f,
    emissiveHex: 0xff3b00,     // Glowing magma fissures
    roughness: 0.9,
    metalness: 0.2,
  },
  BARREN: {
    primaryHex: 0x6e6e73,      // Regolith / impact craters
    secondaryHex: 0x48484a,    // Basaltic mare
    roughness: 0.95,
    metalness: 0.05,
  },
};
