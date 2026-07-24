/**
 * SignalTwin - Header Telemetry Bar
 * Radio Band selection with micro-notes, view mode toggles, run optimizer action
 */

import React from 'react';
import {
  Activity,
  Layers,
  Zap,
  Eye,
  Download,
  Upload,
  Play,
  Pause,
  HelpCircle,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';
import { RadioBand, ViewToggles } from '../types';
import { RADIO_BANDS } from '../utils/rfModel';

interface HeaderProps {
  selectedBand: RadioBand;
  onSelectBand: (band: RadioBand) => void;
  viewToggles: ViewToggles;
  onToggleView: (key: keyof ViewToggles) => void;
  isSimRunning: boolean;
  onToggleSim: () => void;
  onOpenOptimizer: () => void;
  onOpenExplanations: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deadZoneThresholdDbm: number;
  onChangeThreshold: (val: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedBand,
  onSelectBand,
  viewToggles,
  onToggleView,
  isSimRunning,
  onToggleSim,
  onOpenOptimizer,
  onOpenExplanations,
  onExportJson,
  onImportJson,
  deadZoneThresholdDbm,
  onChangeThreshold,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="bg-[#16191D] border-b border-[#2A2E33] px-4 py-2 text-[#D1D4D9] font-mono select-none shadow-xl">
      <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-[#FF8A00] animate-pulse rounded-full shadow-[0_0_8px_#FF8A00]" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black tracking-tighter text-base text-white">
                SIGNAL<span className="text-[#FF8A00]">TWIN</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-[#2A2E33] text-[#8A8E94] font-mono bg-[#0F1113]">
                HACKATHON_SIM_ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-[#8A8E94] font-mono">
              RF & Tomographic Crowd Sensing Digital Twin
            </p>
          </div>
        </div>

        {/* Radio Band Selector & Inline Physics Micro-Note */}
        <div className="flex flex-col space-y-1 bg-[#0F1113] p-2 border border-[#2A2E33]">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-[#8A8E94] font-mono uppercase tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#FF8A00]" /> RADIO PROTOCOL:
            </span>
            <div className="flex items-center space-x-1">
              {(Object.keys(RADIO_BANDS) as Array<keyof typeof RADIO_BANDS>).map((key) => {
                const band = RADIO_BANDS[key];
                const isSelected = selectedBand.id === band.id;
                return (
                  <button
                    key={band.id}
                    onClick={() => onSelectBand(band)}
                    className={`px-2.5 py-0.5 text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-[#FF8A00] text-black font-bold border border-[#FF8A00]'
                        : 'bg-[#16191D] text-[#8A8E94] hover:text-white border border-[#2A2E33]'
                    }`}
                  >
                    {band.name}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Micro-note near band selector */}
          <div className="text-[9px] font-mono text-[#8A8E94] italic px-1">
            5GHz suffers higher wall attenuation (12dB/wall) than Sub-GHz (3dB/wall).
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-1 bg-[#0F1113] p-1 border border-[#2A2E33]">
          <button
            onClick={() => onToggleView('showCoverageHeatmap')}
            className={`px-2 py-1 text-xs font-mono flex items-center space-x-1.5 transition-colors ${
              viewToggles.showCoverageHeatmap
                ? 'bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/50'
                : 'text-[#8A8E94] hover:text-white'
            }`}
            title="Toggle RF RSSI Coverage Heatmap"
          >
            <div className="w-2 h-2 bg-[#4CAF50]" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() => onToggleView('showDeadZonesOnly')}
            className={`px-2 py-1 text-xs font-mono flex items-center space-x-1.5 transition-colors ${
              viewToggles.showDeadZonesOnly
                ? 'bg-[#F44336]/20 text-[#F44336] border border-[#F44336]/50'
                : 'text-[#8A8E94] hover:text-white'
            }`}
            title="Highlight Dead Zones below RSSI threshold"
          >
            <div className="w-2 h-2 bg-[#F44336] animate-pulse" />
            <span>Dead Zones</span>
          </button>

          <button
            onClick={() => onToggleView('showRTIDensity')}
            className={`px-2 py-1 text-xs font-mono flex items-center space-x-1.5 transition-colors ${
              viewToggles.showRTIDensity
                ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/50'
                : 'text-[#8A8E94] hover:text-white'
            }`}
            title="Toggle Tomographic Crowd Sensing Density"
          >
            <div className="w-2 h-2 bg-[#FF8A00]" />
            <span>RTI Crowd</span>
          </button>

          <button
            onClick={() => onToggleView('showMeshLinks')}
            className={`px-2 py-1 text-xs font-mono flex items-center space-x-1.5 transition-colors ${
              viewToggles.showMeshLinks
                ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/50'
                : 'text-[#8A8E94] hover:text-white'
            }`}
            title="Toggle Router-to-Router Link Mesh Lines"
          >
            <div className="w-2 h-2 bg-[#FF8A00]" />
            <span>Mesh Links</span>
          </button>

          <button
            onClick={() => onToggleView('showTrueOccupants')}
            className={`px-2 py-1 text-xs font-mono flex items-center space-x-1.5 transition-colors ${
              viewToggles.showTrueOccupants
                ? 'bg-white/20 text-white border border-white/50'
                : 'text-[#8A8E94] hover:text-white'
            }`}
            title="Toggle Ground-Truth Occupants Overlay"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Occupants</span>
          </button>
        </div>

        {/* Deadzone Cutoff Control */}
        <div className="flex items-center space-x-2 bg-[#0F1113] px-2.5 py-1 border border-[#2A2E33] text-xs font-mono">
          <span className="text-[#8A8E94]">Cutoff:</span>
          <select
            value={deadZoneThresholdDbm}
            onChange={(e) => onChangeThreshold(Number(e.target.value))}
            className="bg-[#16191D] text-white border border-[#2A2E33] px-1.5 py-0.5 focus:outline-none"
          >
            <option value={-75}>-75 dBm (Strict)</option>
            <option value={-80}>-80 dBm (Standard)</option>
            <option value={-85}>-85 dBm (Relaxed)</option>
            <option value={-90}>-90 dBm (Extreme)</option>
          </select>
        </div>

        {/* Actions & Simulation Control */}
        <div className="flex items-center space-x-2">
          {/* Run Optimizer */}
          <button
            onClick={onOpenOptimizer}
            className="px-3 py-1.5 bg-[#FF8A00] text-black font-mono font-bold text-xs hover:bg-[#FF9F33] active:scale-95 transition-transform flex items-center space-x-1.5"
          >
            <BarChart3 className="w-4 h-4" />
            <span>OPTIMIZE LAYOUT</span>
          </button>

          {/* Simulation Play/Pause */}
          <button
            onClick={onToggleSim}
            className={`px-3 py-1.5 font-mono text-xs border flex items-center space-x-1.5 font-semibold transition-colors ${
              isSimRunning
                ? 'bg-[#FF8A00]/20 text-[#FF8A00] border-[#FF8A00]/60 hover:bg-[#FF8A00]/30'
                : 'bg-[#4CAF50]/20 text-[#4CAF50] border-[#4CAF50]/60 hover:bg-[#4CAF50]/30'
            }`}
          >
            {isSimRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimRunning ? 'PAUSE SIM' : 'LIVE SIM'}</span>
          </button>

          {/* How This Works */}
          <button
            onClick={onOpenExplanations}
            className="p-1.5 bg-[#0F1113] hover:bg-[#16191D] text-[#8A8E94] border border-[#2A2E33] font-mono text-xs flex items-center space-x-1"
            title="How This Works / Physics Guide"
          >
            <HelpCircle className="w-4 h-4 text-[#FF8A00]" />
          </button>

          {/* JSON Export/Import */}
          <div className="flex items-center space-x-1 border-l border-[#2A2E33] pl-2">
            <button
              onClick={onExportJson}
              className="p-1.5 bg-[#0F1113] hover:bg-[#16191D] text-[#8A8E94] border border-[#2A2E33] text-xs"
              title="Export Layout + Stats to JSON"
            >
              <Download className="w-4 h-4 text-[#4CAF50]" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-[#0F1113] hover:bg-[#16191D] text-[#8A8E94] border border-[#2A2E33] text-xs"
              title="Import JSON Digital Twin State"
            >
              <Upload className="w-4 h-4 text-[#FF8A00]" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportJson}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
