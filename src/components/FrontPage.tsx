import React from 'react';
import { Menu, ShieldAlert, Radio } from 'lucide-react';
import { LogoSVG } from './Navbar';
import { MineBackground } from './MineBackground';

interface FrontPageProps {
  onOpenMenu: () => void;
  hazardActive?: boolean;
}

export const FrontPage: React.FC<FrontPageProps> = ({ onOpenMenu, hazardActive = false }) => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0705] text-white font-classic">
      <MineBackground hazardDetected={hazardActive} />

      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 md:px-14 py-8 pointer-events-auto">
        <div className="flex items-center gap-4">
          <LogoSVG size={36} className="text-white" />
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white uppercase leading-none">
              DIVYA DRISHTI
            </h1>
            <span className="text-xs text-[#b9812f] tracking-widest uppercase mt-1 font-medium">
              Hazard Tracking System &middot; SIH 2026
            </span>
          </div>
        </div>
        <button
          onClick={onOpenMenu}
          aria-label="Open Navigation Menu"
          className="flex items-center gap-3 px-5 py-2.5 bg-[#170f0a] hover:bg-[#26170f] text-white border border-[#3d2414] rounded transition-all cursor-pointer shadow-lg group"
        >
          <span className="text-sm font-semibold uppercase tracking-wider group-hover:text-[#c99245] transition-colors">
            Menu
          </span>
          <Menu size={20} className="text-white group-hover:text-[#c99245] transition-colors" />
        </button>
      </header>

      {/* Problem statement — kept short, placed in the open lower-left space */}
      <div className="relative z-20 max-w-xs ml-6 sm:ml-10 md:ml-14 mt-16 sm:mt-24 p-5 bg-[#170f0a]/90 border border-[#3d2414] rounded shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-2 mb-2.5">
          <ShieldAlert className="w-4 h-4 text-[#b9812f]" />
          <span className="text-[10px] font-bold text-[#b9812f] uppercase tracking-wider">
            SIH26007
          </span>
        </div>
        <h2 className="text-sm sm:text-base font-bold text-white leading-snug mb-2">
          Mine Vehicle Safety in Zero-Visibility Fog &amp; Dust
        </h2>
        <p className="text-xs text-white/75 leading-relaxed mb-3">
          Acoustic + vibration sensing to prevent haul-truck collisions when cameras and radar fail.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-[#b9812f] bg-[#211510] px-2.5 py-1.5 border border-[#3d2414] rounded">
          <Radio className="w-3 h-3 animate-pulse text-[#b9812f]" />
          <span>Dual-MCU &middot; No Camera Reliance</span>
        </div>
      </div>
    </div>
  );
};
