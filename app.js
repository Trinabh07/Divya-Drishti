// ==========================================
// 1. STATE & CONSTANTS DEFINITION
// ==========================================

const STATE = {
  acoustic_dE_dt: 0.0,
  ultrasonic_distance_cm: 600,
  hysteresis_timer: 2.0,
  riskLevel: 'GREEN', // 'GREEN', 'YELLOW', 'RED'
  isConnected: false,
};

const COLORS = {
  cyan: '#00f0ff',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  darkBg: '#0b0f19'
};

// ==========================================
// 2. AUDIO SYNTHESIS ENGINE (Web Audio API)
// ==========================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.alertInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAlert();
    } else if (STATE.riskLevel === 'RED') {
      this.startAlert();
    }
    return this.isMuted;
  }

  playBeep(freq, type = 'sine', duration = 0.1) {
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  startAlert() {
    if (this.isMuted || !this.ctx) return;
    if (this.alertInterval) return;
    
    this.alertInterval = setInterval(() => {
      this.playBeep(880, 'square', 0.15); // High pitched aggressive beep
      setTimeout(() => this.playBeep(880, 'square', 0.15), 200);
    }, 600);
  }

  stopAlert() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }
  }
}

const Audio = new SoundEngine();

const audioToggleBtn = document.getElementById('audio-toggle-btn');
const audioIcon = document.getElementById('audio-icon');
const audioStatusTxt = document.getElementById('audio-status-txt');

audioToggleBtn.addEventListener('click', () => {
  Audio.init();
  const isMuted = Audio.toggleMute();
  if (isMuted) {
    audioIcon.textContent = "🔇";
    audioStatusTxt.textContent = "AUDIO: OFF";
  } else {
    Audio.playBeep(440);
    audioIcon.textContent = "🔊";
    audioStatusTxt.textContent = "AUDIO: ON";
  }
});

// ==========================================
// 3. UI DOM ELEMENTS
// ==========================================

const DOM = {
  valAcoustic: document.getElementById('val-acoustic'),
  acousticBar: document.getElementById('acoustic-bar'),
  valDistance: document.getElementById('val-distance'),
  valVibration: document.getElementById('val-vibration'),
  valTimer: document.getElementById('val-timer'),
  
  statusCard: document.getElementById('status-card'),
  statusText: document.getElementById('status-text'),
  statusDesc: document.getElementById('status-description'),
  
  hazardOverlay: document.getElementById('hazard-overlay'),
  alarmStrobe: document.getElementById('alarm-strobe'),
  
  terminalFeed: document.getElementById('terminal-feed'),
  wsIndicator: document.getElementById('ws-indicator'),
  wsConnectBtn: document.getElementById('ws-connect-btn'),
  simPlayPauseBtn: document.getElementById('sim-play-pause-btn'),
};

function appendLog(msg) {
  const div = document.createElement('div');
  div.className = 'text-slate-400';
  div.textContent = `> ${msg}`;
  DOM.terminalFeed.appendChild(div);
  DOM.terminalFeed.scrollTop = DOM.terminalFeed.scrollHeight;
}

// ==========================================
// 4. WEBSOCKET & STATE MANAGEMENT
// ==========================================

let ws = null;

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    appendLog("WebSocket already connected or connecting.");
    return;
  }
  
  appendLog("Attempting WebSocket connection...");
  DOM.wsIndicator.textContent = "CONNECTING...";
  
  // Try connecting to ESP32 default IP (192.168.4.1) or current host for local dev
  const wsUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? `ws://${window.location.host}/ws` 
                : 'ws://192.168.4.1/ws';
                
  try {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      STATE.isConnected = true;
      appendLog("WebSocket connected successfully.");
      DOM.wsIndicator.textContent = "CONNECTED";
      DOM.wsIndicator.className = "text-[8px] text-clearGreen";
    };
    
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.acoustic_dE_dt !== undefined) {
          STATE.acoustic_dE_dt = data.acoustic_dE_dt;
          STATE.ultrasonic_distance_cm = data.ultrasonic_distance_cm;
          STATE.hysteresis_timer = data.hysteresis_timer;
          updateLogic();
        }
      } catch (err) {
        // Ignore non-json
      }
    };
    
    ws.onclose = () => {
      STATE.isConnected = false;
      appendLog("WebSocket closed.");
      DOM.wsIndicator.textContent = "DISCONNECTED";
      DOM.wsIndicator.className = "text-[8px] text-slate-600";
    };
    
    ws.onerror = (e) => {
      appendLog("WebSocket error encountered.");
    };
  } catch (e) {
    appendLog("Error initializing WebSocket.");
  }
}

DOM.wsConnectBtn.addEventListener('click', connectWebSocket);

// Update logic maps values to UI and computes risk state
function updateLogic() {
  // Update DOM values
  DOM.valAcoustic.textContent = STATE.acoustic_dE_dt.toFixed(2);
  DOM.valDistance.textContent = STATE.ultrasonic_distance_cm;
  DOM.valTimer.textContent = STATE.hysteresis_timer.toFixed(2);
  
  // Update Acoustic bar width (max 10.0 for 100%)
  const barPct = Math.min(100, Math.max(0, (STATE.acoustic_dE_dt / 10.0) * 100));
  DOM.acousticBar.style.width = `${barPct}%`;
  
  // Logic Thresholds
  // If dE/dt > 6.0 => YELLOW
  // If timer reaches 0.0 => RED
  
  let newLevel = 'GREEN';
  
  if (STATE.hysteresis_timer <= 0.0) {
    newLevel = 'RED';
  } else if (STATE.acoustic_dE_dt > 6.0) {
    newLevel = 'YELLOW';
  } else {
    newLevel = 'GREEN';
  }
  
  if (STATE.riskLevel !== newLevel) {
    STATE.riskLevel = newLevel;
    applyRiskLevelTheme();
  }
}

function applyRiskLevelTheme() {
  // Reset all classes
  DOM.statusCard.className = 'glass-panel p-4 flex flex-col items-center justify-center border-l-4 text-center transition-all duration-300';
  DOM.acousticBar.className = 'h-full transition-all duration-100';
  
  if (STATE.riskLevel === 'GREEN') {
    DOM.statusCard.classList.add('border-clearGreen', 'shadow-glow-green');
    DOM.statusText.className = 'text-2xl font-black tracking-tighter text-clearGreen mt-1 uppercase';
    DOM.statusText.textContent = 'SAFE';
    DOM.statusDesc.textContent = 'ACOUSTIC LEVELS NORMAL';
    DOM.acousticBar.classList.add('bg-clearGreen');
    DOM.valVibration.className = 'text-sm font-bold text-clearGreen mt-1 uppercase';
    DOM.valVibration.textContent = 'NOMINAL';
    
    DOM.hazardOverlay.style.opacity = '0';
    DOM.alarmStrobe.classList.remove('bg-hazardRed/20');
    Audio.stopAlert();
    
  } else if (STATE.riskLevel === 'YELLOW') {
    DOM.statusCard.classList.add('border-warnAmber', 'shadow-glow-amber');
    DOM.statusText.className = 'text-2xl font-black tracking-tighter text-warnAmber mt-1 uppercase';
    DOM.statusText.textContent = 'WARNING';
    DOM.statusDesc.textContent = 'HIGH ACOUSTIC ENERGY DETECTED';
    DOM.acousticBar.classList.add('bg-warnAmber');
    DOM.valVibration.className = 'text-sm font-bold text-warnAmber mt-1 uppercase';
    DOM.valVibration.textContent = 'ELEVATED';
    
    DOM.hazardOverlay.style.opacity = '0';
    DOM.alarmStrobe.classList.remove('bg-hazardRed/20');
    Audio.stopAlert();
    
  } else if (STATE.riskLevel === 'RED') {
    DOM.statusCard.classList.add('border-hazardRed', 'shadow-glow-red', 'animate-pulse');
    DOM.statusText.className = 'text-2xl font-black tracking-tighter text-hazardRed mt-1 uppercase animate-pulse';
    DOM.statusText.textContent = 'DANGER';
    DOM.statusDesc.textContent = 'HAZARD CONFIRMED';
    DOM.acousticBar.classList.add('bg-hazardRed');
    DOM.valVibration.className = 'text-sm font-bold text-hazardRed mt-1 uppercase';
    DOM.valVibration.textContent = 'CRITICAL';
    
    DOM.hazardOverlay.style.opacity = '1';
    DOM.alarmStrobe.classList.add('bg-hazardRed/20');
    Audio.startAlert();
  }
}

// SIMULATOR FOR DEV WHEN NOT CONNECTED
setInterval(() => {
  if (STATE.isConnected) return;
  // Slowly simulate a hazard
  let d = STATE.ultrasonic_distance_cm - 2;
  if (d < 50) d = 50;
  
  let a = STATE.acoustic_dE_dt;
  if (d < 200) {
    a += 0.05;
    if (a > 8.0) a = 8.0;
  } else {
    a = 1.0 + Math.random() * 0.5;
  }
  
  let t = STATE.hysteresis_timer;
  if (a > 6.0) {
    t -= 0.1;
    if (t < 0.0) t = 0.0;
  } else {
    t = 2.0;
  }
  
  // reset loop
  if (t === 0.0 && Math.random() < 0.02) {
    d = 600;
    a = 1.0;
    t = 2.0;
  }

  STATE.ultrasonic_distance_cm = d;
  STATE.acoustic_dE_dt = a;
  STATE.hysteresis_timer = t;
  
  updateLogic();
}, 100);


// ==========================================
// 5. 2D CANVAS RENDERER (Divya Drishti)
// ==========================================

const canvas = document.getElementById('radar-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const container = document.getElementById('canvas-container');

let width, height, centerX, centerY;
let ripples = [];

function resizeCanvas() {
  width = container.clientWidth;
  height = container.clientHeight;
  canvas.width = width;
  canvas.height = height;
  centerX = width / 2;
  centerY = height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function addRipple() {
  // Start ripple outside the bounds of the screen
  const maxRadius = Math.max(width, height) * 0.8;
  ripples.push({
    r: maxRadius,
    alpha: 0.0
  });
}

setInterval(() => {
  // Add ripples based on acoustic energy
  // High energy = more frequent ripples
  if (Math.random() < (STATE.acoustic_dE_dt / 10.0) + 0.1) {
    addRipple();
  }
}, 300);

function draw() {
  requestAnimationFrame(draw);
  
  // 1. Dark misty grey trailing fog effect
  ctx.fillStyle = 'rgba(30, 30, 35, 0.2)';
  ctx.fillRect(0, 0, width, height);
  
  // Current risk color
  let themeColor = COLORS.green;
  if (STATE.riskLevel === 'YELLOW') themeColor = COLORS.yellow;
  else if (STATE.riskLevel === 'RED') themeColor = COLORS.red;

  // 2. Draw inward expanding ripples
  const speed = 1.0 + (STATE.acoustic_dE_dt); // speed up with acoustic energy
  
  for (let i = ripples.length - 1; i >= 0; i--) {
    let rpl = ripples[i];
    
    rpl.r -= speed;
    
    // Fade in as it enters screen, fade out as it reaches center
    const maxR = Math.max(width, height) * 0.6;
    if (rpl.r > maxR) {
       rpl.alpha = 0;
    } else {
       rpl.alpha = Math.min(1.0, rpl.r / maxR);
    }
    
    if (rpl.r < 40) { // reaches center box
      ripples.splice(i, 1);
      continue;
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, rpl.r, 0, Math.PI * 2);
    ctx.strokeStyle = themeColor;
    ctx.globalAlpha = rpl.alpha * 0.7;
    ctx.lineWidth = 2 + (STATE.acoustic_dE_dt * 0.5);
    ctx.stroke();
  }
  
  ctx.globalAlpha = 1.0;

  // 3. Central static blue wireframe box (Operator's Dumper)
  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Rotate slowly for 3D-ish feel or keep static
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 2;
  
  const boxW = 40;
  const boxH = 60;
  
  ctx.beginPath();
  ctx.rect(-boxW/2, -boxH/2, boxW, boxH);
  ctx.stroke();
  
  // Inner cross
  ctx.beginPath();
  ctx.moveTo(-boxW/2, -boxH/2);
  ctx.lineTo(boxW/2, boxH/2);
  ctx.moveTo(boxW/2, -boxH/2);
  ctx.lineTo(-boxW/2, boxH/2);
  ctx.stroke();
  
  // Outer bounding box pulse
  if (STATE.riskLevel === 'RED') {
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 4;
    const pulseFactor = Math.abs(Math.sin(Date.now() / 150));
    const pW = boxW + 20 + (pulseFactor * 10);
    const pH = boxH + 20 + (pulseFactor * 10);
    ctx.strokeRect(-pW/2, -pH/2, pW, pH);
  }
  
  ctx.restore();
  
  // Draw Ultrasonic range indicator text
  ctx.fillStyle = themeColor;
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`RANGE: ${STATE.ultrasonic_distance_cm} cm`, centerX, centerY + 60);
}

// Start render loop
draw();
