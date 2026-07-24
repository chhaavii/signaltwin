/**
 * SignalTwin - Core Type Definitions
 * Spectrum-Analyzer & Site-Survey Precision Tool
 */

export type CellType = 'EMPTY' | 'WALL' | 'DOOR';

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface RouterNode {
  id: string;
  x: number;
  y: number;
  floorId: number;
  txPowerDbm: number; // Default 14 dBm
  label?: string;
}

export interface Occupant {
  id: string;
  x: number;
  y: number;
  floorId: number;
  targetX: number;
  targetY: number;
  path: [number, number][];
  pauseTicks: number;
}

export interface RadioBand {
  id: 'lora868' | 'lora915' | 'wifi24' | 'wifi50';
  name: string;
  frequencyMHz: number;
  wallLossDb: number;
  floorSlabLossDb: number;
  description: string;
}

export interface FloorData {
  id: number;
  elevation: string; // 'B1', 'L1', 'L2'
  name: string;
  description: string;
  width: number; // grid columns
  height: number; // grid rows
  cellSizeMeters: number; // e.g. 1 meter per cell
  grid: CellType[][]; // [y][x]
  rooms: Room[];
  routers: RouterNode[];
  occupants: Occupant[];
}

export interface RTILink {
  id: string;
  routerA: RouterNode;
  routerB: RouterNode;
  baselineRssiDbm: number;
  currentRssiDbm: number;
  deltaRssi: number;
  isWeak: boolean; // < -85 dBm baseline
  lengthMeters: number;
}

export interface InspectionData {
  cellX: number;
  cellY: number;
  floorId: number;
  roomName: string | null;
  cellType: CellType;
  routerSignals: {
    routerId: string;
    routerLabel: string;
    routerFloorId: number;
    distanceMeters: number;
    fsplDb: number;
    wallsCrossed: number;
    wallLossDb: number;
    nonLosPenaltyDb: number;
    floorDiff: number;
    floorLossDb: number;
    finalRssiDbm: number;
  }[];
  maxRssiDbm: number;
  isDeadZone: boolean;
  rtiEstimatedDensity: number;
  relevantLinks: {
    linkId: string;
    ellipseWeight: number;
    deltaRssi: number;
  }[];
}

export interface OptimizerStepResult {
  step: number;
  placedRouter: RouterNode;
  coveragePct: number;
  deadZonePct: number;
  activeRtiLinks: number;
  score: number;
}

export interface SimulatorStats {
  currentFloor: {
    totalWalkableCells: number;
    coveredCells: number;
    deadZoneCells: number;
    coveragePct: number;
    deadZonePct: number;
    routerCount: number;
    rtiLinkCount: number;
    weakLinkCount: number;
    occupantCount: number;
  };
  aggregate: {
    totalWalkableCells: number;
    coveredCells: number;
    deadZoneCells: number;
    coveragePct: number;
    deadZonePct: number;
    totalRouters: number;
    totalRtiLinks: number;
    totalOccupants: number;
  };
}

export type ActiveTool = 'INSPECT' | 'ADD_ROUTER' | 'REMOVE_ROUTER' | 'ADD_WALL' | 'ADD_DOOR' | 'ERASE' | 'ADD_OCCUPANT';

export interface ViewToggles {
  showCoverageHeatmap: boolean;
  showDeadZonesOnly: boolean;
  showRTIDensity: boolean;
  showMeshLinks: boolean;
  showTrueOccupants: boolean;
  showRoomLabels: boolean;
  deadZoneThresholdDbm: number; // e.g. -80 dBm
}
