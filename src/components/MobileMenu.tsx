import React from 'react';
import { X } from 'lucide-react';
import { LogoSVG } from './Navbar';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNav: (navItem: string) => void;
}

// Note: intentionally no "Front Page" entry — the front page is the
// default landing screen, reached via the logo, not a menu destination.
export const MENU_ITEMS = [
  { id: 'FLEET_MAP', label: 'MINE FLEET GPS MAP & CAB DASHBOARD' },
  { id: 'ARCHITECTURE', label: 'SYSTEM ARCHITECTURE' },
  { id: 'HARDWARE', label: 'HARDWARE SPECS' },
  { id: 'IMPACT', label: 'IMPACT & BENEFITS' },
  { id: 'TEAM', label: 'TEAM MEMBERS' },
];

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onSelectNav }) => {
  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0a0705]/97 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-6 border-b border-[#3d2414]">
        <div className="flex items-center gap-3">
          <LogoSVG size={28} className="text-white" />
          <span className="font-classic text-white font-bold tracking-wider text-base uppercase">
            DIVYA DRISHTI
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="p-2 text-white hover:opacity-70 transition-opacity focus:outline-none cursor-pointer"
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex flex-col items-center justify-center flex-1 gap-6 p-6">
        {MENU_ITEMS.map((item, i) => (
          <button
            key={item.id}
            onClick={() => {
              onSelectNav(item.id);
              onClose();
            }}
            style={{
              transitionDelay: isOpen ? `${100 + i * 60}ms` : '0ms',
            }}
            className={`font-classic text-xl sm:text-2xl font-bold tracking-wide text-white uppercase hover:text-[#c99245] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer text-center ${
              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 text-center text-xs text-white/50">
        SIH 2026 &middot; Problem ID SIH26007 &middot; Opencast Iron Ore Mine Hazard Detection
      </div>
    </div>
  );
};
