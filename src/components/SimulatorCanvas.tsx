/**
 * SignalTwin - High-Performance Interactive HTML5 Canvas Simulator
 * Renders Grid, Walls, RF Coverage Heatmap, Dead Zones, RTI Density, Mesh Links, Occupants
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  ActiveTool,
  CellType,
  FloorData,
  RadioBand,
  RouterNode,
  RTILink,
  ViewToggles,
} from '../types';
import { calculateRSSI } from '../utils/rfModel';
import { reconstructRTIDensityGrid } from '../utils/rtiSensing';

interface SimulatorCanvasProps {
  currentFloor: FloorData;
  allFloors: FloorData[];
  selectedBand: RadioBand;
  viewToggles: ViewToggles;
  activeTool: ActiveTool;
  rtiLinks: RTILink[];
  hoverCell: { x: number; y: number } | null;
  selectedCell: { x: number; y: number } | null;
  onCellClick: (x: number, y: number) => void;
  onCellHover: (x: number, y: number | null) => void;
}

export const SimulatorCanvas: React.FC<SimulatorCanvasProps> = ({
  currentFloor,
  allFloors,
  selectedBand,
  viewToggles,
  activeTool,
  rtiLinks,
  hoverCell,
  selectedCell,
  onCellClick,
  onCellHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute scale and offsets
  const gridWidth = currentFloor.width;
  const gridHeight = currentFloor.height;

  // Render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const cellPixelSize = Math.min(width / gridWidth, height / gridHeight);
    const offsetX = (width - gridWidth * cellPixelSize) / 2;
    const offsetY = (height - gridHeight * cellPixelSize) / 2;

    // 1. Clear background (#0F1113)
    ctx.fillStyle = '#0F1113';
    ctx.fillRect(0, 0, width, height);

    // 2. Pre-calculate multi-floor RSSI map on current floor
    const rssiMap: number[][] = Array.from({ length: gridHeight }, () =>
      Array(gridWidth).fill(-999)
    );

    // Gather all routers across all floors
    const allRouters: RouterNode[] = [];
    for (const fl of allFloors) {
      allRouters.push(...fl.routers);
    }

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        let maxRssi = -999.0;
        for (const r of allRouters) {
          const sourceFloor = allFloors.find((f) => f.id === r.floorId) || currentFloor;
          const res = calculateRSSI(
            r.x,
            r.y,
            r.floorId,
            x,
            y,
            currentFloor.id,
            sourceFloor.grid,
            selectedBand,
            currentFloor.cellSizeMeters,
            r.txPowerDbm
          );
          if (res.finalRssiDbm > maxRssi) {
            maxRssi = res.finalRssiDbm;
          }
        }
        rssiMap[y][x] = maxRssi;
      }
    }

    // 3. Pre-calculate RTI Crowd Density Map if enabled
    let rtiDensityGrid: number[][] | null = null;
    if (viewToggles.showRTIDensity) {
      rtiDensityGrid = reconstructRTIDensityGrid(
        gridWidth,
        gridHeight,
        rtiLinks,
        currentFloor.routers,
        currentFloor.cellSizeMeters
      );
    }

    // 4. Render Grid Cells (Floorplan & Heatmaps)
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const px = offsetX + x * cellPixelSize;
        const py = offsetY + y * cellPixelSize;
        const cellType = currentFloor.grid[y][x];

        if (cellType === 'WALL') {
          // Wall Structure (#2A2E33 / #3A3F46)
          ctx.fillStyle = '#2A2E33';
          ctx.fillRect(px, py, cellPixelSize, cellPixelSize);
          ctx.strokeStyle = '#3A3F46';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cellPixelSize, cellPixelSize);
        } else if (cellType === 'DOOR') {
          // Door Gap (#16191D)
          ctx.fillStyle = '#16191D';
          ctx.fillRect(px, py, cellPixelSize, cellPixelSize);
          ctx.strokeStyle = '#FF8A00';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(px + 2, py + 2, cellPixelSize - 4, cellPixelSize - 4);
          ctx.setLineDash([]);
        } else {
          // EMPTY Walkable Cell (#16191D)
          ctx.fillStyle = '#16191D';
          ctx.fillRect(px, py, cellPixelSize, cellPixelSize);

          // RF Coverage Heatmap Layer (Signal Green #4CAF50)
          if (viewToggles.showCoverageHeatmap) {
            const rssi = rssiMap[y][x];
            if (rssi > -90) {
              const norm = Math.max(0, Math.min(1, (rssi + 95) / 40));
              ctx.fillStyle = `rgba(76, 175, 80, ${norm * 0.3})`;
              ctx.fillRect(px, py, cellPixelSize, cellPixelSize);
            }
          }

          // Dead Zone Warning Layer (RSSI < threshold)
          const rssi = rssiMap[y][x];
          const isDeadZone = rssi < viewToggles.deadZoneThresholdDbm;

          if (isDeadZone && viewToggles.showDeadZonesOnly) {
            // Hazard Crimson #F44336
            ctx.fillStyle = 'rgba(244, 67, 54, 0.35)';
            ctx.fillRect(px, py, cellPixelSize, cellPixelSize);

            // Diagonal Hazard Stripes
            ctx.strokeStyle = 'rgba(244, 67, 54, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py + cellPixelSize);
            ctx.lineTo(px + cellPixelSize, py);
            ctx.stroke();
          }

          // RTI Reconstructed Density Overlay (#FF8A00)
          if (rtiDensityGrid) {
            const density = rtiDensityGrid[y][x];
            if (density > 0.05) {
              const alpha = Math.min(0.8, density * 0.3);
              ctx.fillStyle = `rgba(255, 138, 0, ${alpha})`;
              ctx.fillRect(px, py, cellPixelSize, cellPixelSize);
            }
          }

          // Grid Hairlines (#2A2E33)
          ctx.strokeStyle = 'rgba(42, 46, 51, 0.5)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellPixelSize, cellPixelSize);
        }
      }
    }

    // 5. Render Room Labels & Boundaries
    if (viewToggles.showRoomLabels) {
      for (const room of currentFloor.rooms) {
        const rpx = offsetX + room.x * cellPixelSize;
        const rpy = offsetY + room.y * cellPixelSize;
        const rpw = room.width * cellPixelSize;
        const rph = room.height * cellPixelSize;

        // Subtle boundary outline
        ctx.strokeStyle = 'rgba(138, 142, 148, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rpx, rpy, rpw, rph);

        // Room Title Pill
        ctx.fillStyle = 'rgba(22, 25, 29, 0.9)';
        ctx.fillRect(rpx + 4, rpy + 4, Math.min(rpw - 8, room.name.length * 7 + 10), 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(room.name, rpx + 8, rpy + 15);
      }
    }

    // 6. Render RTI Link Mesh Lines
    if (viewToggles.showMeshLinks) {
      for (const link of rtiLinks) {
        const ax = offsetX + (link.routerA.x + 0.5) * cellPixelSize;
        const ay = offsetY + (link.routerA.y + 0.5) * cellPixelSize;
        const bx = offsetX + (link.routerB.x + 0.5) * cellPixelSize;
        const by = offsetY + (link.routerB.y + 0.5) * cellPixelSize;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);

        if (link.isWeak) {
          ctx.strokeStyle = 'rgba(244, 67, 54, 0.6)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
        } else if (link.deltaRssi > 0.5) {
          ctx.strokeStyle = 'rgba(255, 138, 0, 0.9)';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(255, 138, 0, 0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 7. Render True Occupants (if enabled)
    if (viewToggles.showTrueOccupants) {
      for (const occ of currentFloor.occupants) {
        const cx = offsetX + (occ.x + 0.5) * cellPixelSize;
        const cy = offsetY + (occ.y + 0.5) * cellPixelSize;

        // Motion Path vector
        if (occ.path && occ.path.length > 1) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          for (let p = 1; p < occ.path.length; p++) {
            const px = offsetX + (occ.path[p][0] + 0.5) * cellPixelSize;
            const py = offsetY + (occ.path[p][1] + 0.5) * cellPixelSize;
            ctx.lineTo(px, py);
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Pulse Ring
        ctx.beginPath();
        ctx.arc(cx, cy, cellPixelSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(cx, cy, cellPixelSize * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#FF8A00';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 8. Render Routers on Current Floor
    for (let i = 0; i < currentFloor.routers.length; i++) {
      const r = currentFloor.routers[i];
      const rx = offsetX + (r.x + 0.5) * cellPixelSize;
      const ry = offsetY + (r.y + 0.5) * cellPixelSize;

      // Outer Pulse Ring
      ctx.beginPath();
      ctx.arc(rx, ry, cellPixelSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FF8A00';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label Tag
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px monospace';
      ctx.fillText(`R${i + 1}`, rx + 10, ry - 5);
    }

    // 9. Render Hover & Selection Crosshairs
    const highlightCell = hoverCell || selectedCell;
    if (highlightCell) {
      const hx = offsetX + highlightCell.x * cellPixelSize;
      const hy = offsetY + highlightCell.y * cellPixelSize;

      ctx.strokeStyle = activeTool === 'REMOVE_ROUTER' ? '#F44336' : '#FF8A00';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, cellPixelSize, cellPixelSize);

      ctx.fillStyle = activeTool === 'REMOVE_ROUTER' ? '#F44336' : '#FF8A00';
      ctx.fillRect(hx - 2, hy - 2, 4, 4);
      ctx.fillRect(hx + cellPixelSize - 2, hy - 2, 4, 4);
      ctx.fillRect(hx - 2, hy + cellPixelSize - 2, 4, 4);
      ctx.fillRect(hx + cellPixelSize - 2, hy + cellPixelSize - 2, 4, 4);
    }
  }, [
    currentFloor,
    allFloors,
    selectedBand,
    viewToggles,
    activeTool,
    rtiLinks,
    hoverCell,
    selectedCell,
    gridWidth,
    gridHeight,
  ]);

  // Canvas Resize observer & redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        renderCanvas();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Mouse interaction handling
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellPixelSize = Math.min(canvas.width / gridWidth, canvas.height / gridHeight);
    const offsetX = (canvas.width - gridWidth * cellPixelSize) / 2;
    const offsetY = (canvas.height - gridHeight * cellPixelSize) / 2;

    const cellX = Math.floor((mouseX - offsetX) / cellPixelSize);
    const cellY = Math.floor((mouseY - offsetY) / cellPixelSize);

    if (cellX >= 0 && cellX < gridWidth && cellY >= 0 && cellY < gridHeight) {
      onCellHover(cellX, cellY);
    } else {
      onCellHover(0, null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellPixelSize = Math.min(canvas.width / gridWidth, canvas.height / gridHeight);
    const offsetX = (canvas.width - gridWidth * cellPixelSize) / 2;
    const offsetY = (canvas.height - gridHeight * cellPixelSize) / 2;

    const cellX = Math.floor((mouseX - offsetX) / cellPixelSize);
    const cellY = Math.floor((mouseY - offsetY) / cellPixelSize);

    if (cellX >= 0 && cellX < gridWidth && cellY >= 0 && cellY < gridHeight) {
      onCellClick(cellX, cellY);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0B0F17] rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onCellHover(0, null)}
        onClick={handleClick}
        className="cursor-crosshair w-full h-full block"
      />
    </div>
  );
};
