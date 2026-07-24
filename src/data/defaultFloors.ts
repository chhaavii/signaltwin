/**
 * SignalTwin - Default Multi-Floor Blueprints
 * 3 Floors: B1 (Subsurface Deck), L1 (Main Concourse), L2 (Executive Suite)
 */

import { CellType, FloorData, Room } from '../types';

/**
 * Creates a blank grid of size width x height filled with 'EMPTY'
 */
function createGrid(width: number, height: number): CellType[][] {
  return Array.from({ length: height }, () => Array(width).fill('EMPTY'));
}

/**
 * Helper to build rectangular room walls with specified door gaps
 */
function addRoomToGrid(
  grid: CellType[][],
  room: Room,
  doors: { x: number; y: number }[]
) {
  const { x, y, width, height } = room;

  // Outer boundary walls
  for (let rx = x; rx < x + width; rx++) {
    for (let ry = y; ry < y + height; ry++) {
      if (
        rx === x ||
        rx === x + width - 1 ||
        ry === y ||
        ry === y + height - 1
      ) {
        grid[ry][rx] = 'WALL';
      }
    }
  }

  // Door openings
  for (const d of doors) {
    if (d.y >= 0 && d.y < grid.length && d.x >= 0 && d.x < grid[0].length) {
      grid[d.y][d.x] = 'DOOR';
    }
  }
}

/**
 * Build Floor 0: B1 Subsurface Tech & Server Vault Deck
 */
function buildFloorB1(): FloorData {
  const width = 28;
  const height = 18;
  const grid = createGrid(width, height);

  // Outer perimeter walls
  for (let x = 0; x < width; x++) {
    grid[0][x] = 'WALL';
    grid[height - 1][x] = 'WALL';
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = 'WALL';
    grid[y][width - 1] = 'WALL';
  }

  // Rooms definition
  const rooms: Room[] = [
    { id: 'b1_r1', name: 'Server Vault A', x: 2, y: 2, width: 8, height: 7, color: '#38BDF8' },
    { id: 'b1_r2', name: 'Power Storage B', x: 10, y: 2, width: 8, height: 7, color: '#818CF8' },
    { id: 'b1_r3', name: 'Maintenance Hub', x: 18, y: 2, width: 8, height: 7, color: '#A78BFA' },
    { id: 'b1_r4', name: 'HVAC Plant', x: 2, y: 10, width: 10, height: 6, color: '#F472B6' },
    { id: 'b1_r5', name: 'Security Core', x: 16, y: 10, width: 10, height: 6, color: '#34D399' },
  ];

  addRoomToGrid(grid, rooms[0], [{ x: 6, y: 8 }]); // Door south
  addRoomToGrid(grid, rooms[1], [{ x: 14, y: 8 }]); // Door south
  addRoomToGrid(grid, rooms[2], [{ x: 22, y: 8 }]); // Door south
  addRoomToGrid(grid, rooms[3], [{ x: 7, y: 10 }]); // Door north
  addRoomToGrid(grid, rooms[4], [{ x: 21, y: 10 }]); // Door north

  return {
    id: 0,
    elevation: 'B1',
    name: 'Subsurface Tech Vault',
    description: 'Heavy concrete partition walls & server racks. High RF attenuation.',
    width,
    height,
    cellSizeMeters: 1.0,
    grid,
    rooms,
    routers: [
      { id: 'b1_r_1', x: 4, y: 4, floorId: 0, txPowerDbm: 14, label: 'Node B1-Alpha' },
      { id: 'b1_r_2', x: 22, y: 4, floorId: 0, txPowerDbm: 14, label: 'Node B1-Beta' },
    ],
    occupants: [
      { id: 'b1_occ_1', x: 14, y: 9, floorId: 0, targetX: 14, targetY: 9, path: [], pauseTicks: 0 },
      { id: 'b1_occ_2', x: 6, y: 4, floorId: 0, targetX: 6, targetY: 4, path: [], pauseTicks: 0 },
      { id: 'b1_occ_3', x: 20, y: 12, floorId: 0, targetX: 20, targetY: 12, path: [], pauseTicks: 0 },
    ],
  };
}

/**
 * Build Floor 1: L1 Main Transit & Concourse Deck
 */
function buildFloorL1(): FloorData {
  const width = 28;
  const height = 18;
  const grid = createGrid(width, height);

  // Perimeter
  for (let x = 0; x < width; x++) {
    grid[0][x] = 'WALL';
    grid[height - 1][x] = 'WALL';
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = 'WALL';
    grid[y][width - 1] = 'WALL';
  }

  const rooms: Room[] = [
    { id: 'l1_r1', name: 'North Atrium', x: 2, y: 2, width: 11, height: 6, color: '#38BDF8' },
    { id: 'l1_r2', name: 'VIP Lounge', x: 15, y: 2, width: 11, height: 6, color: '#F472B6' },
    { id: 'l1_r3', name: 'Retail Concourse', x: 2, y: 10, width: 11, height: 6, color: '#FBBF24' },
    { id: 'l1_r4', name: 'Baggage Terminal', x: 15, y: 10, width: 11, height: 6, color: '#34D399' },
  ];

  addRoomToGrid(grid, rooms[0], [{ x: 7, y: 7 }]);
  addRoomToGrid(grid, rooms[1], [{ x: 20, y: 7 }]);
  addRoomToGrid(grid, rooms[2], [{ x: 7, y: 10 }]);
  addRoomToGrid(grid, rooms[3], [{ x: 20, y: 10 }]);

  return {
    id: 1,
    elevation: 'L1',
    name: 'Main Concourse Deck',
    description: 'High foot-traffic transit concourse with wide open corridors & glass partitions.',
    width,
    height,
    cellSizeMeters: 1.0,
    grid,
    rooms,
    routers: [
      { id: 'l1_r_1', x: 4, y: 4, floorId: 1, txPowerDbm: 14, label: 'Node L1-Alpha' },
      { id: 'l1_r_2', x: 23, y: 4, floorId: 1, txPowerDbm: 14, label: 'Node L1-Beta' },
      { id: 'l1_r_3', x: 4, y: 13, floorId: 1, txPowerDbm: 14, label: 'Node L1-Gamma' },
      { id: 'l1_r_4', x: 23, y: 13, floorId: 1, txPowerDbm: 14, label: 'Node L1-Delta' },
    ],
    occupants: [
      { id: 'l1_occ_1', x: 7, y: 8, floorId: 1, targetX: 7, targetY: 8, path: [], pauseTicks: 0 },
      { id: 'l1_occ_2', x: 14, y: 8, floorId: 1, targetX: 14, targetY: 8, path: [], pauseTicks: 0 },
      { id: 'l1_occ_3', x: 20, y: 8, floorId: 1, targetX: 20, targetY: 8, path: [], pauseTicks: 0 },
      { id: 'l1_occ_4', x: 8, y: 12, floorId: 1, targetX: 8, targetY: 12, path: [], pauseTicks: 0 },
      { id: 'l1_occ_5', x: 18, y: 4, floorId: 1, targetX: 18, targetY: 4, path: [], pauseTicks: 0 },
    ],
  };
}

/**
 * Build Floor 2: L2 Executive & Research Lab Deck
 */
function buildFloorL2(): FloorData {
  const width = 28;
  const height = 18;
  const grid = createGrid(width, height);

  // Perimeter
  for (let x = 0; x < width; x++) {
    grid[0][x] = 'WALL';
    grid[height - 1][x] = 'WALL';
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = 'WALL';
    grid[y][width - 1] = 'WALL';
  }

  const rooms: Room[] = [
    { id: 'l2_r1', name: 'Executive Suite', x: 2, y: 2, width: 7, height: 6, color: '#A78BFA' },
    { id: 'l2_r2', name: 'RF Lab 1', x: 10, y: 2, width: 8, height: 6, color: '#38BDF8' },
    { id: 'l2_r3', name: 'RF Lab 2', x: 19, y: 2, width: 7, height: 6, color: '#34D399' },
    { id: 'l2_r4', name: 'Conf Room A', x: 2, y: 10, width: 11, height: 6, color: '#818CF8' },
    { id: 'l2_r5', name: 'Conf Room B', x: 15, y: 10, width: 11, height: 6, color: '#F472B6' },
  ];

  addRoomToGrid(grid, rooms[0], [{ x: 5, y: 7 }]);
  addRoomToGrid(grid, rooms[1], [{ x: 14, y: 7 }]);
  addRoomToGrid(grid, rooms[2], [{ x: 22, y: 7 }]);
  addRoomToGrid(grid, rooms[3], [{ x: 7, y: 10 }]);
  addRoomToGrid(grid, rooms[4], [{ x: 20, y: 10 }]);

  return {
    id: 2,
    elevation: 'L2',
    name: 'Executive & Research Deck',
    description: 'Multiple dense office partitions and shielded laboratory spaces.',
    width,
    height,
    cellSizeMeters: 1.0,
    grid,
    rooms,
    routers: [
      { id: 'l2_r_1', x: 5, y: 4, floorId: 2, txPowerDbm: 14, label: 'Node L2-Alpha' },
      { id: 'l2_r_2', x: 22, y: 4, floorId: 2, txPowerDbm: 14, label: 'Node L2-Beta' },
      { id: 'l2_r_3', x: 14, y: 13, floorId: 2, txPowerDbm: 14, label: 'Node L2-Gamma' },
    ],
    occupants: [
      { id: 'l2_occ_1', x: 5, y: 4, floorId: 2, targetX: 5, targetY: 4, path: [], pauseTicks: 0 },
      { id: 'l2_occ_2', x: 14, y: 4, floorId: 2, targetX: 14, targetY: 4, path: [], pauseTicks: 0 },
    ],
  };
}

export function getDefaultFloors(): FloorData[] {
  return [buildFloorB1(), buildFloorL1(), buildFloorL2()];
}
