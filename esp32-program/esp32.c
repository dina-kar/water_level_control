#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== WIFI Configuration =====
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-web-server.com/api";  // Replace with your server URL

// ===== Ultrasonic Sensor Configuration =====
const int trigPin = 5;   // GPIO pin connected to the Trigger pin of ultrasonic sensor
const int echoPin = 18;  // GPIO pin connected to the Echo pin of ultrasonic sensor
const float maxDistance = 100.0;  // Maximum distance in cm
const float tankHeight = 100.0;   // Height of the tank in cm (adjust to your tank's height)

// ===== Valve Control Configuration =====
const int valvePin = 25;  // GPIO pin connected to the valve control (DAC or PWM)
const int valveChannel = 0;  // PWM channel
const int valveFreq = 5000;  // PWM frequency
const int valveResolution = 8; // PWM resolution (8 bits = 0-255)

// ===== PID Variables =====
float setpoint = 50.0;     // Target water level in cm (50% of tank)
float kp = 2.0;            // Proportional gain
float ki = 0.1;            // Integral gain
float kd = 0.5;            // Derivative gain

float previousError = 0;
float integral = 0;
float lastWaterLevel = 0;

// ===== Timing Variables =====
unsigned long lastSensorReadTime = 0;
unsigned long lastPidUpdateTime = 0;
unsigned long lastServerUpdateTime = 0;
const unsigned long SENSOR_READ_INTERVAL = 100;    // Read sensor every 100ms
const unsigned long PID_UPDATE_INTERVAL = 500;     // Update PID every 500ms
const unsigned long SERVER_UPDATE_INTERVAL = 5000; // Update from/to server every 5s

void setup() {
  Serial.begin(115200);
  
  // Initialize ultrasonic sensor pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  // Initialize valve control using PWM or DAC
  // Option 1: Using PWM (works on any GPIO pin)
  ledcSetup(valveChannel, valveFreq, valveResolution);
  ledcAttachPin(valvePin, valveChannel);
  
  // Option 2: Using DAC (only on pins 25 and 26)
  // No setup needed for DAC, we'll use dacWrite()
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read water level from the ultrasonic sensor
  if (currentTime - lastSensorReadTime >= SENSOR_READ_INTERVAL) {
    lastSensorReadTime = currentTime;
    lastWaterLevel = readWaterLevel();
    Serial.print("Water Level: ");
    Serial.print(lastWaterLevel);
    Serial.println("%");
  }
  
  // Update PID and control valve
  if (currentTime - lastPidUpdateTime >= PID_UPDATE_INTERVAL) {
    lastPidUpdateTime = currentTime;
    float controlValue = updatePID(lastWaterLevel);
    controlValve(controlValue);
  }
  
  // Communication with server
  if (currentTime - lastServerUpdateTime >= SERVER_UPDATE_INTERVAL) {
    lastServerUpdateTime = currentTime;
    sendDataToServer(lastWaterLevel);
    getParamsFromServer();
  }
}

// Read the water level from the ultrasonic sensor and convert to percentage
float readWaterLevel() {
  // Clear the trigger pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Trigger a pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Read the time it took for the echo
  float duration = pulseIn(echoPin, HIGH);
  
  // Calculate distance in cm: speed of sound is 343m/s = 34300cm/s
  // duration is in microseconds, and we divide by 2 because the sound travels to the object and back
  float distanceCm = duration * 0.0343 / 2;
  
  // Convert distance to water level percentage (inverted)
  // If sensor is at the top, higher distance means lower water level
  if (distanceCm > tankHeight) {
    distanceCm = tankHeight;  // Cap at tank height
  }
  
  float waterLevelPercent = 100.0 * (1.0 - (distanceCm / tankHeight));
  return waterLevelPercent;
}

// Calculate PID control value
float updatePID(float currentLevel) {
  float error = setpoint - currentLevel;
  
  // Calculate P, I, and D terms
  float proportional = error;
  integral += error * (PID_UPDATE_INTERVAL / 1000.0);  // Time in seconds
  float derivative = (error - previousError) / (PID_UPDATE_INTERVAL / 1000.0);
  
  // Prevent integral windup
  if (integral > 100) integral = 100;
  if (integral < -100) integral = -100;
  
  // Calculate control value
  float controlValue = (kp * proportional) + (ki * integral) + (kd * derivative);
  
  // Constrain the control value to 0-100%
  if (controlValue > 100) controlValue = 100;
  if (controlValue < 0) controlValue = 0;
  
  // Update previous error for next time
  previousError = error;
  
  Serial.print("PID: P=");
  Serial.print(proportional);
  Serial.print(", I=");
  Serial.print(integral);
  Serial.print(", D=");
  Serial.print(derivative);
  Serial.print(", Control=");
  Serial.println(controlValue);
  
  return controlValue;
}

// Control the valve based on the PID output
void controlValve(float controlValue) {
  // Option 1: Using PWM (works on any GPIO pin)
  // Convert 0-100% to 0-255 for 8-bit PWM
  int pwmValue = map(controlValue, 0, 100, 0, 255);
  ledcWrite(valveChannel, pwmValue);
  
  // Option 2: Using DAC (only on pins 25 and 26)
  // Convert 0-100% to 0-255 for 8-bit DAC
  // int dacValue = map(controlValue, 0, 100, 0, 255);
  // dacWrite(valvePin, dacValue);
  
  Serial.print("Valve control: ");
  Serial.print(controlValue);
  Serial.println("%");
}

// Send water level data to server
void sendDataToServer(float waterLevel) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["waterLevel"] = waterLevel;
    
    // Serialize JSON to string
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send HTTP POST request
    http.begin(String(serverUrl) + "/waterLevel");
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println(response);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

// Get PID parameters and setpoint from server
void getParamsFromServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Send HTTP GET request
    http.begin(String(serverUrl) + "/params");
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      String payload = http.getString();
      Serial.println(payload);
      
      // Parse JSON response
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, payload);
      
      if (!error) {
        // Update PID parameters and setpoint if they exist in the response
        if (doc.containsKey("setpoint")) {
          setpoint = doc["setpoint"];
        }
        
        if (doc.containsKey("kp")) {
          kp = doc["kp"];
        }
        
        if (doc.containsKey("ki")) {
          ki = doc["ki"];
        }
        
        if (doc.containsKey("kd")) {
          kd = doc["kd"];
        }
        
        Serial.print("Updated parameters - Setpoint: ");
        Serial.print(setpoint);
        Serial.print(", Kp: ");
        Serial.print(kp);
        Serial.print(", Ki: ");
        Serial.print(ki);
        Serial.print(", Kd: ");
        Serial.println(kd);
      } else {
        Serial.print("JSON parsing error: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
