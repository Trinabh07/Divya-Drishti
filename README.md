<div align="center">
  <img src="Divya-Drishti/main/assets/banner.png" alt="Divya Drishti Banner" width="100%" />
  
  #  DIVYA DRISHTI
  **Next-Generation Mining Safety & Acoustic Detection System**
  
  *Built for the Smart India Hackathon 2026*
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Hardware: ESP32 & STM32](https://img.shields.io/badge/Hardware-ESP32%20%7C%20STM32H7-brightgreen)]()
  [![Frontend: Three.js](https://img.shields.io/badge/WebGL-Three.js-black)]()
</div>

---

##  The Problem Statement
In open-cast mining environments, heavy machinery (like 100-ton dumper trucks) operates in extreme conditions characterized by **zero visibility** due to thick dust, fog, and blind corners within mining trenches. Traditional vision-based ADAS (Advanced Driver Assistance Systems) fail under these conditions. These blind spots lead to fatal head-on collisions, jeopardizing human lives and causing massive equipment damage. 

##  Our Solution: Divya Drishti
**Divya Drishti** (Divine Vision) is an industrial-grade telemetry and early-warning safety system that does not rely on visual cameras. Instead, it utilizes an array of **Acoustic Energy Sensors** and **Ultrasonic Proximity Radars** to detect approaching heavy machinery long before they enter the visual field. 

The system features a **bare-metal hardware backend** (ESP32 / STM32H7) transmitting real-time telemetry over WebSockets to a breathtaking, production-ready **3D Digital Twin Dashboard** deployed inside the vehicle's cabin.

---

##  Core Architecture

### 1. Hardware Edge Nodes (ESP32 / STM32H7)
- **Acoustic Energy Slope ($dE/dt$)**: Captures the rate of change in acoustic energy to distinguish between background mining noise and an approaching heavy vehicle.
- **Ultrasonic Distance**: High-frequency sonar to track physical proximity ($cm$) up to long ranges.
- **Fail-safe Watchdog**: Constantly monitors the UART heartbeat to ensure the system hasn't degraded or disconnected.

### 2. Immersive 3D Digital Twin (Frontend)
Built with **Three.js** and **Tailwind CSS**, the frontend is designed as an elite, judge-winning dashboard for the Smart India Hackathon:
- **Zero-Clutter UI**: A sleek, dark-mode industrial aesthetic utilizing glassmorphism and neon accents.
- **Real-Time Kinematics**: Frame-rate independent WebGL rendering with realistic heavy-machinery physics, suspension bobbing, and steering.
- **Decoupled Data Pipeline**: UI rendering is strictly decoupled from the data ingestion source, ensuring seamless transitions between the physical hardware feed and a built-in Mock Data Engine used for presentations.

---

##  System States & Hazard Protocol

The dashboard responds dynamically to real-time telemetry, escalating through distinct safety protocols:

| State | Indicator | Description | Trigger Condition |
|-------|-----------|-------------|-------------------|
| **🟢 SAFE** | Nominal | Normal operating conditions. Acoustic levels baseline. | $dE/dt \le 6.0$ units/s |
| **🟡 WARNING** | Elevated | High acoustic energy detected. Approaching vehicle likely. | $dE/dt > 6.0$ units/s |
| **🔴 DANGER** | Critical | Imminent collision course. Hysteresis timer expires. | Hysteresis Timer $= 0.0s$ |
| **🟣 DEGRADED**| Unknown | Hardware failure / UART Heartbeat lost. | Connection Timeout |

---

##  Running the Project Locally

### Prerequisites
- Node.js (for running the local development server)
- Any modern web browser with WebGL support

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/Trinabh07/Divya-Drishti.git
   cd Divya-Drishti
   ```
2. Start the local server using `npx`:
   ```bash
   npx --yes http-server -p 8080
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8080/
   ```

### Developer Mock Injection
For presentation purposes, the dashboard includes a **Mock Data Pipeline**. In the bottom control strip, ensure the `DATA SRC` toggle is set to **MOCK**. You can then use the `DEV MOCK INJECT` buttons to manually trigger the `NOMINAL`, `HAZARD`, and `DEGRADED` states to demonstrate the UI's reactivity to the judges.

---

##  Tech Stack
* **Hardware**: C++, Arduino Core, ESPAsyncWebServer
* **Frontend UI**: HTML5, Tailwind CSS, Vanilla JS
* **3D Rendering Engine**: Three.js (WebGL)
* **Communication**: WebSockets (JSON Payloads)
* **Audio Engine**: Web Audio API (Synthesized Alerts)

---
<div align="center">
  <i>Developed for the Smart India Hackathon 2026</i>
</div>
