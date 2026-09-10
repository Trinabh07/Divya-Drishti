import { useState } from 'react';
import { FrontPage } from './components/FrontPage';
import { MineFleetMap } from './components/MineFleetMap';
import { DriverCabDashboard } from './components/DriverCabDashboard';
import { MobileMenu } from './components/MobileMenu';
import { DetailModal } from './components/DetailModal';
import { INITIAL_MINE_FLEET } from './data/mockFleet';
import type { MineTruck } from './types/fleet';
import { LogoSVG } from './components/Navbar';

export function App() {
  const [activeView, setActiveView] = useState<'FRONT_PAGE' | 'FLEET_MAP'>('FRONT_PAGE');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<string | null>(null);
  const [fleet] = useState<MineTruck[]>(INITIAL_MINE_FLEET);
  const [selectedTruck, setSelectedTruck] = useState<MineTruck>(INITIAL_MINE_FLEET[0]);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [watchdogOk, setWatchdogOk] = useState(true);

  const handleSelectNav = (navId: string) => {
    if (navId === 'FLEET_MAP') {
      setActiveView('FLEET_MAP');
    } else {
      setActiveDocTab(navId);
    }
  };

  const handleOpenDashboardForTruck = (truck: MineTruck) => {
    setSelectedTruck(truck);
    setDashboardOpen(true);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0705] text-white font-classic">
      {activeView === 'FRONT_PAGE' && (
        <FrontPage
          onOpenMenu={() => setMobileMenuOpen(true)}
          hazardActive={!watchdogOk}
        />
      )}

      {activeView === 'FLEET_MAP' && (
        <div className="relative h-screen w-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-[#0c0805] border-b border-[#3d2414] text-white z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveView('FRONT_PAGE')}
                className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity cursor-pointer"
                aria-label="Back to front page"
              >
                <LogoSVG size={22} className="text-white" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Mine Fleet Command Center
                </span>
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="px-3.5 py-1 bg-[#24150c] hover:bg-[#331c10] border border-[#3d2414] text-xs font-semibold uppercase tracking-wider text-white rounded cursor-pointer"
            >
              Menu
            </button>
          </div>
          <MineFleetMap
            fleet={fleet}
            selectedTruckId={selectedTruck.id}
            onSelectTruck={(t) => setSelectedTruck(t)}
            onOpenDashboard={handleOpenDashboardForTruck}
            watchdogOk={watchdogOk}
          />
        </div>
      )}

      {dashboardOpen && (
        <DriverCabDashboard
          truck={selectedTruck}
          allTrucks={fleet}
          onClose={() => setDashboardOpen(false)}
          watchdogOk={watchdogOk}
          onToggleWatchdog={() => setWatchdogOk(!watchdogOk)}
        />
      )}

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onSelectNav={handleSelectNav}
      />

      <DetailModal
        activeTab={activeDocTab}
        onClose={() => setActiveDocTab(null)}
      />
    </div>
  );
}

export default App;
