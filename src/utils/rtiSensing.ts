/**
 * SignalTwin - Radio Tomographic Imaging (RTI) Crowd Sensing Engine
 * Device-Free Crowd Sensing via Link RSSI Drops
 * STRICT ARCHITECTURAL ISOLATION: Reconstruction function only takes per-link delta_RSSI values!
 */

import { CellType, Occupant, RadioBand, RouterNode, RTILink } from '../types';
import { calculateRSSI } from './rfModel';

export const LAMBDA_METERS = 1.5; // Elliptical decay scale factor (~1.5m)
export const ATTENUATION_PER_OCCUPANT_DB = 3.5; // dB attenuation per person on direct path
export const WEAK_LINK_THRESHOLD_DBM = -85.0; // Mesh/sensing cutoff threshold

/**
 * Calculates elliptical sensitivity weight for a point relative to a link (A, B)
 * w = exp(-(dA + dB - |AB|) / lambda)
 */
export function calculateEllipseWeight(
  pointX: number,
  pointY: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cellSizeMeters: number = 1.0,
  lambda: number = LAMBDA_METERS
): { weight: number; linkLengthMeters: number } {
  const dA = Math.hypot(pointX - ax, pointY - ay) * cellSizeMeters;
  const dB = Math.hypot(pointX - bx, pointY - by) * cellSizeMeters;
  const linkLengthMeters = Math.hypot(bx - ax, by - ay) * cellSizeMeters;

  if (linkLengthMeters < 0.1) return { weight: 0, linkLengthMeters: 0 };

  const excessDistance = dA + dB - linkLengthMeters;
  const weight = Math.exp(-excessDistance / lambda);

  return { weight, linkLengthMeters };
}

/**
 * Form all pairwise RTI links between routers on a single floor.
 * Computes baseline RSSI (empty room) and synthetic RSSI drop from occupants.
 */
export function computeRTILinks(
  routers: RouterNode[],
  occupants: Occupant[],
  grid: CellType[][],
  band: RadioBand,
  floorId: number,
  cellSizeMeters: number = 1.0
): RTILink[] {
  const links: RTILink[] = [];

  // Filter routers on this floor
  const floorRouters = routers.filter((r) => r.floorId === floorId);

  // Pairwise combination N*(N-1)/2
  for (let i = 0; i < floorRouters.length; i++) {
    for (let j = i + 1; j < floorRouters.length; j++) {
      const rA = floorRouters[i];
      const rB = floorRouters[j];

      // 1. Calculate baseline empty-room RSSI
      const baseline = calculateRSSI(
        rA.x,
        rA.y,
        rA.floorId,
        rB.x,
        rB.y,
        rB.floorId,
        grid,
        band,
        cellSizeMeters,
        rA.txPowerDbm
      );

      const baselineRssiDbm = baseline.finalRssiDbm;
      const isWeak = baselineRssiDbm < WEAK_LINK_THRESHOLD_DBM;

      // 2. Compute synthetic RSSI drop from occupants on this floor
      let deltaRssi = 0.0;
      if (!isWeak) {
        for (const occ of occupants) {
          if (occ.floorId !== floorId) continue;
          const { weight } = calculateEllipseWeight(
            occ.x,
            occ.y,
            rA.x,
            rA.y,
            rB.x,
            rB.y,
            cellSizeMeters
          );
          deltaRssi += ATTENUATION_PER_OCCUPANT_DB * weight;
        }
      }

      const currentRssiDbm = baselineRssiDbm - deltaRssi;

      links.push({
        id: `link_${rA.id}_${rB.id}`,
        routerA: rA,
        routerB: rB,
        baselineRssiDbm,
        currentRssiDbm,
        deltaRssi,
        isWeak,
        lengthMeters: baseline.distanceMeters,
      });
    }
  }

  return links;
}

/**
 * ARCHITECTURAL ISOLATION GUARANTEE:
 * Radio Tomographic Imaging (RTI) density reconstruction function.
 * Inputs: strictly grid dimensions, array of RTILinks (which carry deltaRssi and endpoints), and router node coordinates.
 * Notice: This function receives NO occupant coordinates!
 */
export function reconstructRTIDensityGrid(
  width: number,
  height: number,
  links: RTILink[],
  routers: RouterNode[],
  cellSizeMeters: number = 1.0
): number[][] {
  const densityGrid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  // Build router endpoint lookup to exclude router cells from scoring
  const routerSet = new Set<string>();
  for (const r of routers) {
    routerSet.add(`${r.x},${r.y}`);
  }

  // Filter active, non-weak links with deltaRssi > 0
  const activeLinks = links.filter((link) => !link.isWeak);
  if (activeLinks.length === 0) return densityGrid;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Exclude router endpoint cells
      if (routerSet.has(`${x},${y}`)) {
        densityGrid[y][x] = 0;
        continue;
      }

      let numerator = 0.0;
      let denominator = 0.0;

      for (const link of activeLinks) {
        const { weight } = calculateEllipseWeight(
          x,
          y,
          link.routerA.x,
          link.routerA.y,
          link.routerB.x,
          link.routerB.y,
          cellSizeMeters
        );

        if (weight > 0.001) {
          numerator += weight * link.deltaRssi;
          denominator += weight;
        }
      }

      // Normalized RTI reconstruction step
      if (denominator > 0.0001) {
        densityGrid[y][x] = numerator / denominator;
      } else {
        densityGrid[y][x] = 0;
      }
    }
  }

  return densityGrid;
}
