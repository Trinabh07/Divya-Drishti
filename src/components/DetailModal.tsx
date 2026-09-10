import React from 'react';
import { X, Users } from 'lucide-react';
import { LogoSVG } from './Navbar';

interface DetailModalProps {
  activeTab: string | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ activeTab, onClose }) => {
  if (!activeTab) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0705]/90 backdrop-brightness-50 transition-opacity font-classic">
      <div className="relative w-full max-w-4xl bg-[#140c08] border border-[#3d2414] rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3d2414] bg-[#0c0805]">
          <div className="flex items-center gap-3">
            <LogoSVG size={26} className="text-white" />
            <span className="text-base text-white font-bold tracking-wide uppercase">
              {activeTab.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-white/90">
          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-6">
              <div className="p-4 bg-[#1c110b] border border-[#3d2414] rounded">
                <h3 className="text-sm text-[#b9812f] uppercase font-bold mb-4">
                  Detection &amp; Alert Logic Flow
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#140c08] border border-[#3d2414] rounded text-center">
                    <div className="text-xs font-bold text-[#b9812f] mb-1">1. Continuous Input</div>
                    <div className="text-xs text-white/80">Mic + Vibration + Ultrasonic</div>
                  </div>
                  <div className="p-3 bg-[#140c08] border border-[#3d2414] rounded text-center">
                    <div className="text-xs font-bold text-[#b9812f] mb-1">2. Preprocessing</div>
                    <div className="text-xs text-white/80">Band-pass Filter (20–200 Hz)</div>
                  </div>
                  <div className="p-3 bg-[#140c08] border border-[#3d2414] rounded text-center">
                    <div className="text-xs font-bold text-[#b9812f] mb-1">3. Hazard Check</div>
                    <div className="text-xs text-white/80">Acoustic / Vibration Rising?</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#140c08] border border-[#3d2414] rounded flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-xs space-y-1">
                    <div className="text-[#b9812f] font-bold">4. 2-Second Hysteresis Window</div>
                    <div className="text-white/70">
                      Sustained signal check filters out false positive spikes before alarm triggers.
                    </div>
                  </div>
                  <div className="text-xs space-y-1 text-right">
                    <div className="text-[#b9812f] font-bold">5. 500ms UART Watchdog</div>
                    <div className="text-white/70">
                      Heartbeat check between ESP32 and STM32H7 prevents silent watchdog failure.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HARDWARE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#1c110b] border border-[#3d2414] rounded">
                  <h4 className="text-sm text-[#b9812f] font-bold mb-2">I. ESP32 (Sensor Fusion &amp; Detection Node)</h4>
                  <ul className="text-xs text-white/80 space-y-1.5 list-disc list-inside">
                    <li>Executes Espressif ESP-DSP digital IIR band-pass filtering (20–200 Hz).</li>
                    <li>Isolates low-frequency heavy diesel engine acoustic signatures.</li>
                    <li>Combines acoustic, ground vibration switch, and ultrasonic distance data.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#1c110b] border border-[#3d2414] rounded">
                  <h4 className="text-sm text-[#b9812f] font-bold mb-2">II. STM32H7 (Safety Actuation Unit)</h4>
                  <ul className="text-xs text-white/80 space-y-1.5 list-disc list-inside">
                    <li>Isolated bare-metal safety controller with hardware Independent Watchdog (IWDG).</li>
                    <li>Direct UART interrupt interface receiving trigger commands from ESP32.</li>
                    <li>Drives high-power physical in-cabin buzzer &amp; LED strobe via ULN2003 Darlington Array.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'IMPACT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#1c110b] border border-[#3d2414] rounded">
                <h4 className="text-xs text-[#b9812f] uppercase font-bold mb-2">Social Benefits</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Protects lives by giving mine vehicle operators direct physical hazard warnings regardless of fog or dust visibility.
                </p>
              </div>

              <div className="p-4 bg-[#1c110b] border border-[#3d2414] rounded">
                <h4 className="text-xs text-[#b9812f] uppercase font-bold mb-2">Economic Benefits</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Low hardware component costs compared to expensive camera/radar solutions. 0 recurring licensing fees.
                </p>
              </div>

              <div className="p-4 bg-[#1c110b] border border-[#3d2414] rounded">
                <h4 className="text-xs text-[#b9812f] uppercase font-bold mb-2">Operational Benefits</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Ultra-low power consumption suitable for vehicle-mounted deployment in zero ambient light conditions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'TEAM' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1c110b] border border-[#3d2414] rounded flex justify-between items-center">
                <div>
                  <div className="text-xs text-[#b9812f] uppercase font-bold">Faculty Guide</div>
                  <div className="font-bold text-white text-base">Dr. Tamizharasi T</div>
                  <div className="text-xs text-white/60">Faculty ID: 13648</div>
                </div>
                <div className="text-xs text-white/60 text-right">
                  SIH 2026 Team<br />Divya Drishti
                </div>
              </div>

              <h4 className="text-xs text-white/70 font-bold uppercase">Team Members</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  { name: 'Jyosmita Saha', reg: '25BCE2408' },
                  { name: 'Rajvardhan Jain', reg: '25BCE2539' },
                  { name: 'B.Uma', reg: '25BCE2459' },
                  { name: 'T.Amrutha', reg: '25BCE2284' },
                  { name: 'Trinabh Dua', reg: '25BEC0441' },
                  { name: 'Nandana C Sajith', reg: '25BCE2440' },
                ].map((m, idx) => (
                  <div key={idx} className="p-3 bg-[#140c08] border border-[#3d2414] rounded flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[11px] text-white/60">{m.reg}</div>
                    </div>
                    <Users className="w-4 h-4 text-white/40" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#3d2414] bg-[#0c0805] flex justify-between items-center text-xs text-white/60">
          <div>Divya Drishti — Smart India Hackathon 2026</div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#b9812f] text-black font-bold hover:bg-[#96681f] transition-colors rounded cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
