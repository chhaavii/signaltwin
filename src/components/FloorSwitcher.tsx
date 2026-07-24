/**
 * SignalTwin - Isometric Multi-Deck Stack Indicator (Floor Switcher)
 * Concept: An isometric multi-deck stack indicator with elevation levels (B1, L1, L2)
 * that highlights vertical RF slab leakage vectors and active floor elevation seamlessly.
 */

import React from 'react';
import { FloorData } from '../types';
import { Layers, Signal } from 'lucide-react';

interface FloorSwitcherProps {
  floors: FloorData[];
  activeFloorId: number;
  onSelectFloor: (floorId: number) => void;
  bandFloorLossDb: number;
}

export const FloorSwitcher: React.FC<FloorSwitcherProps> = ({
  floors,
  activeFloorId,
  onSelectFloor,
  bandFloorLossDb,
}) => {
  return (
    <div className="bg-[#16191D] border border-[#2A2E33] p-3 shadow-xl select-none font-mono">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#2A2E33]">
        <span className="text-[10px] text-[#8A8E94] uppercase tracking-wider flex items-center gap-1.5 font-bold">
          <Layers className="w-3.5 h-3.5 text-[#FF8A00]" /> FLOOR_STACK
        </span>
        <span className="text-[10px] text-[#FF8A00] bg-[#0F1113] px-1.5 py-0.5 border border-[#2A2E33]">
          SLAB: -{bandFloorLossDb} dB
        </span>
      </div>

      {/* Stack Container */}
      <div className="flex flex-col space-y-2">
        {floors
          .slice()
          .reverse()
          .map((floor) => {
            const isActive = floor.id === activeFloorId;
            const routerCount = floor.routers.length;
            const occupantCount = floor.occupants.length;

            return (
              <div
                key={floor.id}
                onClick={() => onSelectFloor(floor.id)}
                className={`group relative cursor-pointer p-2.5 transition-all duration-150 border overflow-hidden ${
                  isActive
                    ? 'bg-[#0F1113] border-[#FF8A00] text-white'
                    : 'bg-[#16191D] hover:bg-[#0F1113] border-[#2A2E33] opacity-70 hover:opacity-100 text-[#8A8E94]'
                }`}
              >
                {/* Visual Elevation Edge Indicator */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                    isActive ? 'bg-[#FF8A00]' : 'bg-[#2A2E33]'
                  }`}
                />

                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center space-x-3">
                    {/* Isometric Deck Tag */}
                    <div
                      className={`w-9 h-8 border flex flex-col items-center justify-center font-bold text-xs ${
                        isActive
                          ? 'bg-[#FF8A00]/10 text-[#FF8A00] border-[#FF8A00]'
                          : 'bg-[#0F1113] text-[#8A8E94] border-[#2A2E33]'
                      }`}
                    >
                      <span className="text-[7px] text-[#8A8E94] font-normal">DECK</span>
                      <span>{floor.elevation}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-bold ${
                            isActive ? 'text-white' : 'text-[#8A8E94]'
                          }`}
                        >
                          {floor.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8A8E94] line-clamp-1 max-w-[180px]">
                        {floor.description}
                      </p>
                    </div>
                  </div>

                  {/* Floor Telemetry Pills */}
                  <div className="flex items-center space-x-1 text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 border ${
                        routerCount > 0
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/40'
                          : 'bg-[#0F1113] text-[#8A8E94] border-[#2A2E33]'
                      }`}
                    >
                      📡 {routerCount}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#0F1113] text-white border border-[#2A2E33]">
                      👥 {occupantCount}
                    </span>
                  </div>
                </div>

                {/* Subsurface Inter-Floor Leakage Vector Indicator when inactive */}
                {!isActive && (
                  <div className="mt-1.5 pl-2 text-[9px] text-[#8A8E94] flex items-center space-x-1 font-mono">
                    <Signal className="w-3 h-3 text-[#FF8A00]/60" />
                    <span>
                      Slab Attenuation: -{Math.abs(floor.id - activeFloorId) * bandFloorLossDb} dB
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#2A2E33] text-[9px] text-[#8A8E94] leading-tight">
        ℹ️ <span className="text-white">Inter-Floor Leakage:</span> Signals bleed through slabs into adjacent levels.
      </div>
    </div>
  );
};
