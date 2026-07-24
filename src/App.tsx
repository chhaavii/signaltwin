/**
 * SignalTwin - Indoor RF & Crowd Digital Twin Simulator
 * Visual Direction: Spectrum-Analyzer & Site-Survey Precision Tool
 * Color Palette:
 *  - Base Canvas Dark: #0B0F17 (Deep Spectrum Slate)
 *  - Panel Surface: #141B26 (Avionic UI Slate)
 *  - RF Signal Green: #10B981 (Emerald Telemetry)
 *  - RTI Mesh Amber: #F59E0B (Amber Mesh)
 *  - Dead Zone Warning: #EF4444 / #EC4899 (Pulse Crimson/Pink)
 *  - Accent Cyber Cyan: #06B6D4 (RF Cyan)
 *  - Wall Structure Neutral: #334155 (Slate Slab)
 * Floor Switcher Concept:
 *  "An isometric multi-deck stack indicator with elevation levels (B1, L1, L2) that highlights
 *  vertical RF slab leakage vectors and active floor elevation seamlessly."
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ActiveTool,
  FloorData,
  InspectionData,
  Occupant,
  OptimizerStepResult,
  RadioBand,
  RouterNode,
  RTILink,
  ViewToggles,
} from './types';
import { getDefaultFloors } from './data/defaultFloors';
import { RADIO_BANDS, calculateRSSI } from './utils/rfModel';
import { findPathAStar } from './utils/pathfinding';
import {
  computeRTILinks,
  reconstructRTIDensityGrid,
  calculateEllipseWeight,
} from './utils/rtiSensing';
import { evaluateCoverage, findNextBestRouter } from './utils/optimizer';

import { Header } from './components/Header';
import { FloorSwitcher } from './components/FloorSwitcher';
import { SimulatorCanvas } from './components/SimulatorCanvas';
import { InspectorModal } from './components/InspectorModal';
import { ProblemSolutionVisual } from './components/ProblemSolutionVisual';
import { ExplanationsPanel } from './components/ExplanationsPanel';
import { ControlPanel } from './components/ControlPanel';

export default function App() {
  // Multi-floor state
  const [floors, setFloors] = useState<FloorData[]>(() => getDefaultFloors());
  const [activeFloorId, setActiveFloorId] = useState<number>(1); // Default Deck L1

  // Radio & Environment settings
  const [selectedBand, setSelectedBand] = useState<RadioBand>(RADIO_BANDS.wifi24);
  const [deadZoneThresholdDbm, setDeadZoneThresholdDbm] = useState<number>(-80.0);

  // Active Tool & Canvas Interactions
  const [activeTool, setActiveTool] = useState<ActiveTool>('INSPECT');
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [inspectionData, setInspectionData] = useState<InspectionData | null>(null);

  // View Toggles
  const [viewToggles, setViewToggles] = useState<ViewToggles>({
    showCoverageHeatmap: true,
    showDeadZonesOnly: true,
    showRTIDensity: true,
    showMeshLinks: true,
    showTrueOccupants: true,
    showRoomLabels: true,
    deadZoneThresholdDbm: -80.0,
  });

  // Simulation loop controls
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(2);

  // Panels & Modals
  const [showOptimizerPanel, setShowOptimizerPanel] = useState<boolean>(false);
  const [showExplanationsPanel, setShowExplanationsPanel] = useState<boolean>(false);

  // Optimizer Step-by-step state
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizerSteps, setOptimizerSteps] = useState<OptimizerStepResult[]>([]);
  const [initialDeadZonePct, setInitialDeadZonePct] = useState<number>(62.0);

  // Current active floor reference
  const currentFloor = floors.find((f) => f.id === activeFloorId) || floors[0];

  // Keep viewToggles threshold in sync
  useEffect(() => {
    setViewToggles((prev) => ({ ...prev, deadZoneThresholdDbm }));
  }, [deadZoneThresholdDbm]);

  // Compute live RTI links on active floor
  const rtiLinks: RTILink[] = useMemo(
    () =>
      computeRTILinks(
        currentFloor.routers,
        currentFloor.occupants,
        currentFloor.grid,
        selectedBand,
        currentFloor.id,
        currentFloor.cellSizeMeters
      ),
    [
      currentFloor.routers,
      currentFloor.occupants,
      currentFloor.grid,
      selectedBand,
      currentFloor.id,
      currentFloor.cellSizeMeters,
    ]
  );

  // Compute live coverage stats for current floor
  const currentFloorCoverage = useMemo(
    () =>
      evaluateCoverage(
        currentFloor,
        currentFloor.routers,
        selectedBand,
        deadZoneThresholdDbm
      ),
    [currentFloor, selectedBand, deadZoneThresholdDbm]
  );

  // Update Inspection Data when selected cell or floor changes
  const updateInspection = useCallback(
    (cellX: number, cellY: number) => {
      const height = currentFloor.grid.length;
      const width = currentFloor.grid[0]?.length || 0;
      if (cellX < 0 || cellX >= width || cellY < 0 || cellY >= height) {
        setInspectionData(null);
        return;
      }

      // Identify room name
      let roomName: string | null = null;
      for (const room of currentFloor.rooms) {
        if (
          cellX >= room.x &&
          cellX < room.x + room.width &&
          cellY >= room.y &&
          cellY < room.y + room.height
        ) {
          roomName = room.name;
          break;
        }
      }

      // Gather signals from all routers across all floors
      const routerSignals: InspectionData['routerSignals'] = [];
      let maxRssi = -999.0;

      for (const fl of floors) {
        for (const r of fl.routers) {
          const sourceFloor = fl;
          const res = calculateRSSI(
            r.x,
            r.y,
            r.floorId,
            cellX,
            cellY,
            currentFloor.id,
            sourceFloor.grid,
            selectedBand,
            currentFloor.cellSizeMeters,
            r.txPowerDbm
          );

          if (res.finalRssiDbm > maxRssi) maxRssi = res.finalRssiDbm;

          routerSignals.push({
            routerId: r.id,
            routerLabel: r.label || `Node (${r.x},${r.y})`,
            routerFloorId: r.floorId,
            distanceMeters: res.distanceMeters,
            fsplDb: res.fsplDb,
            wallsCrossed: res.wallsCrossed,
            wallLossDb: res.wallLossDb,
            nonLosPenaltyDb: res.nonLosPenaltyDb,
            floorDiff: res.floorDiff,
            floorLossDb: res.floorLossDb,
            finalRssiDbm: res.finalRssiDbm,
          });
        }
      }

      // RTI reconstruction at cellX, cellY
      const rtiDensityGrid = reconstructRTIDensityGrid(
        width,
        height,
        rtiLinks,
        currentFloor.routers,
        currentFloor.cellSizeMeters
      );
      const rtiEstimatedDensity = rtiDensityGrid[cellY][cellX];

      // Relevant link weights at cellX, cellY
      const relevantLinks: InspectionData['relevantLinks'] = [];
      for (const link of rtiLinks) {
        if (link.isWeak) continue;
        const { weight } = calculateEllipseWeight(
          cellX,
          cellY,
          link.routerA.x,
          link.routerA.y,
          link.routerB.x,
          link.routerB.y,
          currentFloor.cellSizeMeters
        );
        if (weight > 0.05) {
          relevantLinks.push({
            linkId: `${link.routerA.label} ↔ ${link.routerB.label}`,
            ellipseWeight: weight,
            deltaRssi: link.deltaRssi,
          });
        }
      }

      relevantLinks.sort((a, b) => b.ellipseWeight - a.ellipseWeight);

      setInspectionData({
        cellX,
        cellY,
        floorId: currentFloor.id,
        roomName,
        cellType: currentFloor.grid[cellY][cellX],
        routerSignals,
        maxRssiDbm: maxRssi,
        isDeadZone: maxRssi < deadZoneThresholdDbm,
        rtiEstimatedDensity,
        relevantLinks,
      });
    },
    [currentFloor, floors, selectedBand, deadZoneThresholdDbm, rtiLinks]
  );

  // Trigger inspection update if selectedCell changes
  useEffect(() => {
    if (selectedCell) {
      updateInspection(selectedCell.x, selectedCell.y);
    } else {
      setInspectionData(null);
    }
  }, [selectedCell, updateInspection]);

  // Simulation tick loop for occupant movement
  useEffect(() => {
    if (!isSimRunning) return;

    const interval = setInterval(() => {
      setFloors((prevFloors) =>
        prevFloors.map((fl) => {
          const updatedOccupants: Occupant[] = fl.occupants.map((occ) => {
            let { x, y, targetX, targetY, path, pauseTicks } = occ;

            // Handle pause state
            if (pauseTicks > 0) {
              return { ...occ, pauseTicks: pauseTicks - 1 };
            }

            // Pick a new random target if reached destination or no path
            if (path.length <= 1 || (x === targetX && y === targetY)) {
              // Pick a random room or random walkable cell
              let newTx = x;
              let newTy = y;
              if (fl.rooms.length > 0) {
                const randRoom = fl.rooms[Math.floor(Math.random() * fl.rooms.length)];
                newTx = Math.floor(randRoom.x + Math.random() * randRoom.width);
                newTy = Math.floor(randRoom.y + Math.random() * randRoom.height);
              } else {
                newTx = Math.floor(Math.random() * fl.width);
                newTy = Math.floor(Math.random() * fl.height);
              }

              // Ensure walkable
              if (
                newTy >= 0 &&
                newTy < fl.height &&
                newTx >= 0 &&
                newTx < fl.width &&
                fl.grid[newTy][newTx] !== 'WALL'
              ) {
                const newPath = findPathAStar(fl.grid, x, y, newTx, newTy);
                if (newPath.length > 1) {
                  path = newPath;
                  targetX = newTx;
                  targetY = newTy;
                }
              }
            }

            // Move step along path
            if (path.length > 1) {
              const nextStep = path[1];
              path = path.slice(1);
              x = nextStep[0];
              y = nextStep[1];
            } else {
              // Pause upon reaching
              pauseTicks = Math.floor(Math.random() * 20) + 10;
            }

            return { ...occ, x, y, targetX, targetY, path, pauseTicks };
          });

          return { ...fl, occupants: updatedOccupants };
        })
      );
    }, 400 / simSpeed);

    return () => clearInterval(interval);
  }, [isSimRunning, simSpeed]);

  // Handle Canvas Cell Click Tool Execution
  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({ x, y });

    if (activeTool === 'INSPECT') {
      updateInspection(x, y);
      return;
    }

    setFloors((prevFloors) =>
      prevFloors.map((fl) => {
        if (fl.id !== activeFloorId) return fl;

        const newGrid = fl.grid.map((row) => [...row]);
        let newRouters = [...fl.routers];
        let newOccupants = [...fl.occupants];

        if (activeTool === 'ADD_ROUTER') {
          // Remove existing router if clicked directly
          const existingIdx = newRouters.findIndex((r) => r.x === x && r.y === y);
          if (existingIdx === -1) {
            newRouters.push({
              id: `r_${Date.now()}`,
              x,
              y,
              floorId: fl.id,
              txPowerDbm: 14.0,
              label: `Node ${newRouters.length + 1}`,
            });
          }
        } else if (activeTool === 'REMOVE_ROUTER') {
          newRouters = newRouters.filter((r) => r.x !== x || r.y !== y);
        } else if (activeTool === 'ADD_WALL') {
          newGrid[y][x] = 'WALL';
          // Remove router if placed on a wall
          newRouters = newRouters.filter((r) => r.x !== x || r.y !== y);
        } else if (activeTool === 'ADD_DOOR') {
          newGrid[y][x] = 'DOOR';
        } else if (activeTool === 'ERASE') {
          newGrid[y][x] = 'EMPTY';
          newRouters = newRouters.filter((r) => r.x !== x || r.y !== y);
        } else if (activeTool === 'ADD_OCCUPANT') {
          newOccupants.push({
            id: `occ_${Date.now()}`,
            x,
            y,
            floorId: fl.id,
            targetX: x,
            targetY: y,
            path: [],
            pauseTicks: 0,
          });
        }

        return {
          ...fl,
          grid: newGrid,
          routers: newRouters,
          occupants: newOccupants,
        };
      })
    );
  };

  // Change Occupant Count slider for active floor
  const handleChangeOccupantCount = (count: number) => {
    setFloors((prevFloors) =>
      prevFloors.map((fl) => {
        if (fl.id !== activeFloorId) return fl;

        let newOccupants = [...fl.occupants];
        if (count > newOccupants.length) {
          // Add occupants
          for (let i = newOccupants.length; i < count; i++) {
            // Find random walkable cell
            let rx = Math.floor(Math.random() * fl.width);
            let ry = Math.floor(Math.random() * fl.height);
            newOccupants.push({
              id: `occ_${Date.now()}_${i}`,
              x: rx,
              y: ry,
              floorId: fl.id,
              targetX: rx,
              targetY: ry,
              path: [],
              pauseTicks: 0,
            });
          }
        } else if (count < newOccupants.length) {
          newOccupants = newOccupants.slice(0, count);
        }

        return { ...fl, occupants: newOccupants };
      })
    );
  };

  // Clear current floor
  const handleClearFloor = () => {
    setFloors((prevFloors) =>
      prevFloors.map((fl) => {
        if (fl.id !== activeFloorId) return fl;
        return {
          ...fl,
          routers: [],
        };
      })
    );
  };

  // Step-by-Step Optimizer Animation Execution
  const handleRunOptimizerStepByStep = async () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setOptimizerSteps([]);

    // Capture initial dead zone percentage
    const initialEval = evaluateCoverage(
      currentFloor,
      currentFloor.routers,
      selectedBand,
      deadZoneThresholdDbm
    );
    setInitialDeadZonePct(initialEval.deadZonePct);

    let tempRouters = [...currentFloor.routers];
    const steps: OptimizerStepResult[] = [];

    // Place up to 4 optimal routers sequentially with animation delays
    for (let step = 1; step <= 4; step++) {
      const { bestCandidate, bestScore, bestCoveragePct } = findNextBestRouter(
        currentFloor,
        tempRouters,
        selectedBand,
        deadZoneThresholdDbm
      );

      if (!bestCandidate) break;

      tempRouters = [...tempRouters, bestCandidate];
      const deadZonePct = 100 - bestCoveragePct;
      const activeRtiLinks = (tempRouters.length * (tempRouters.length - 1)) / 2;

      const stepRes: OptimizerStepResult = {
        step,
        placedRouter: bestCandidate,
        coveragePct: bestCoveragePct,
        deadZonePct,
        activeRtiLinks,
        score: bestScore,
      };

      steps.push(stepRes);
      setOptimizerSteps([...steps]);

      // Update floor state live
      setFloors((prevFloors) =>
        prevFloors.map((fl) => {
          if (fl.id !== activeFloorId) return fl;
          return { ...fl, routers: [...tempRouters] };
        })
      );

      // Delay for visible animation step
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsOptimizing(false);
  };

  // Export JSON
  const handleExportJson = () => {
    const exportData = {
      app: 'SignalTwin Digital Twin Simulator',
      version: '1.0',
      timestamp: new Date().toISOString(),
      selectedBand,
      deadZoneThresholdDbm,
      floors,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `signaltwin_layout_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.floors && Array.isArray(parsed.floors)) {
          setFloors(parsed.floors);
          if (parsed.selectedBand) setSelectedBand(parsed.selectedBand);
          if (parsed.deadZoneThresholdDbm) setDeadZoneThresholdDbm(parsed.deadZoneThresholdDbm);
        }
      } catch (err) {
        console.error('Invalid JSON layout file:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0F1113] text-[#D1D4D9] font-mono overflow-hidden select-none">
      {/* Top Telemetry Header */}
      <Header
        selectedBand={selectedBand}
        onSelectBand={setSelectedBand}
        viewToggles={viewToggles}
        onToggleView={(key) => setViewToggles((prev) => ({ ...prev, [key]: !prev[key] }))}
        isSimRunning={isSimRunning}
        onToggleSim={() => setIsSimRunning(!isSimRunning)}
        onOpenOptimizer={() => setShowOptimizerPanel(!showOptimizerPanel)}
        onOpenExplanations={() => setShowExplanationsPanel(!showExplanationsPanel)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        deadZoneThresholdDbm={deadZoneThresholdDbm}
        onChangeThreshold={setDeadZoneThresholdDbm}
      />

      {/* Main Workspace */}
      <div className="flex-1 relative flex overflow-hidden p-3 gap-3">
        {/* Left Column: Multi-Deck Stack Switcher & Telemetry Panel */}
        <div className="w-80 flex flex-col gap-3 shrink-0">
          {/* Deck Elevation Switcher */}
          <FloorSwitcher
            floors={floors}
            activeFloorId={activeFloorId}
            onSelectFloor={setActiveFloorId}
            bandFloorLossDb={selectedBand.floorSlabLossDb}
          />

          {/* Quick Deck Telemetry */}
          <div className="bg-[#16191D] border border-[#2A2E33] p-3 shadow-xl font-mono space-y-2">
            <span className="text-[10px] text-[#8A8E94] uppercase tracking-wider font-bold block mb-1 border-b border-[#2A2E33] pb-1">
              TELEMETRY: {currentFloor.elevation}
            </span>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-[#0F1113] p-2 border border-[#2A2E33]">
                <span className="text-[9px] text-[#8A8E94] block uppercase">Coverage</span>
                <span className="text-sm font-bold text-[#4CAF50]">
                  {currentFloorCoverage.coveragePct.toFixed(0)}%
                </span>
              </div>

              <div className="bg-[#0F1113] p-2 border border-[#2A2E33]">
                <span className="text-[9px] text-[#8A8E94] block uppercase">Dead Zone</span>
                <span
                  className={`text-sm font-bold ${
                    currentFloorCoverage.deadZonePct > 30 ? 'text-[#F44336]' : 'text-white'
                  }`}
                >
                  {currentFloorCoverage.deadZonePct.toFixed(0)}%
                </span>
              </div>

              <div className="bg-[#0F1113] p-2 border border-[#2A2E33]">
                <span className="text-[9px] text-[#8A8E94] block uppercase">Active Nodes</span>
                <span className="text-sm font-bold text-[#FF8A00]">
                  {currentFloor.routers.length}
                </span>
              </div>

              <div className="bg-[#0F1113] p-2 border border-[#2A2E33]">
                <span className="text-[9px] text-[#8A8E94] block uppercase">RTI Links</span>
                <span className="text-sm font-bold text-white">{rtiLinks.length}</span>
              </div>
            </div>

            {/* Combinatorial RTI Micro-note */}
            <div className="mt-2 text-[9px] text-[#8A8E94] bg-[#0F1113] p-2 border border-[#2A2E33]">
              💡 <span className="text-[#FF8A00]">RTI Scaling:</span> {currentFloor.routers.length}{' '}
              nodes create {rtiLinks.length} sensing links [<span className="text-white">N(N-1)/2</span>].
            </div>
          </div>
        </div>

        {/* Center Main Stage: Interactive HTML5 Canvas Simulator */}
        <div className="flex-1 relative h-full flex flex-col">
          <SimulatorCanvas
            currentFloor={currentFloor}
            allFloors={floors}
            selectedBand={selectedBand}
            viewToggles={viewToggles}
            activeTool={activeTool}
            rtiLinks={rtiLinks}
            hoverCell={hoverCell}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
            onCellHover={(x, y) => setHoverCell(y === null ? null : { x, y })}
          />

          {/* Floating Live Inspector Modal Drawer */}
          {inspectionData && (
            <InspectorModal
              inspectionData={inspectionData}
              selectedBand={selectedBand}
              onClose={() => setInspectionData(null)}
            />
          )}

          {/* Problem -> Solution Optimization Visual Drawer */}
          {showOptimizerPanel && (
            <ProblemSolutionVisual
              currentFloor={currentFloor}
              selectedBand={selectedBand}
              optimizerSteps={optimizerSteps}
              isOptimizing={isOptimizing}
              deadZoneThresholdDbm={deadZoneThresholdDbm}
              initialDeadZonePct={initialDeadZonePct}
              currentDeadZonePct={100 - currentFloorCoverage.coveragePct}
              onRunOptimizerStepByStep={handleRunOptimizerStepByStep}
              onResetRouters={handleClearFloor}
              onClose={() => setShowOptimizerPanel(false)}
            />
          )}

          {/* Collapsible Explanations Panel */}
          {showExplanationsPanel && (
            <ExplanationsPanel onClose={() => setShowExplanationsPanel(false)} />
          )}
        </div>
      </div>

      {/* Bottom Tool Palette */}
      <div className="px-3 pb-3">
        <ControlPanel
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          occupantCount={currentFloor.occupants.length}
          onChangeOccupantCount={handleChangeOccupantCount}
          simSpeed={simSpeed}
          onChangeSimSpeed={setSimSpeed}
          onClearFloor={handleClearFloor}
        />
      </div>
    </div>
  );
}
