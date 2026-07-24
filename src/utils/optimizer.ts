/**
 * SignalTwin - Multi-Objective Greedy Router Optimizer
 * score = 0.60 * coverage + 0.20 * avg_link_length_norm + 0.20 * angular_diversity
 */

import { CellType, FloorData, RadioBand, RouterNode } from '../types';

import { calculateRSSI } from './rfModel';

export const MIN_ROUTER_SPACING_CELLS = 4; // Minimum distance between routers

/**
 * Calculates pairwise angular diversity (mean |sin(delta_bearing)| across link pairs)
 */
export function calculateAngularDiversity(routers: RouterNode[]): number {
  if (routers.length < 3) return 1.0; // Need at least 2 links (3 routers) to compare link angles

  // Form link vectors
  const linkAngles: number[] = [];
  for (let i = 0; i < routers.length; i++) {
    for (let j = i + 1; j < routers.length; j++) {
      const dx = routers[j].x - routers[i].x;
      const dy = routers[j].y - routers[i].y;
      linkAngles.push(Math.atan2(dy, dx));
    }
  }

  if (linkAngles.length < 2) return 1.0;

  let totalSin = 0.0;
  let pairsCount = 0;

  for (let i = 0; i < linkAngles.length; i++) {
    for (let j = i + 1; j < linkAngles.length; j++) {
      const deltaBearing = linkAngles[j] - linkAngles[i];
      totalSin += Math.abs(Math.sin(deltaBearing));
      pairsCount++;
    }
  }

  return pairsCount > 0 ? totalSin / pairsCount : 1.0;
}

/**
 * Calculates normalized average link length across placed routers
 */
export function calculateAvgLinkLengthNorm(
  routers: RouterNode[],
  floorWidth: number,
  floorHeight: number,
  cellSizeMeters: number = 1.0
): number {
  if (routers.length < 2) return 0.5;

  const floorDiagonal = Math.hypot(floorWidth, floorHeight) * cellSizeMeters;
  let totalLength = 0;
  let pairCount = 0;

  for (let i = 0; i < routers.length; i++) {
    for (let j = i + 1; j < routers.length; j++) {
      const len = Math.hypot(routers[j].x - routers[i].x, routers[j].y - routers[i].y) * cellSizeMeters;
      totalLength += len;
      pairCount++;
    }
  }

  const avgLen = totalLength / pairCount;
  return Math.min(1.0, avgLen / (floorDiagonal * 0.7)); // scale relative to practical floor span
}

/**
 * Evaluates coverage percentage of walkable grid cells for a given set of routers
 */
export function evaluateCoverage(
  floor: FloorData,
  routers: RouterNode[],
  band: RadioBand,
  thresholdDbm: number = -80.0
): { coveragePct: number; deadZonePct: number; coveredCount: number; walkableCount: number } {
  let walkableCount = 0;
  let coveredCount = 0;

  const height = floor.grid.length;
  const width = floor.grid[0]?.length || 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (floor.grid[y][x] === 'WALL') continue; // ignore wall cells
      walkableCount++;

      let maxRssi = -999.0;
      for (const r of routers) {
        // Evaluate RSSI from router r to cell (x, y)
        const res = calculateRSSI(
          r.x,
          r.y,
          r.floorId,
          x,
          y,
          floor.id,
          floor.grid,
          band,
          floor.cellSizeMeters,
          r.txPowerDbm
        );
        if (res.finalRssiDbm > maxRssi) {
          maxRssi = res.finalRssiDbm;
        }
      }

      if (maxRssi >= thresholdDbm) {
        coveredCount++;
      }
    }
  }

  const coveragePct = walkableCount > 0 ? (coveredCount / walkableCount) * 100 : 0;
  const deadZonePct = 100 - coveragePct;

  return { coveragePct, deadZonePct, coveredCount, walkableCount };
}

/**
 * Generates candidate router placement locations
 */
export function generatePlacementCandidates(floor: FloorData, existingRouters: RouterNode[]): { x: number; y: number }[] {
  const height = floor.grid.length;
  const width = floor.grid[0]?.length || 0;
  const candidates: { x: number; y: number }[] = [];
  const candidateSet = new Set<string>();

  // Helper to check spacing from existing routers
  const isFarEnoughFromExisting = (x: number, y: number) => {
    return existingRouters.every(
      (r) => Math.hypot(r.x - x, r.y - y) >= MIN_ROUTER_SPACING_CELLS
    );
  };

  // 1. Adjacent to walls, doors, corners
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (floor.grid[y][x] !== 'EMPTY') continue; // must be walkable

      // check if adjacent to a wall or door
      let isAdjacentToWallOrDoor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const cell = floor.grid[y + dy][x + dx];
          if (cell === 'WALL' || cell === 'DOOR') {
            isAdjacentToWallOrDoor = true;
            break;
          }
        }
        if (isAdjacentToWallOrDoor) break;
      }

      if (isAdjacentToWallOrDoor && isFarEnoughFromExisting(x, y)) {
        candidateSet.add(`${x},${y}`);
      }
    }
  }

  // 2. Open-area candidate per room
  for (const room of floor.rooms) {
    const rx = Math.floor(room.x + room.width / 2);
    const ry = Math.floor(room.y + room.height / 2);
    if (
      ry >= 0 &&
      ry < height &&
      rx >= 0 &&
      rx < width &&
      floor.grid[ry][rx] === 'EMPTY' &&
      isFarEnoughFromExisting(rx, ry)
    ) {
      candidateSet.add(`${rx},${ry}`);
    }
  }

  for (const key of candidateSet) {
    const [cx, cy] = key.split(',').map(Number);
    candidates.push({ x: cx, y: cy });
  }

  return candidates;
}

/**
 * Calculates candidate multi-objective score
 * Score = 0.60 * coverage + 0.20 * avg_link_len_norm + 0.20 * angular_diversity
 */
export function calculatePlacementScore(
  floor: FloorData,
  candidateRouters: RouterNode[],
  band: RadioBand,
  thresholdDbm: number = -80.0
): { score: number; coveragePct: number; linkLengthNorm: number; angularDiversity: number } {
  const { coveragePct } = evaluateCoverage(floor, candidateRouters, band, thresholdDbm);
  const covNorm = coveragePct / 100.0;

  const linkLengthNorm = calculateAvgLinkLengthNorm(
    candidateRouters,
    floor.width,
    floor.height,
    floor.cellSizeMeters
  );

  const angularDiversity = calculateAngularDiversity(candidateRouters);

  const score = 0.60 * covNorm + 0.20 * linkLengthNorm + 0.20 * angularDiversity;

  return { score, coveragePct, linkLengthNorm, angularDiversity };
}

/**
 * Finds the single best next router placement on the floor using greedy multi-objective score
 */
export function findNextBestRouter(
  floor: FloorData,
  existingRouters: RouterNode[],
  band: RadioBand,
  thresholdDbm: number = -80.0
): { bestCandidate: RouterNode | null; bestScore: number; bestCoveragePct: number } {
  const candidates = generatePlacementCandidates(floor, existingRouters);

  let bestCandidate: RouterNode | null = null;
  let bestScore = -1;
  let bestCoveragePct = 0;

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const testRouter: RouterNode = {
      id: `opt_r_${Date.now()}_${i}`,
      x: c.x,
      y: c.y,
      floorId: floor.id,
      txPowerDbm: 14.0,
      label: `Node ${existingRouters.length + 1}`,
    };

    const candidateRouters = [...existingRouters, testRouter];
    const { score, coveragePct } = calculatePlacementScore(
      floor,
      candidateRouters,
      band,
      thresholdDbm
    );

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = testRouter;
      bestCoveragePct = coveragePct;
    }
  }

  return { bestCandidate, bestScore, bestCoveragePct };
}
