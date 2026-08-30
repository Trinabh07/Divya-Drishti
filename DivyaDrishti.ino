#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// Telemetry variables
float acoustic_dE_dt = 0.5;
int ultrasonic_distance_cm = 500;
float hysteresis_timer = 2.0;

// Simulation variables
unsigned long lastUpdate = 0;
bool hazardActive = false;

void notifyClients() {
  StaticJsonDocument<256> doc;
  doc["acoustic_dE_dt"] = acoustic_dE_dt;
  doc["ultrasonic_distance_cm"] = ultrasonic_distance_cm;
  doc["hysteresis_timer"] = hysteresis_timer;

  char buffer[256];
  serializeJson(doc, buffer);
  ws.textAll(buffer);
  
  // USB Serial Fallback
  Serial.println(buffer);
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
  } else if (type == WS_EVT_DISCONNECT) {
    Serial.printf("WebSocket client #%u disconnected\n", client->id());
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  ws.onEvent(onEvent);
  server.addHandler(&ws);

  server.begin();
  Serial.println("ESPAsyncWebServer started");
}

void loop() {
  ws.cleanupClients();
  
  unsigned long now = millis();
  if (now - lastUpdate > 100) { // 10Hz update rate
    lastUpdate = now;
    
    // Simulate mining safety scenario
    // Slowly approach a hazard
    ultrasonic_distance_cm -= 2;
    if (ultrasonic_distance_cm < 50) ultrasonic_distance_cm = 50;
    
    // Increase acoustic energy as it gets closer
    if (ultrasonic_distance_cm < 200) {
      acoustic_dE_dt += 0.05;
      if (acoustic_dE_dt > 8.0) acoustic_dE_dt = 8.0;
    } else {
      acoustic_dE_dt = 1.0 + (rand() % 100) / 100.0;
    }
    
    // Trigger hysteresis timer when acoustic energy is critically high
    if (acoustic_dE_dt > 6.0) {
      if (hysteresis_timer > 0.0) {
        hysteresis_timer -= 0.1; // count down from 2.0s
      }
      if (hysteresis_timer < 0.0) hysteresis_timer = 0.0;
    } else {
      hysteresis_timer = 2.0; // reset if safe
    }
    
    // Reset simulation loop every 15 seconds
    static unsigned long simStart = now;
    if (now - simStart > 15000) {
      simStart = now;
      ultrasonic_distance_cm = 600;
      acoustic_dE_dt = 0.5;
      hysteresis_timer = 2.0;
    }

    notifyClients();
  }
}
