import React, { useState, useEffect, useRef } from 'react';
import {
  X, ShieldAlert, Volume2, Compass, Truck, AlertOctagon, VolumeX
} from 'lucide-react';
import type { MineTruck } from '../types/fleet';
import { soundEffects } from '../utils/soundEffects';
import { LogoSVG } from './Navbar';

interface DriverCabDashboardProps {
  truck: MineTruck;
  allTrucks: MineTruck[];
  onClose: () => void;
  watchdogOk: boolean;
  onToggleWatchdog: () => void;
}

export const DriverCabDashboard: React.FC<DriverCabDashboardProps> = ({
  truck,
  allTrucks,
  onClose,
  watchdogOk,
  onToggleWatchdog,
}) => {
  const [distanceThreshold] = useState<number>(15.0);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(truck.sensors.ultrasonicDistanceMeters);
  const [simulatedVibration, setSimulatedVibration] = useState<boolean>(truck.sensors.groundVibrationSwitch);
  const [simulatedAcoustic] = useState<number>(truck.sensors.tensorAcousticEnergy);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const nearbyTrucks = allTrucks.filter((t) => t.id !== truck.id);
  const approachingVehicle = nearbyTrucks.find((t) => t.sensors.ultrasonicDistanceMeters < 15) || nearbyTrucks[0] || truck;

  const isCollisionRisk = (simulatedDistance < distanceThreshold || simulatedVibration) && watchdogOk;

  useEffect(() => {
    if (isCollisionRisk && !audioMuted) {
      soundEffects.startCollisionBuzzer();
    } else {
      soundEffects.stopCollisionBuzzer();
    }

    return () => {
      soundEffects.stopCollisionBuzzer();
    };
  }, [isCollisionRisk, audioMuted]);

  useEffect(() => {
    if (!watchdogOk && !audioMuted) {
      soundEffects.playWatchdogAlertBeep();
    }
  }, [watchdogOk, audioMuted]);

  // 3D driver-window simulation: perspective ground plane, sky/dust haze,
  // and the approaching vehicle rendered with a depth-scaled 3D silhouette
  // that grows and brightens its headlamps as it closes distance.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render3DCab = () => {
      time += 0.03;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 600);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 360);

      ctx.clearRect(0, 0, w, h);

      const horizonY = h * 0.46;

      // Sky / dust haze above the horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0a0705');
      skyGrad.addColorStop(1, '#20140b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Ground plane with converging perspective lines (haul road)
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      groundGrad.addColorStop(0, '#1c120a');
      groundGrad.addColorStop(1, '#050302');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      ctx.strokeStyle = '#3d2414';
      ctx.lineWidth = 1.5;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + i * 40, horizonY);
        ctx.lineTo(w / 2 + i * 260, h);
        ctx.stroke();
      }
      for (let j = 1; j <= 5; j++) {
        const yy = horizonY + (h - horizonY) * (j / 5) * (j / 5);
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(w, yy);
        ctx.globalAlpha = 0.25;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Distance-driven depth: closer distance => larger, closer truck
      const distClamped = Math.max(1.0, Math.min(30.0, simulatedDistance));
      const depthScale = Math.max(0.1, Math.min(1.3, (30.0 - distClamped) / 25.0 + 0.18));

      const appX = w * 0.5 + Math.sin(time) * (14 * depthScale);
      const appY = horizonY + (h - horizonY) * 0.18 + (1 - depthScale) * (h * 0.04);

      ctx.save();
      ctx.translate(appX, appY);

      const truckW = 180 * depthScale;
      const truckH = 140 * depthScale;

      // Ground shadow under approaching truck
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, truckH * 0.42, truckW * 0.55, truckH * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isCollisionRisk ? '#3a0c0a' : '#1c100a';
      ctx.strokeStyle = isCollisionRisk ? '#e05555' : '#b9812f';
      ctx.lineWidth = 2 * depthScale;

      // Dump body block
      ctx.beginPath();
      ctx.fillRect(-truckW / 2, -truckH / 2, truckW, truckH * 0.6);
      ctx.strokeRect(-truckW / 2, -truckH / 2, truckW, truckH * 0.6);

      // Cab block
      ctx.fillStyle = '#2b170e';
      ctx.fillRect(-truckW * 0.4, -truckH * 0.1, truckW * 0.8, truckH * 0.5);
      ctx.strokeRect(-truckW * 0.4, -truckH * 0.1, truckW * 0.8, truckH * 0.5);

      // Wheels
      ctx.fillStyle = '#0c0705';
      ctx.beginPath();
      ctx.arc(-truckW * 0.32, truckH * 0.42, truckW * 0.1, 0, Math.PI * 2);
      ctx.arc(truckW * 0.32, truckH * 0.42, truckW * 0.1, 0, Math.PI * 2);
      ctx.fill();

      const headlightColor = isCollisionRisk ? '#e05555' : '#f0d6a0';
      ctx.fillStyle = headlightColor;
      ctx.shadowColor = headlightColor;
      ctx.shadowBlur = 25 * depthScale;

      ctx.beginPath();
      ctx.arc(-truckW * 0.3, truckH * 0.15, 8 * depthScale, 0, Math.PI * 2);
      ctx.arc(truckW * 0.3, truckH * 0.15, 8 * depthScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Rolling dust / fog haze over the whole scene
      ctx.fillStyle = `rgba(38, 22, 14, ${isCollisionRisk ? 0.22 : 0.32})`;
      ctx.fillRect(0, 0, w, h);

      // Windshield pillars (A-pillars) framing the driver's view
      ctx.fillStyle = '#140c08';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.12, 0);
      ctx.lineTo(0, h * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w * 0.88, 0);
      ctx.lineTo(w, h * 0.6);
      ctx.closePath();
      ctx.fill();

      // Dashboard rim + wheel silhouette
      ctx.fillStyle = '#0f0805';
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      ctx.strokeStyle = '#3d2414';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, h * 0.78, w, h * 0.22);

      ctx.strokeStyle = '#2b170e';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(w * 0.25, h * 0.95, 80, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      animId = requestAnimationFrame(render3DCab);
    };

    render3DCab();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [simulatedDistance, isCollisionRisk]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0a0705]/95 backdrop-brightness-50 overflow-y-auto font-classic">
      <div className="relative w-full max-w-6xl bg-[#140c08] border border-[#3d2414] rounded shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white">
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-[#3d2414] bg-[#0c0805]">
          <div className="flex items-center gap-4">
            <LogoSVG size={28} className="text-white" />
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-[#b9812f]" />
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Driver Cab View &amp; Telemetry — {truck.name} ({truck.id})
                </h2>
                <p className="text-xs text-white/60">
                  Driver: <span className="text-white font-medium">{truck.driverName}</span> | Model: {truck.model}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                audioMuted
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-[#24150c] border-[#3d2414] text-white hover:bg-[#331c10]'
              }`}
            >
              {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{audioMuted ? 'Buzzer Muted' : 'Audio Buzzer On'}</span>
            </button>

            <button
              onClick={onToggleWatchdog}
              className={`px-3 py-1.5 rounded border text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                watchdogOk
                  ? 'bg-[#24150c] border-[#b9812f]/40 text-[#b9812f] hover:bg-[#331c10]'
                  : 'bg-amber-950 border-amber-600 text-amber-200 animate-pulse font-bold'
              }`}
            >
              500ms Watchdog: {watchdogOk ? 'OK' : 'Simulate Fail'}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {isCollisionRisk && (
          <div className="bg-red-700 border-y-2 border-red-500 px-6 py-4 text-white flex items-center justify-between animate-pulse shadow-2xl z-30">
            <div className="flex items-center gap-4">
              <ShieldAlert className="w-10 h-10 text-white animate-bounce" />
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-white">
                  Emergency Alarm: High Risk of Collision
                </h3>
                <p className="text-sm text-yellow-200 font-bold mt-1 uppercase">
                  Distance between {truck.id} and {approachingVehicle.id}: {simulatedDistance.toFixed(1)} meters
                </p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-black border border-white/30 rounded text-xs font-bold text-red-200 uppercase tracking-wider">
              Immediate Braking Required
            </div>
          </div>
        )}

        {!watchdogOk && (
          <div className="bg-amber-700 border-y border-amber-600 px-6 py-3 text-white flex items-center justify-between z-30">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-7 h-7 text-white animate-pulse" />
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide text-white">
                  System Degraded — Watchdog Heartbeat Failed (UART Timeout)
                </h3>
                <p className="text-xs text-white/90">
                  ESP32 Sensor Fusion Node &lt;-&gt; STM32H7 Safety Unit 500ms pulse lost. Watchdog timer failed.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative w-full h-80 sm:h-96 bg-black rounded border border-[#3d2414] overflow-hidden shadow-2xl">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-4 left-4 z-20 text-xs text-[#b9812f] bg-[#140c08] px-3 py-1.5 rounded border border-[#3d2414] font-semibold">
                  3D Driver Windshield Simulation — Fog &amp; Dust Perspective
                </div>
              </div>

              <div className="p-4 bg-[#1a100a] border border-[#3d2414] rounded flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Simulate Vehicle Proximity: <span className="text-[#b9812f] font-bold">{simulatedDistance.toFixed(1)} Meters</span> (Threshold: {distanceThreshold}m)
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="30.0"
                    step="0.5"
                    value={simulatedDistance}
                    onChange={(e) => setSimulatedDistance(parseFloat(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimulatedVibration(!simulatedVibration)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                      simulatedVibration
                        ? 'bg-red-950 border-red-500 text-red-200'
                        : 'bg-[#29170d] border-[#3d2414] text-white/80'
                    }`}
                  >
                    Ground Vibration: {simulatedVibration ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-4 bg-[#1a100a] border border-[#3d2414] rounded space-y-3">
                <h3 className="text-xs text-[#b9812f] font-bold uppercase tracking-wider flex items-center gap-2 border-b border-[#3d2414] pb-2">
                  <Compass className="w-4 h-4" /> Truck Telemetry &amp; GPS Module Data
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-[#140c08] border border-[#3d2414] rounded">
                    <span className="text-white/50 block text-[10px]">Latitude</span>
                    <span className="text-white text-sm font-bold">{truck.gps.latitude.toFixed(6)}&deg; N</span>
                  </div>
                  <div className="p-2.5 bg-[#140c08] border border-[#3d2414] rounded">
                    <span className="text-white/50 block text-[10px]">Longitude</span>
                    <span className="text-white text-sm font-bold">{truck.gps.longitude.toFixed(6)}&deg; E</span>
                  </div>
                  <div className="p-2.5 bg-[#140c08] border border-[#3d2414] rounded">
                    <span className="text-white/50 block text-[10px]">Speed / Heading</span>
                    <span className="text-white text-sm font-bold">{truck.gps.speed} km/h &middot; {truck.gps.heading}&deg;</span>
                  </div>
                  <div className="p-2.5 bg-[#140c08] border border-[#3d2414] rounded">
                    <span className="text-white/50 block text-[10px]">Altitude</span>
                    <span className="text-white text-sm font-bold">{truck.gps.altitude} m</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#3d2414]">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/70">Ground Vibration Sensor (Hz):</span>
                    <span className={simulatedVibration ? 'text-red-400 font-bold' : 'text-white'}>
                      {truck.sensors.groundVibrationHz} Hz ({simulatedVibration ? 'TRIGGERED' : 'NORMAL'})
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/70">HC-SR04 Ultrasonic Distance:</span>
                    <span className={simulatedDistance < 15 ? 'text-red-400 font-bold' : 'text-[#b9812f]'}>
                      {simulatedDistance.toFixed(1)} meters
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/70">ESP-DSP Tensor Acoustic Module:</span>
                    <span className="text-[#b9812f] font-bold">{simulatedAcoustic}% (20-200Hz Band-pass)</span>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded space-y-3 transition-colors ${
                  isCollisionRisk
                    ? 'bg-red-950 border-red-500 text-red-100 shadow-2xl'
                    : 'bg-[#1a100a] border-[#3d2414]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#3d2414] pb-2">
                  <h3 className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Approaching Hazard Vehicle
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-red-900 border border-red-500 rounded text-red-100 uppercase">
                    Target Locked
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-70">Vehicle ID &amp; Name:</span>
                    <span className="font-bold text-white">{approachingVehicle.name} ({approachingVehicle.id})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Driver Name:</span>
                    <span className="font-medium text-white">{approachingVehicle.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Vehicle Model / Payload:</span>
                    <span className="text-white">{approachingVehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">GPS Position:</span>
                    <span className="text-white">{approachingVehicle.gps.latitude.toFixed(6)}&deg; N, {approachingVehicle.gps.longitude.toFixed(6)}&deg; E</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Exact Distance ({truck.id} &rarr; {approachingVehicle.id}):</span>
                    <span className="text-yellow-300 font-bold">{simulatedDistance.toFixed(1)} Meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Relative Approach Velocity:</span>
                    <span className="text-red-300 font-bold">{approachingVehicle.gps.speed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Hazard Acoustic Signature:</span>
                    <span className="text-[#b9812f]">{approachingVehicle.sensors.acousticPeakHz} Hz Peak Rumble</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
