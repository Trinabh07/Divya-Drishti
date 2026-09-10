import React from 'react';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onSelectNav: (navItem: string) => void;
}

export const NAV_ITEMS = [
  'FLEET_MAP',
  'ARCHITECTURE',
  'HARDWARE',
  'IMPACT',
  'TEAM',
];

export const LogoSVG: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 28 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 256 256"
    fill="none"
    className={className}
  >
    <path
      d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
      fill="currentColor"
    />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onSelectNav }) => {
  return (
    <header className="flex items-center justify-between py-6 z-20">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectNav('FLEET_MAP');
        }}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <LogoSVG size={28} className="text-white" />
        <span className="font-classic font-bold tracking-wider text-sm sm:text-base uppercase text-white">
          DIVYA DRISHTI
        </span>
      </a>
      <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => onSelectNav(item)}
            className="text-white/85 hover:text-[#c99245] transition-colors uppercase font-semibold cursor-pointer"
          >
            {item.replace('_', ' ')}
          </button>
        ))}
      </nav>
      <button
        onClick={onOpenMobileMenu}
        aria-label="Open navigation menu"
        className="md:hidden p-2 text-white hover:opacity-70 transition-opacity focus:outline-none cursor-pointer"
      >
        <Menu size={24} />
      </button>
    </header>
  );
};
