/**
 * SignalTwin - Collapsible "How This Works" Physics & Sensing Guide
 * Explains Friis FSPL, Radio Tomography, 3-way Optimizer tradeoff, and Floor Slab attenuation
 */

import React from 'react';
import { HelpCircle, X, Radio, Cpu, Layers, BarChart3, Info } from 'lucide-react';

interface ExplanationsPanelProps {
  onClose: () => void;
}

export const ExplanationsPanel: React.FC<ExplanationsPanelProps> = ({ onClose }) => {
  return (
    <div className="absolute right-4 top-16 bottom-16 w-96 bg-[#16191D] border border-[#2A2E33] p-4 shadow-2xl z-30 text-[#D1D4D9] overflow-y-auto font-mono flex flex-col justify-between select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2A2E33]">
          <div className="flex items-center space-x-2 text-white">
            <HelpCircle className="w-4 h-4 text-[#FF8A00]" />
            <span className="font-bold text-xs tracking-wide uppercase">
              PHYSICS & THEORY GUIDE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0F1113] text-[#8A8E94] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Friis RF Path Loss */}
        <div className="mb-3 bg-[#0F1113] p-2.5 border border-[#2A2E33] space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#FF8A00]">
            <Radio className="w-3.5 h-3.5" />
            <span>1. FRIIS PATH LOSS & WALL ATTENUATION</span>
          </div>
          <p className="text-[10px] text-[#8A8E94] leading-relaxed">
            Free-Space Path Loss (FSPL) models wave attenuation over distance:
          </p>
          <div className="bg-[#16191D] p-1.5 border border-[#2A2E33] text-[10px] text-[#4CAF50] font-bold">
            FSPL(dB) = 32.44 + 20log10(d_km) + 20log10(f_MHz)
          </div>
          <p className="text-[10px] text-[#8A8E94] leading-relaxed">
            Signal RSSI at target is computed as:{' '}
            <span className="text-white">
              RSSI = TX_power - FSPL - (walls × loss_dB) - NLOS_penalty - slab_loss
            </span>
            . Sub-GHz LoRa experiences minimal wall loss (~3 dB), whereas 5GHz WiFi suffers 12 dB/wall.
          </p>
        </div>

        {/* Section 2: Radio Tomographic Imaging (RTI) */}
        <div className="mb-3 bg-[#0F1113] p-2.5 border border-[#2A2E33] space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#FF8A00]">
            <Cpu className="w-3.5 h-3.5" />
            <span>2. RADIO TOMOGRAPHIC IMAGING (RTI)</span>
          </div>
          <p className="text-[10px] text-[#8A8E94] leading-relaxed">
            RTI is <span className="text-[#FF8A00] font-bold">device-free crowd sensing</span>. It measures RSSI shadowing across mesh links:
          </p>
          <ul className="text-[10px] text-[#8A8E94] space-y-1 list-disc pl-4">
            <li>
              Human bodies absorb microwave RF (~3.5 dB attenuation per person).
            </li>
            <li>
              Elliptical weighting: <span className="text-white">w = exp(-(dA + dB - |AB|) / λ)</span>.
            </li>
            <li>
              Combinatorial link scaling: N routers form <span className="text-[#FF8A00] font-bold">N(N-1)/2</span> links.
            </li>
          </ul>
        </div>

        {/* Section 3: Multi-Objective Placement Optimizer */}
        <div className="mb-3 bg-[#0F1113] p-2.5 border border-[#2A2E33] space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#FF8A00]">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>3. THREE-WAY GREEDY PLACEMENT OPTIMIZER</span>
          </div>
          <p className="text-[10px] text-[#8A8E94] leading-relaxed">
            The router placement solver evaluates candidates against a 3-part objective score:
          </p>
          <div className="bg-[#16191D] p-1.5 border border-[#2A2E33] text-[10px] text-white space-y-0.5">
            <div>• <span className="font-bold text-[#4CAF50]">60% Coverage:</span> Area with RSSI ≥ threshold.</div>
            <div>• <span className="font-bold text-[#FF8A00]">20% Link Length:</span> Distance between nodes.</div>
            <div>• <span className="font-bold text-white">20% Angular Diversity:</span> Angular orthogonality across links.</div>
          </div>
        </div>

        {/* Section 4: Multi-Floor Concrete Slab Attenuation */}
        <div className="mb-3 bg-[#0F1113] p-2.5 border border-[#2A2E33] space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#FF8A00]">
            <Layers className="w-3.5 h-3.5" />
            <span>4. FLOOR SLAB VS WALL ATTENUATION</span>
          </div>
          <p className="text-[10px] text-[#8A8E94] leading-relaxed">
            Concrete slabs attenuate RF vastly more than drywall partitions. WiFi 2.4GHz loses ~8 dB per wall, but <span className="text-white font-bold">20 dB per floor slab</span>.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-[#2A2E33] text-[9px] text-[#8A8E94] flex items-center space-x-1">
        <Info className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
        <span>SignalTwin Telemetry Engine • Physical Twin</span>
      </div>
    </div>
  );
};
