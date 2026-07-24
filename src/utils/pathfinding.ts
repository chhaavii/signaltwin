/**
 * SignalTwin - A* Pathfinding Module
 * 8-directional movement, diagonal cost sqrt(2), nodes closed on expansion
 */

import { CellType } from '../types';

interface PriorityNode {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // estimated cost to goal
  f: number; // g + h
  parent: PriorityNode | null;
}

const SQRT_2 = Math.SQRT2; // ~1.4142

// 8 directions: N, S, E, W, NE, NW, SE, SW
const DIRECTIONS = [
  { dx: 0, dy: -1, cost: 1.0 },
  { dx: 0, dy: 1, cost: 1.0 },
  { dx: -1, dy: 0, cost: 1.0 },
  { dx: 1, dy: 0, cost: 1.0 },
  { dx: -1, dy: -1, cost: SQRT_2 },
  { dx: 1, dy: -1, cost: SQRT_2 },
  { dx: -1, dy: 1, cost: SQRT_2 },
  { dx: 1, dy: 1, cost: SQRT_2 },
];

/**
 * Octile distance heuristic for 8-directional movement
 */
function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return Math.min(dx, dy) * SQRT_2 + Math.abs(dx - dy);
}

/**
 * A* Pathfinding algorithm on grid.
 * Nodes closed strictly ON EXPANSION (not on first discovery) to guarantee true shortest path.
 */
export function findPathAStar(
  grid: CellType[][],
  startX: number,
  startY: number,
  targetX: number,
  targetY: number
): [number, number][] {
  const height = grid.length;
  if (height === 0) return [];
  const width = grid[0].length;

  if (
    startX < 0 ||
    startX >= width ||
    startY < 0 ||
    startY >= height ||
    targetX < 0 ||
    targetX >= width ||
    targetY < 0 ||
    targetY >= height
  ) {
    return [];
  }

  // Check if target is a wall
  if (grid[targetY][targetX] === 'WALL') return [];

  const openList: PriorityNode[] = [];
  const closedSet = new Set<string>();
  const gScoreMap = new Map<string, number>();

  const startNode: PriorityNode = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY, targetX, targetY),
    f: heuristic(startX, startY, targetX, targetY),
    parent: null,
  };

  openList.push(startNode);
  gScoreMap.set(`${startX},${startY}`, 0);

  while (openList.length > 0) {
    // Find node with smallest f value
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    const currentKey = `${current.x},${current.y}`;

    // Target reached
    if (current.x === targetX && current.y === targetY) {
      const path: [number, number][] = [];
      let curr: PriorityNode | null = current;
      while (curr) {
        path.unshift([curr.x, curr.y]);
        curr = curr.parent;
      }
      return path;
    }

    // CLOSE NODE ON EXPANSION (not on discovery)
    if (closedSet.has(currentKey)) continue;
    closedSet.add(currentKey);

    // Expand 8 neighbors
    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (grid[ny][nx] === 'WALL') continue;

      // Prevent cutting corners through walls diagonally
      if (dir.dx !== 0 && dir.dy !== 0) {
        if (grid[current.y][nx] === 'WALL' && grid[ny][current.x] === 'WALL') {
          continue;
        }
      }

      const neighborKey = `${nx},${ny}`;
      if (closedSet.has(neighborKey)) continue;

      const tentativeG = current.g + dir.cost;
      const existingG = gScoreMap.get(neighborKey);

      if (existingG === undefined || tentativeG < existingG) {
        gScoreMap.set(neighborKey, tentativeG);
        const h = heuristic(nx, ny, targetX, targetY);
        const neighborNode: PriorityNode = {
          x: nx,
          y: ny,
          g: tentativeG,
          h: h,
          f: tentativeG + h,
          parent: current,
        };
        openList.push(neighborNode);
      }
    }
  }

  return []; // No path found
}
