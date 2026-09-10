export interface VehicleGPS {
  latitude: number;
  longitude: number;
  altitude: number; // meters
  speed: number; // km/h
  heading: number; // degrees 0-360
}

export interface SensorReadings {
  groundVibrationHz: number; // 0 to 150 Hz
  groundVibrationSwitch: boolean; // triggered or normal
  ultrasonicDistanceMeters: number; // 0.5 to 20 meters
  tensorAcousticEnergy: number; // 0 to 100% (20-200 Hz band-pass isolated)
  acousticPeakHz: number; // e.g. 110 Hz
}

export interface MineTruck {
  id: string;
  name: string;
  driverName: string;
  model: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'DEGRADED';
  gps: VehicleGPS;
  sensors: SensorReadings;
  relativeDistanceMeters: number;
  relativeBearingDegrees: number;
}

export interface WatchdogStatus {
  heartbeatOk: boolean;
  lastPulseMs: number;
  esp32Status: 'ONLINE' | 'OFFLINE';
  stm32Status: 'ONLINE' | 'OFFLINE';
}
