/**
 * SignalTwin - Interactive Tool Control Palette
 * Select active tool: Inspect, Add/Remove Router, Add Wall/Door, Add Occupant
 */

import React from 'react';
import {
  MousePointer,
  Radio,
  Trash2,
  Square,
  DoorClosed,
  UserPlus,
  Users,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { ActiveTool } from '../types';

interface ControlPanelProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  occupantCount: number;
  onChangeOccupantCount: (count: number) => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  onClearFloor: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  activeTool,
  onSelectTool,
  occupantCount,
  onChangeOccupantCount,
  simSpeed,
  onChangeSimSpeed,
  onClearFloor,
}) => {
  const tools: { id: ActiveTool; label: string; icon: React.ReactNode }[] = [
    {
      id: 'INSPECT',
      label: 'Inspect Point',
      icon: <MousePointer className="w-3.5 h-3.5" />,
    },
    {
      id: 'ADD_ROUTER',
      label: 'Place Router',
      icon: <Radio className="w-3.5 h-3.5" />,
    },
    {
      id: 'REMOVE_ROUTER',
      label: 'Delete Router',
      icon: <Trash2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'ADD_WALL',
      label: 'Place Wall',
      icon: <Square className="w-3.5 h-3.5" />,
    },
    {
      id: 'ADD_DOOR',
      label: 'Place Door',
      icon: <DoorClosed className="w-3.5 h-3.5" />,
    },
    {
      id: 'ADD_OCCUPANT',
      label: 'Add Person',
      icon: <UserPlus className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="bg-[#16191D] border border-[#2A2E33] p-3 shadow-xl select-none font-mono flex flex-wrap items-center justify-between gap-3 text-[#D1D4D9]">
      {/* Tool Buttons */}
      <div className="flex items-center space-x-1 flex-wrap gap-y-1">
        <span className="text-[10px] text-[#8A8E94] uppercase tracking-wider mr-2 font-bold">TOOLS:</span>
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              className={`px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                isActive
                  ? 'bg-[#FF8A00] text-black border-[#FF8A00]'
                  : 'bg-[#0F1113] text-[#8A8E94] border-[#2A2E33] hover:text-white hover:border-[#8A8E94]'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Crowd & Motion Speed Controls */}
      <div className="flex items-center space-x-3">
        {/* Occupant Count Slider */}
        <div className="flex items-center space-x-2 bg-[#0F1113] px-2.5 py-1 border border-[#2A2E33] text-xs">
          <Users className="w-3.5 h-3.5 text-[#FF8A00]" />
          <span className="text-[#8A8E94]">Crowd:</span>
          <input
            type="range"
            min={0}
            max={15}
            value={occupantCount}
            onChange={(e) => onChangeOccupantCount(Number(e.target.value))}
            className="w-16 accent-[#FF8A00] cursor-pointer"
          />
          <span className="text-white font-bold w-4 text-right">{occupantCount}</span>
        </div>

        {/* Motion Speed Slider */}
        <div className="flex items-center space-x-2 bg-[#0F1113] px-2.5 py-1 border border-[#2A2E33] text-xs">
          <Sliders className="w-3.5 h-3.5 text-[#FF8A00]" />
          <span className="text-[#8A8E94]">Speed:</span>
          <input
            type="range"
            min={1}
            max={5}
            value={simSpeed}
            onChange={(e) => onChangeSimSpeed(Number(e.target.value))}
            className="w-16 accent-[#FF8A00] cursor-pointer"
          />
          <span className="text-white font-bold w-6 text-right">{simSpeed}x</span>
        </div>

        {/* Clear Floor */}
        <button
          onClick={onClearFloor}
          className="px-2.5 py-1 bg-[#0F1113] hover:bg-[#16191D] text-[#8A8E94] hover:text-[#F44336] border border-[#2A2E33] hover:border-[#F44336] text-xs font-bold transition-colors"
          title="Clear all routers on deck"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
