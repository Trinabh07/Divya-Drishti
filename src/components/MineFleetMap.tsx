import React from 'react';
import { Truck, Radio, MapPin, Eye, AlertOctagon, Navigation } from 'lucide-react';
import type { MineTruck } from '../types/fleet';
import { LogoSVG } from './Navbar';

interface MineFleetMapProps {
  fleet: MineTruck[];
  selectedTruckId: string;
  onSelectTruck: (truck: MineTruck) => void;
  onOpenDashboard: (truck: MineTruck) => void;
  watchdogOk: boolean;
}

export const MineFleetMap: React.FC<MineFleetMapProps> = ({
  fleet,
  selectedTruckId,
  onSelectTruck,
  onOpenDashboard,
  watchdogOk,
}) => {
  return (
    <div className="relative w-full h-full bg-[#0a0705] flex flex-col overflow-hidden text-white font-classic">
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#140c08] border-b border-[#3d2414] z-10">
        <div className="flex items-center gap-4">
          <LogoSVG size={30} className="text-white" />
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#b9812f] animate-pulse" />
            <div>
              <h2 className="text-base font-bold tracking-wide text-white uppercase">
                Mine Fleet GPS Command Center
              </h2>
              <p className="text-xs text-white/60">
                Opencast Iron Ore Pit &middot; 21.7892&deg; N, 85.3421&deg; E &middot; Active Vehicles: {fleet.length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!watchdogOk ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950 border border-amber-600 text-amber-200 rounded text-xs font-bold animate-pulse">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>System Degraded — Watchdog Fail</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#24150c] border border-[#b9812f]/40 text-[#b9812f] rounded text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-[#b9812f] animate-pulse" />
              <span>500ms Watchdog: Online</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 relative bg-[#0e0906] border-r border-[#3d2414] overflow-hidden flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-5xl max-h-[720px] border border-[#3d2414] rounded overflow-hidden shadow-2xl bg-[#141009]">

            {/* Satellite-style terrain base: pit rings, roads, GPS grid */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <radialGradient id="pitGrad" cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="#2a1a0d" />
                  <stop offset="55%" stopColor="#1c1108" />
                  <stop offset="100%" stopColor="#100a05" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="100" height="100" fill="url(#pitGrad)" />

              {/* lat/long GPS grid */}
              {Array.from({ length: 11 }, (_, i) => i * 10).map((v) => (
                <React.Fragment key={`grid-${v}`}>
                  <line x1={v} y1="0" x2={v} y2="100" stroke="#3d2414" strokeWidth="0.15" opacity="0.5" />
                  <line x1="0" y1={v} x2="100" y2={v} stroke="#3d2414" strokeWidth="0.15" opacity="0.5" />
                </React.Fragment>
              ))}

              {/* concentric pit benches */}
              <ellipse cx="50" cy="50" rx="46" ry="42" fill="none" stroke="#4a2c18" strokeWidth="0.5" strokeDasharray="1.4 1" opacity="0.55" />
              <ellipse cx="50" cy="50" rx="36" ry="32" fill="none" stroke="#5c3a20" strokeWidth="0.4" opacity="0.55" />
              <ellipse cx="50" cy="50" rx="24" ry="20" fill="none" stroke="#6e4728" strokeWidth="0.35" strokeDasharray="1 0.8" opacity="0.55" />
              <ellipse cx="50" cy="50" rx="12" ry="10" fill="none" stroke="#7d5230" strokeWidth="0.3" opacity="0.5" />

              {/* haul roads */}
              <path d="M 8 20 Q 42 52 92 84" fill="none" stroke="#8a5a2b" strokeWidth="1.1" opacity="0.6" strokeDasharray="2.2 1.6" />
              <path d="M 90 12 Q 52 52 14 90" fill="none" stroke="#8a5a2b" strokeWidth="1.1" opacity="0.6" strokeDasharray="2.2 1.6" />
              <path d="M 5 62 Q 40 40 95 48" fill="none" stroke="#6e4728" strokeWidth="0.7" opacity="0.45" strokeDasharray="1.5 1.2" />
            </svg>

            {/* Compass rose */}
            <div className="absolute top-4 right-4 flex flex-col items-center text-[#b9812f]/80">
              <Navigation className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-0.5">N</span>
            </div>

            {/* Scale bar */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[9px] text-white/60 font-semibold bg-[#140c08]/80 px-2 py-1 border border-[#3d2414] rounded">
              <div className="w-10 h-[2px] bg-[#b9812f]" />
              <span>100 m</span>
            </div>

            <div className="absolute top-4 left-4 text-xs font-semibold text-[#b9812f] uppercase tracking-widest bg-[#140c08] px-2.5 py-1 border border-[#3d2414] rounded">
              Sector A — North Excavation Pit
            </div>
            <div className="absolute bottom-4 right-4 text-xs font-semibold text-[#b9812f] uppercase tracking-widest bg-[#140c08] px-2.5 py-1 border border-[#3d2414] rounded">
              Sector B — Dumping &amp; Crusher Zone
            </div>

            {fleet.map((truck, idx) => {
              const isSelected = truck.id === selectedTruckId;
              const isHazard = truck.sensors.ultrasonicDistanceMeters < 15 || truck.sensors.groundVibrationSwitch;

              const positions = [
                { x: 48, y: 52 }, { x: 55, y: 46 }, { x: 28, y: 32 }, { x: 50, y: 60 },
                { x: 68, y: 38 }, { x: 22, y: 70 }, { x: 74, y: 62 }, { x: 38, y: 80 },
                { x: 80, y: 25 }, { x: 60, y: 75 }, { x: 34, y: 48 }, { x: 85, y: 78 }, { x: 51, y: 56 }
              ];
              const pos = positions[idx % positions.length];

              return (
                <div
                  key={truck.id}
                  onClick={() => {
                    onSelectTruck(truck);
                    onOpenDashboard(truck);
                  }}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group z-20"
                >
                  <div
                    className={`absolute inset-0 -m-7 rounded-full border transition-all pointer-events-none ${
                      isHazard
                        ? 'border-red-500 bg-red-500/20 animate-ping'
                        : isSelected
                        ? 'border-[#b9812f] bg-[#b9812f]/15 animate-pulse'
                        : 'border-white/10 bg-white/5'
                    }`}
                  />

                  <div
                    className={`relative p-2.5 rounded-full border shadow-xl flex items-center justify-center transition-transform group-hover:scale-125 ${
                      isHazard
                        ? 'bg-red-950 border-red-500 text-red-100 animate-bounce'
                        : isSelected
                        ? 'bg-[#2b170e] border-[#b9812f] text-[#b9812f]'
                        : 'bg-[#140c08] border-[#3d2414] text-white'
                    }`}
                  >
                    <Truck size={20} className={isHazard ? 'text-red-400' : 'text-[#b9812f]'} />
                  </div>

                  <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#140c08] border border-[#3d2414] px-2 py-0.5 rounded shadow flex flex-col items-center pointer-events-none">
                    <span className="text-[11px] font-bold text-white uppercase">
                      {truck.id} — {truck.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-white/70">
                      Dist: {truck.relativeDistanceMeters.toFixed(1)}m | {truck.gps.speed} km/h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full md:w-80 lg:w-96 bg-[#140c08] border-t md:border-t-0 md:border-l border-[#3d2414] p-4 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#3d2414] pb-3">
            <h3 className="text-xs text-white/70 uppercase font-bold tracking-wider">
              Fleet Vehicles ({fleet.length})
            </h3>
            <span className="text-[10px] text-[#b9812f] bg-[#24150c] px-2 py-0.5 border border-[#3d2414] rounded font-semibold">
              Select for Cab View
            </span>
          </div>

          <div className="space-y-2.5">
            {fleet.map((truck) => {
              const isSelected = truck.id === selectedTruckId;
              const isCollisionRisk = truck.sensors.ultrasonicDistanceMeters < 15;

              return (
                <div
                  key={truck.id}
                  onClick={() => {
                    onSelectTruck(truck);
                    onOpenDashboard(truck);
                  }}
                  className={`p-3 border rounded transition-all cursor-pointer ${
                    isCollisionRisk
                      ? 'bg-red-950/70 border-red-500/80 hover:bg-red-900/80'
                      : isSelected
                      ? 'bg-[#24150c] border-[#b9812f] hover:bg-[#2e1b10]'
                      : 'bg-[#1c110b] border-[#3d2414] hover:bg-[#26170f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${isCollisionRisk ? 'text-red-400' : 'text-[#b9812f]'}`} />
                      <span className="font-bold text-sm text-white">{truck.id}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                        isCollisionRisk
                          ? 'bg-red-600 text-white border-red-400 animate-pulse'
                          : 'bg-[#24150c] text-[#b9812f] border-[#3d2414]'
                      }`}
                    >
                      {isCollisionRisk ? 'Collision Risk' : truck.status}
                    </span>
                  </div>

                  <div className="text-xs text-white/90 font-medium">{truck.name}</div>
                  <div className="text-[11px] text-white/60 mt-0.5">Driver: {truck.driverName}</div>

                  <div className="mt-2 pt-2 border-t border-[#3d2414] grid grid-cols-2 gap-2 text-[10px] text-white/70">
                    <div>Rel Dist: <span className={isCollisionRisk ? 'text-red-400 font-bold' : 'text-[#b9812f]'}>{truck.relativeDistanceMeters.toFixed(1)} m</span></div>
                    <div>Speed: <span className="text-white">{truck.gps.speed} km/h</span></div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTruck(truck);
                      onOpenDashboard(truck);
                    }}
                    className="mt-2.5 w-full py-1.5 bg-[#29170d] hover:bg-[#381f12] border border-[#4a2c18] text-white text-xs uppercase font-semibold rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye size={14} /> Open Driver Cab &amp; Dashboard
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
