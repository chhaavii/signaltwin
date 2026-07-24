/**
 * SignalTwin - Problem -> Solution Visual (Dead Zones Fixed Live)
 * Real-time step-by-step router placement animation with live dead-zone shrinkage telemetry
 */

import React from 'react';
import {
  BarChart3,
  Play,
  RotateCcw,
  CheckCircle2,
  X,
  Zap,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { FloorData, OptimizerStepResult, RadioBand } from '../types';

interface ProblemSolutionVisualProps {
  currentFloor: FloorData;
  selectedBand: RadioBand;
  optimizerSteps: OptimizerStepResult[];
  isOptimizing: boolean;
  deadZoneThresholdDbm: number;
  initialDeadZonePct: number;
  currentDeadZonePct: number;
  onRunOptimizerStepByStep: () => void;
  onResetRouters: () => void;
  onClose: () => void;
}

export const ProblemSolutionVisual: React.FC<ProblemSolutionVisualProps> = ({
  currentFloor,
  selectedBand,
  optimizerSteps,
  isOptimizing,
  deadZoneThresholdDbm,
  initialDeadZonePct,
  currentDeadZonePct,
  onRunOptimizerStepByStep,
  onResetRouters,
  onClose,
}) => {
  const routerCount = currentFloor.routers.length;
  const activeRtiLinks = (routerCount * (routerCount - 1)) / 2;

  return (
    <div className="absolute left-4 bottom-16 w-96 bg-[#16191D] border border-[#2A2E33] p-4 shadow-2xl z-30 text-[#D1D4D9] font-mono flex flex-col justify-between select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2A2E33]">
          <div className="flex items-center space-x-2 text-white">
            <BarChart3 className="w-4 h-4 text-[#FF8A00]" />
            <span className="font-bold text-xs tracking-wide uppercase">
              LAYOUT OPTIMIZER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0F1113] text-[#8A8E94] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Problem -> Solution Delta Banner */}
        <div className="bg-[#0F1113] p-3 border border-[#2A2E33] mb-3 space-y-2">
          <div className="text-[10px] text-[#8A8E94] uppercase tracking-wider flex items-center justify-between">
            <span>Dead Zone Delta ({currentFloor.elevation})</span>
            <span className="text-[10px] text-[#FF8A00] bg-[#16191D] px-1.5 py-0.5 border border-[#2A2E33]">
              Cutoff: {deadZoneThresholdDbm} dBm
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#8A8E94]">BASELINE</span>
              <span className="text-base font-bold text-[#F44336]">
                {initialDeadZonePct.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center space-x-1 text-[#FF8A00]">
              <TrendingDown className="w-4 h-4 animate-bounce" />
              <span className="text-[10px] font-bold">OPTIMIZING</span>
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[9px] text-[#8A8E94]">CURRENT</span>
              <span className="text-base font-bold text-[#4CAF50]">
                {currentDeadZonePct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#16191D] overflow-hidden border border-[#2A2E33]">
            <div
              className="h-full bg-[#FF8A00] transition-all duration-300"
              style={{ width: `${100 - currentDeadZonePct}%` }}
            />
          </div>
        </div>

        {/* Telemetry Multi-Objective Callouts */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-[#0F1113] p-2 border border-[#2A2E33]">
            <span className="text-[9px] text-[#8A8E94] block uppercase">Nodes</span>
            <span className="text-xs font-bold text-white">{routerCount}</span>
          </div>
          <div className="bg-[#0F1113] p-2 border border-[#2A2E33]">
            <span className="text-[9px] text-[#8A8E94] block uppercase">Links</span>
            <span className="text-xs font-bold text-[#FF8A00]">{activeRtiLinks}</span>
          </div>
          <div className="bg-[#0F1113] p-2 border border-[#2A2E33]">
            <span className="text-[9px] text-[#8A8E94] block uppercase">Coverage</span>
            <span className="text-xs font-bold text-[#4CAF50]">
              {(100 - currentDeadZonePct).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Step-by-step History */}
        <div className="max-h-36 overflow-y-auto space-y-1 mb-3 pr-1">
          <span className="text-[10px] font-bold text-[#8A8E94] uppercase tracking-wider block mb-1">
            Placement Log ({selectedBand.name}):
          </span>

          {optimizerSteps.length === 0 ? (
            <p className="text-[10px] text-[#8A8E94] italic">Click "OPTIMIZE LAYOUT" to calculate best positions.</p>
          ) : (
            optimizerSteps.map((s) => (
              <div
                key={s.step}
                className="bg-[#0F1113] p-1.5 border border-[#2A2E33] text-[10px] flex items-center justify-between"
              >
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF50] shrink-0" />
                  <span className="text-white">
                    Step {s.step}: [{s.placedRouter.x}, {s.placedRouter.y}]
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[#F44336]">Dead: {s.deadZonePct.toFixed(0)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="pt-2 border-t border-[#2A2E33] flex items-center space-x-2">
        <button
          onClick={onRunOptimizerStepByStep}
          disabled={isOptimizing}
          className="flex-1 py-1.5 bg-[#FF8A00] hover:bg-[#FF9F33] disabled:opacity-50 text-black font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
        >
          {isOptimizing ? (
            <Activity className="w-3.5 h-3.5 animate-spin text-black" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>{isOptimizing ? 'PLACING NODES...' : 'OPTIMIZE LAYOUT'}</span>
        </button>

        <button
          onClick={onResetRouters}
          className="px-3 py-1.5 bg-[#0F1113] hover:bg-[#16191D] text-[#8A8E94] border border-[#2A2E33] text-xs flex items-center space-x-1"
          title="Clear all routers on deck"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
