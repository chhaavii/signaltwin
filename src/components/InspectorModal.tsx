/**
 * SignalTwin - Live Mathematical Inspector Drawer
 * Clicking any grid cell displays Friis FSPL breakdown, wall attenuation, floor slab leakage, and RTI weights
 */

import React from 'react';
import { InspectionData, RadioBand } from '../types';
import { X, Radio, ShieldAlert, Cpu, Calculator } from 'lucide-react';

interface InspectorModalProps {
  inspectionData: InspectionData | null;
  selectedBand: RadioBand;
  onClose: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  inspectionData,
  selectedBand,
  onClose,
}) => {
  if (!inspectionData) return null;

  return (
    <div className="absolute right-4 top-16 bottom-16 w-80 bg-[#16191D] border border-[#2A2E33] p-4 shadow-2xl z-30 text-[#D1D4D9] overflow-y-auto font-mono flex flex-col justify-between select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2A2E33]">
          <div className="flex items-center space-x-2 text-white">
            <Calculator className="w-4 h-4 text-[#FF8A00]" />
            <span className="font-bold text-xs tracking-wide uppercase">INSPECT: POINT MATH</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0F1113] text-[#8A8E94] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cell Coordinates & Context */}
        <div className="bg-[#0F1113] p-3 border border-[#2A2E33] mb-3 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#8A8E94] uppercase">COORD:</span>
            <span className="text-xs text-white font-bold">
              [{inspectionData.cellX}, {inspectionData.cellY}]
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#8A8E94] uppercase">LOCATION:</span>
            <span className="text-xs text-white">
              {inspectionData.roomName || 'Corridor'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#8A8E94] uppercase">RSS_MAX:</span>
            <span
              className={`font-bold text-xs ${
                inspectionData.isDeadZone ? 'text-[#F44336]' : 'text-[#4CAF50]'
              }`}
            >
              {inspectionData.maxRssiDbm > -900
                ? `${inspectionData.maxRssiDbm.toFixed(1)} dBm`
                : '0.0 dBm'}
            </span>
          </div>
          {inspectionData.isDeadZone && (
            <div className="flex items-center space-x-1.5 text-[10px] text-[#F44336] bg-[#F44336]/10 p-1.5 border border-[#F44336]/40 mt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#F44336] shrink-0" />
              <span>DEAD ZONE (&lt; {selectedBand.name} cutoff)</span>
            </div>
          )}
        </div>

        {/* Per-Router RSSI Path Breakdown */}
        <div className="space-y-2 mb-4">
          <span className="text-[10px] font-bold text-[#8A8E94] uppercase tracking-wider block border-b border-[#2A2E33] pb-1">
            Path Loss Breakdown ({selectedBand.frequencyMHz}MHz):
          </span>

          {inspectionData.routerSignals.length === 0 ? (
            <p className="text-[10px] text-[#8A8E94] italic">No active routers placed.</p>
          ) : (
            inspectionData.routerSignals.map((sig) => (
              <div
                key={sig.routerId}
                className="bg-[#0F1113] p-2 border border-[#2A2E33] text-xs space-y-1"
              >
                <div className="flex justify-between font-bold text-white">
                  <span>{sig.routerLabel}</span>
                  <span
                    className={
                      sig.finalRssiDbm >= -80 ? 'text-[#4CAF50]' : 'text-[#FF8A00]'
                    }
                  >
                    {sig.finalRssiDbm.toFixed(1)} dBm
                  </span>
                </div>

                <div className="text-[10px] text-[#8A8E94] space-y-0.5 pt-1 border-t border-[#2A2E33]">
                  <div className="flex justify-between">
                    <span>3D Distance:</span>
                    <span className="text-white">{sig.distanceMeters.toFixed(1)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Friis FSPL:</span>
                    <span className="text-white">-{sig.fsplDb.toFixed(1)} dB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Walls ({sig.wallsCrossed}):</span>
                    <span className="text-[#FF8A00]">-{sig.wallLossDb.toFixed(1)} dB</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tomographic RTI Sensitivity Breakdown */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#8A8E94] uppercase tracking-wider block border-b border-[#2A2E33] pb-1">
            RTI Tomography Density:
          </span>

          <div className="bg-[#0F1113] p-2.5 border border-[#2A2E33] text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#8A8E94] uppercase">RTI Density:</span>
              <span className="text-[#FF8A00] font-bold">
                {inspectionData.rtiEstimatedDensity.toFixed(2)}
              </span>
            </div>

            <div className="w-full h-1.5 bg-[#16191D] overflow-hidden border border-[#2A2E33]">
              <div
                className="h-full bg-[#FF8A00]"
                style={{ width: `${Math.min(100, inspectionData.rtiEstimatedDensity * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer physics note */}
      <div className="mt-3 pt-2 border-t border-[#2A2E33] text-[9px] text-[#8A8E94] leading-tight">
        Friis Path Loss: 32.44 + 20log10(d) + 20log10(f).
      </div>
    </div>
  );
};
