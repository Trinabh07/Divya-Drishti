import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// 1. STATE & CONSTANTS DEFINITION
// ==========================================

const STATE = {
  acoustic_dE_dt: 0.0,
  ultrasonic_distance_cm: 600,
  hysteresis_timer: 2.0,
  riskLevel: 'GREEN', // 'GREEN', 'YELLOW', 'RED', 'DEGRADED'
  isConnected: false,
};

const COLORS = {
  cyan: 0x00f0ff,
  green: 0x10b981,
  yellow: 0xf59e0b,
  red: 0xef4444,
  purple: 0x8b5cf6,
  blue: 0x3b82f6,
  darkBg: 0x0b0f19,
  fogGrey: 0x1e1e23,
  truckYellow: 0xeab308,
  tireDark: 0x1e293b,
  threatDark: 0x0f172a
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
  degradedOverlay: document.getElementById('degraded-overlay'),
  alarmStrobe: document.getElementById('alarm-strobe'),
  
  terminalFeed: document.getElementById('terminal-feed'),
  wsIndicator: document.getElementById('ws-indicator'),
  wsConnectBtn: document.getElementById('ws-connect-btn'),
  
  btnScen1: document.getElementById('btn-scen-1'),
  btnScen2: document.getElementById('btn-scen-2'),
  btnScen3: document.getElementById('btn-scen-3'),
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

function handleTelemetryData(payload) {
  if (payload.acoustic_dE_dt !== undefined) {
    STATE.acoustic_dE_dt = payload.acoustic_dE_dt;
    STATE.ultrasonic_distance_cm = payload.ultrasonic_distance_cm;
    STATE.hysteresis_timer = payload.hysteresis_timer;
    updateLogic();
  }
}

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    appendLog("WebSocket already connected or connecting.");
    return;
  }
  
  appendLog("Attempting WebSocket connection...");
  DOM.wsIndicator.textContent = "CONNECTING...";
  
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
        const isWsMode = document.getElementById('feed-toggle').checked;
        if (isWsMode) {
          handleTelemetryData(data);
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

// Feed Toggle Logic
document.getElementById('feed-toggle').addEventListener('change', (e) => {
  const isWs = e.target.checked;
  const label = document.getElementById('feed-mode-label');
  const btn = document.getElementById('ws-connect-btn');
  if (isWs) {
    label.textContent = "HARDWARE";
    btn.classList.remove('hidden');
    appendLog("Switched to Hardware WebSocket feed.");
  } else {
    label.textContent = "MOCK";
    btn.classList.add('hidden');
    appendLog("Switched to Mock Data Pipeline.");
  }
});

function updateLogic() {
  DOM.valAcoustic.textContent = STATE.acoustic_dE_dt.toFixed(2);
  DOM.valDistance.textContent = Math.round(STATE.ultrasonic_distance_cm);
  DOM.valTimer.textContent = STATE.hysteresis_timer.toFixed(2);
  
  const barPct = Math.min(100, Math.max(0, (STATE.acoustic_dE_dt / 10.0) * 100));
  DOM.acousticBar.style.width = `${barPct}%`;
  
  let newLevel = 'GREEN';
  
  if (STATE.riskLevel === 'DEGRADED') {
    newLevel = 'DEGRADED';
  } else if (STATE.hysteresis_timer <= 0.0) {
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
    DOM.degradedOverlay.style.opacity = '0';
    DOM.alarmStrobe.classList.remove('bg-hazardRed/20');
    Audio.stopAlert();
    updateSceneAtmosphere(COLORS.fogGrey, COLORS.cyan);
    
  } else if (STATE.riskLevel === 'YELLOW') {
    DOM.statusCard.classList.add('border-warnAmber', 'shadow-glow-amber');
    DOM.statusText.className = 'text-2xl font-black tracking-tighter text-warnAmber mt-1 uppercase';
    DOM.statusText.textContent = 'WARNING';
    DOM.statusDesc.textContent = 'HIGH ACOUSTIC ENERGY DETECTED';
    DOM.acousticBar.classList.add('bg-warnAmber');
    DOM.valVibration.className = 'text-sm font-bold text-warnAmber mt-1 uppercase';
    DOM.valVibration.textContent = 'ELEVATED';
    
    DOM.hazardOverlay.style.opacity = '0';
    DOM.degradedOverlay.style.opacity = '0';
    DOM.alarmStrobe.classList.remove('bg-hazardRed/20');
    Audio.stopAlert();
    updateSceneAtmosphere(COLORS.yellow, COLORS.yellow);
    
  } else if (STATE.riskLevel === 'RED') {
    DOM.statusCard.classList.add('border-hazardRed', 'shadow-glow-red', 'animate-pulse');
    DOM.statusText.className = 'text-2xl font-black tracking-tighter text-hazardRed mt-1 uppercase animate-pulse';
    DOM.statusText.textContent = 'DANGER';
    DOM.statusDesc.textContent = 'HAZARD CONFIRMED';
    DOM.acousticBar.classList.add('bg-hazardRed');
    DOM.valVibration.className = 'text-sm font-bold text-hazardRed mt-1 uppercase';
    DOM.valVibration.textContent = 'CRITICAL';
    
    DOM.hazardOverlay.style.opacity = '1';
    DOM.degradedOverlay.style.opacity = '0';
    DOM.alarmStrobe.classList.add('bg-hazardRed/20');
    Audio.startAlert();
    updateSceneAtmosphere(COLORS.red, COLORS.red);
    
  } else if (STATE.riskLevel === 'DEGRADED') {
    DOM.statusCard.classList.add('border-purple-500', 'shadow-glow-purple', 'animate-pulse');
    DOM.statusText.className = 'text-2xl font-black tracking-tighter text-purple-400 mt-1 uppercase animate-pulse';
    DOM.statusText.textContent = 'DEGRADED';
    DOM.statusDesc.textContent = 'UART HEARTBEAT LOST';
    DOM.acousticBar.classList.add('bg-purple-500');
    DOM.valVibration.className = 'text-sm font-bold text-purple-400 mt-1 uppercase';
    DOM.valVibration.textContent = 'UNKNOWN';
    
    DOM.hazardOverlay.style.opacity = '0';
    DOM.degradedOverlay.style.opacity = '1';
    DOM.alarmStrobe.classList.add('bg-purple-500/20');
    Audio.stopAlert();
    updateSceneAtmosphere(0x333344, 0x111111);
  }
}

// ==========================================
// CENTRALIZED MOCK DATA GENERATOR
// ==========================================

class MockEngine {
  constructor() {
    this.interval = null;
    this.scenario = 'NOMINAL'; // 'NOMINAL', 'HAZARD', 'DEGRADED'
    this.mockState = {
      acoustic: 2.5,
      distance: 600,
      timer: 2.0
    };
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 100);
  }

  setScenario(scen) {
    this.scenario = scen;
    if (scen === 'NOMINAL') {
      this.mockState = { acoustic: 2.5, distance: 600, timer: 2.0 };
      if (typeof threatGroup !== 'undefined' && threatGroup) {
        threatGroup.position.set(-8, 0, -150);
        threatGroup.rotation.y = Math.PI;
      }
      if (typeof impactTriggered !== 'undefined') impactTriggered = false;
    } else if (scen === 'HAZARD') {
      this.mockState = { acoustic: 2.5, distance: 600, timer: 2.0 };
      if (typeof threatGroup !== 'undefined' && threatGroup) {
        threatGroup.position.set(-8, 0, -150);
        threatGroup.rotation.y = Math.PI;
      }
      if (typeof impactTriggered !== 'undefined') impactTriggered = false;
    } else if (scen === 'DEGRADED') {
      this.mockState = { acoustic: 0.0, distance: 0, timer: 0.0 };
      if (typeof impactTriggered !== 'undefined') impactTriggered = false;
    }
    
    const isMockFeed = !document.getElementById('feed-toggle').checked;
    if (isMockFeed) this.pushData(); // Force immediate update if in mock mode
  }

  tick() {
    const isMockFeed = !document.getElementById('feed-toggle').checked;
    if (!isMockFeed) return; // Yield to hardware feed

    if (this.scenario === 'NOMINAL') {
      // Simulate minor noise
      this.mockState.acoustic = 2.0 + Math.random() * 1.5;
    } else if (this.scenario === 'HAZARD') {
      this.mockState.acoustic += 0.8;
      this.mockState.distance -= 35;
      
      if (this.mockState.distance < 50) this.mockState.distance = 50;
      
      if (this.mockState.acoustic > 6.0) {
        this.mockState.timer -= 0.1;
        if (this.mockState.timer <= 0.0) {
          this.mockState.timer = 0.0;
        }
      }
    }
    // DEGRADED stays 0
    
    this.pushData();
  }

  pushData() {
    handleTelemetryData({
      acoustic_dE_dt: this.mockState.acoustic,
      ultrasonic_distance_cm: this.mockState.distance,
      hysteresis_timer: this.mockState.timer
    });
  }
}

const mockEngine = new MockEngine();
mockEngine.start();

// Presenter Override Injection
DOM.btnScen1.addEventListener('click', () => {
  Audio.init();
  Audio.playBeep(880, 'sine', 0.1);
  appendLog("INJECTING: NOMINAL STATE");
  mockEngine.setScenario('NOMINAL');
});

DOM.btnScen2.addEventListener('click', () => {
  Audio.init();
  Audio.playBeep(880, 'sine', 0.1);
  appendLog("INJECTING: HAZARD STATE");
  mockEngine.setScenario('HAZARD');
});

DOM.btnScen3.addEventListener('click', () => {
  Audio.init();
  Audio.playBeep(880, 'sine', 0.1);
  appendLog("INJECTING: DEGRADED STATE");
  mockEngine.setScenario('DEGRADED');
});

// ==========================================
// SYSTEM CLOCK UPDATER
// ==========================================
setInterval(() => {
  const clockEl = document.getElementById('hud-clock');
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toISOString().substring(11, 23);
  }
}, 33);

// ==========================================
// 5. THREE.JS 3D ENVIRONMENT (Mining Trench)
// ==========================================

const canvas = document.querySelector('#webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.fogGrey);
// Calibrated exponential fog: 50 units clear, background obscured
scene.fog = new THREE.FogExp2(COLORS.fogGrey, 0.025);

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 15, 30);
let cameraTarget = new THREE.Vector3(0, 5, -20);
camera.lookAt(cameraTarget);

// Lighting & Shadows
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(COLORS.cyan, 1.2);
directionalLight.position.set(20, 40, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 150;
const d = 50;
directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = -d;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(COLORS.truckYellow, 2, 50);
pointLight.position.set(0, 5, 0);
pointLight.castShadow = true;
scene.add(pointLight);

function updateSceneAtmosphere(fogColorHex, lightColorHex) {
  scene.background.setHex(fogColorHex);
  scene.fog.color.setHex(fogColorHex);
  directionalLight.color.setHex(lightColorHex);
}

// ------------------------------------------
// Build Mining Dumper Geometry Helper
// ------------------------------------------
function createMiningDumper(isMainOperator = true) {
  const group = new THREE.Group();
  
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: isMainOperator ? COLORS.truckYellow : COLORS.threatDark,
    metalness: 0.6,
    roughness: 0.4
  });
  
  const tireMaterial = new THREE.MeshStandardMaterial({ 
    color: COLORS.tireDark,
    metalness: 0.2,
    roughness: 0.8
  });
  
  const addMesh = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  
  // Cabin
  addMesh(new THREE.BoxGeometry(6, 4, 4), bodyMaterial, 0, 5, 4);
  
  // Truck Bed (Tipper)
  addMesh(new THREE.BoxGeometry(8, 5, 12), bodyMaterial, 0, 6, -4);
  
  // Chassis
  addMesh(new THREE.BoxGeometry(6, 2, 18), bodyMaterial, 0, 3, 0);
  
  // Tires (4 massive wheels)
  const tireGeo = new THREE.CylinderGeometry(2.5, 2.5, 2, 16);
  tireGeo.rotateZ(Math.PI / 2);
  
  const tirePositions = [
    [-4, 2.5, 6], [4, 2.5, 6],   // Front
    [-4, 2.5, -6], [4, 2.5, -6]  // Rear
  ];
  
  const tires = [];
  tirePositions.forEach(pos => {
    const tire = addMesh(tireGeo, tireMaterial, pos[0], pos[1], pos[2]);
    tires.push(tire);
  });
  
  group.userData.tires = tires;
  
  // Headlights for main operator
  if (isMainOperator) {
    const hlGeo = new THREE.BoxGeometry(1, 1, 0.5);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    addMesh(hlGeo, hlMat, -2, 4, 6.2);
    addMesh(hlGeo, hlMat, 2, 4, 6.2);
    
    // Add spotlights projecting forward
    const spotL = new THREE.SpotLight(0xffffff, 3, 80, Math.PI/6, 0.5, 1);
    spotL.position.set(-2, 4, 6.2);
    spotL.target.position.set(-2, 0, -30);
    spotL.castShadow = true;
    group.add(spotL);
    group.add(spotL.target);
    
    const spotR = new THREE.SpotLight(0xffffff, 3, 80, Math.PI/6, 0.5, 1);
    spotR.position.set(2, 4, 6.2);
    spotR.target.position.set(2, 0, -30);
    spotR.castShadow = true;
    group.add(spotR);
    group.add(spotR.target);
  }
  
  return group;
}

// Instantiate Main Operator Truck (Right Lane)
const operatorTruck = createMiningDumper(true);
operatorTruck.position.set(8, 0, 0); 
scene.add(operatorTruck);

// Instantiate Threat Truck (Left Lane)
const threatGroup = createMiningDumper(false);
threatGroup.position.set(-8, 0, -150); 
threatGroup.rotation.y = Math.PI;
scene.add(threatGroup);

// ------------------------------------------
// Environment Terrain
// ------------------------------------------
const groundGeo = new THREE.PlaneGeometry(200, 400);
const groundMat = new THREE.MeshStandardMaterial({ 
  color: 0x111111, 
  roughness: 0.9,
  metalness: 0.1
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(200, 50, 0x333333, 0x222222);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// Walls
const wallsGroup = new THREE.Group();
const wallGeo = new THREE.BoxGeometry(10, 20, 20);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

for (let i = 0; i < 40; i++) {
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.castShadow = true;
  wall.receiveShadow = true;
  
  const side = Math.random() > 0.5 ? 1 : -1;
  wall.position.x = side * (25 + Math.random() * 15);
  wall.position.z = -200 + (Math.random() * 250);
  wall.position.y = 10;
  
  // Restrict rotation so they run parallel to the road and don't block the lanes
  wall.rotation.y = (Math.random() - 0.5) * 0.4;
  wall.scale.set(1, 0.5 + Math.random(), 1 + Math.random() * 2);
  
  wallsGroup.add(wall);
}
scene.add(wallsGroup);

// ------------------------------------------
// Resize Handler
// ------------------------------------------
window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
setTimeout(() => window.dispatchEvent(new Event('resize')), 100);

// ------------------------------------------
// Main Render Loop (Kinematics & Physics)
// ------------------------------------------
const clock = new THREE.Clock();
let terrainOffset = 0;
let impactTriggered = false;
let shakeTime = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1); // Cap delta to prevent massive jumps on lag
  
  // 1. Handle Animation Freeze if Degraded
  if (STATE.riskLevel === 'DEGRADED') {
    renderer.render(scene, camera);
    return;
  }
  
  // Detect exact impact moment for camera shake
  if (STATE.riskLevel === 'RED' && !impactTriggered) {
    impactTriggered = true;
    shakeTime = 0.3; // 300ms shake
  }
  
  // Camera Shake Logic
  if (shakeTime > 0) {
    shakeTime -= delta;
    camera.position.x = (Math.random() - 0.5) * 3;
    camera.position.y = 15 + (Math.random() - 0.5) * 3;
  } else {
    // Smoothly return camera to origin
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 5 * delta);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 15, 5 * delta);
  }
  
  // Ensure camera always looks at the target
  camera.lookAt(cameraTarget);
  
  // 2. Animate Forward Movement (unless hazard is confirmed RED)
  if (STATE.riskLevel !== 'RED') {
    const speed = 25 * delta;
    terrainOffset += speed;
    
    gridHelper.position.z = (terrainOffset % 4);
    
    wallsGroup.children.forEach(wall => {
      wall.position.z += speed;
      if (wall.position.z > 50) {
        wall.position.z = -200 + (Math.random() * 50); // Recycle
      }
    });
    
    // Smooth Heavy Bobbing (slower frequency for heavy weight)
    const bob = Math.sin(terrainOffset * 0.3) * 0.2;
    operatorTruck.position.y = THREE.MathUtils.lerp(operatorTruck.position.y, bob, 10 * delta);
    operatorTruck.rotation.z = THREE.MathUtils.lerp(operatorTruck.rotation.z, Math.sin(terrainOffset * 0.15) * 0.01, 10 * delta);
    
    // Rotate wheels
    const wheelRot = speed / 2.5; // speed / radius
    operatorTruck.userData.tires.forEach(tire => {
      tire.rotation.x -= wheelRot;
    });
    threatGroup.userData.tires.forEach(tire => {
      tire.rotation.x -= wheelRot * 1.5; // Threat truck moving towards us
    });
  } else {
    // Settle heavy bobbing to 0 smoothly upon crash
    operatorTruck.position.y = THREE.MathUtils.lerp(operatorTruck.position.y, 0, 10 * delta);
    operatorTruck.rotation.z = THREE.MathUtils.lerp(operatorTruck.rotation.z, 0, 10 * delta);
  }
  
  // Strict lane clamping for operator
  operatorTruck.position.x = 8; 
  
  // 3. Handle Threat Truck Collision Sequence
  if (STATE.riskLevel === 'YELLOW' || STATE.riskLevel === 'RED') {
    // Smoothly interpolate Z-distance based on ultrasonic sensor
    // Make them physically touch (targetZ = -18 when dist is 50cm)
    const targetZ = -18 - ((STATE.ultrasonic_distance_cm - 50) / 550) * 132;
    threatGroup.position.z = THREE.MathUtils.lerp(threatGroup.position.z, targetZ, 8 * delta);
    
    // The Maneuver: Smoothly steer into operator's lane when within 100 units
    let targetX = -8;
    if (threatGroup.position.z > -100) {
      targetX = 8; // Collision course!
    }
    threatGroup.position.x = THREE.MathUtils.lerp(threatGroup.position.x, targetX, 3 * delta);
    
    // Steer truck (rotate Y) as it changes lanes
    const steeringAngle = (targetX - threatGroup.position.x) * 0.03;
    threatGroup.rotation.y = THREE.MathUtils.lerp(threatGroup.rotation.y, Math.PI + steeringAngle, 5 * delta);
    
  } else {
    // Nominal state: Recede back into fog and maintain left lane
    threatGroup.position.z = THREE.MathUtils.lerp(threatGroup.position.z, -150, 2 * delta);
    threatGroup.position.x = THREE.MathUtils.lerp(threatGroup.position.x, -8, 2 * delta);
    threatGroup.rotation.z = THREE.MathUtils.lerp(threatGroup.rotation.z, 0, 5 * delta);
  }
  
  renderer.render(scene, camera);
}

// Start loop
animate();
