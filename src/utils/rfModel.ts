/**
 * SignalTwin - RF Propagation Engine
 * Implements Friis Free-Space Path Loss + Multi-Wall Attenuation + Floor Slab Leakage
 */

import { CellType, RadioBand } from '../types';

export const RADIO_BANDS: Record<RadioBand['id'], RadioBand> = {
  lora868: {
    id: 'lora868',
    name: 'LoRa 868 MHz',
    frequencyMHz: 868,
    wallLossDb: 3.0,
    floorSlabLossDb: 12.0,
    description: 'Sub-GHz LPWAN. Superior obstacle & concrete floor penetration.',
  },
  lora915: {
    id: 'lora915',
    name: 'LoRa 915 MHz',
    frequencyMHz: 915,
    wallLossDb: 3.2,
    floorSlabLossDb: 13.0,
    description: 'Sub-GHz Americas band. Long range, minimal attenuation.',
  },
  wifi24: {
    id: 'wifi24',
    name: 'WiFi 2.4 GHz',
    frequencyMHz: 2400,
    wallLossDb: 8.0,
    floorSlabLossDb: 20.0,
    description: 'Standard 2.4GHz ISM band. Moderate wall attenuation.',
  },
  wifi50: {
    id: 'wifi50',
    name: 'WiFi 5.0 GHz',
    frequencyMHz: 5200,
    wallLossDb: 12.0,
    floorSlabLossDb: 28.0,
    description: 'High capacity, severe wall & floor attenuation.',
  },
};

export const TX_POWER_DBM = 14.0; // Standard transmit power
export const FLOOR_HEIGHT_METERS = 3.5; // Vertical distance between floor decks

/**
 * Calculates Friis Free-Space Path Loss in dB.
 * FSPL(dB) = 32.44 + 20*log10(distance_km) + 20*log10(freq_MHz)
 */
export function calculateFSPL(distanceMeters: number, frequencyMHz: number): number {
  if (distanceMeters <= 0.1) distanceMeters = 0.1; // clamp to 10cm minimum to avoid log(0)
  const distanceKm = distanceMeters / 1000.0;
  return 32.44 + 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz);
}

/**
 * Counts distinct wall cells crossed on a straight line between two grid coordinates.
 * Samples path at ~2 points/meter.
 */
export function countWallsCrossed(
  grid: CellType[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cellSizeMeters: number = 1.0
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distanceCells = Math.hypot(dx, dy);
  const distanceMeters = distanceCells * cellSizeMeters;

  if (distanceMeters < 0.1) return 0;

  // 2 samples per meter
  const steps = Math.max(2, Math.ceil(distanceMeters * 2));
  const visitedWallCells = new Set<string>();

  const height = grid.length;
  const width = grid[0]?.length || 0;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sampleX = Math.floor(x1 + dx * t + 0.5);
    const sampleY = Math.floor(y1 + dy * t + 0.5);

    if (sampleY >= 0 && sampleY < height && sampleX >= 0 && sampleX < width) {
      if (grid[sampleY][sampleX] === 'WALL') {
        visitedWallCells.add(`${sampleX},${sampleY}`);
      }
    }
  }

  return visitedWallCells.size;
}

/**
 * Computes exact RSSI in dBm from a router to a target cell.
 */
export function calculateRSSI(
  txX: number,
  txY: number,
  txFloorId: number,
  targetX: number,
  targetY: number,
  targetFloorId: number,
  grid: CellType[][],
  band: RadioBand,
  cellSizeMeters: number = 1.0,
  txPowerDbm: number = TX_POWER_DBM
): {
  distanceMeters: number;
  fsplDb: number;
  wallsCrossed: number;
  wallLossDb: number;
  nonLosPenaltyDb: number;
  floorDiff: number;
  floorLossDb: number;
  finalRssiDbm: number;
} {
  const floorDiff = Math.abs(targetFloorId - txFloorId);
  const horizontalDistMeters = Math.hypot(targetX - txX, targetY - txY) * cellSizeMeters;
  const verticalDistMeters = floorDiff * FLOOR_HEIGHT_METERS;
  const totalDistanceMeters = Math.hypot(horizontalDistMeters, verticalDistMeters);

  const fsplDb = calculateFSPL(totalDistanceMeters, band.frequencyMHz);

  // Count walls on target floor (or tx floor)
  const wallsCrossed = countWallsCrossed(grid, txX, txY, targetX, targetY, cellSizeMeters);
  const wallLossDb = wallsCrossed * band.wallLossDb;

  // Extra NLOS penalty if 2+ walls crossed
  const nonLosPenaltyDb = wallsCrossed >= 2 ? 5.0 : 0.0;

  // Inter-floor slab attenuation
  const floorLossDb = floorDiff * band.floorSlabLossDb;

  const finalRssiDbm = txPowerDbm - fsplDb - wallLossDb - nonLosPenaltyDb - floorLossDb;

  return {
    distanceMeters: totalDistanceMeters,
    fsplDb,
    wallsCrossed,
    wallLossDb,
    nonLosPenaltyDb,
    floorDiff,
    floorLossDb,
    finalRssiDbm,
  };
}
