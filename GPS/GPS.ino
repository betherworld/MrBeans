// Author: MrBeans
// Date: February 2019
// Place: BETH @ ETH, Zurich
// OpenLicence

// Code inspired by examples of TinyGPS++ & ESP8266WebServer libraries

#include <WiFiClient.h>
#include <ESP8266mDNS.h>
#include <ESP8266WebServer.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>

// MDNSResponder mdns;

// Connect to local Wifi Network SSID
const char* ssid = "Abc";
const char* password = "xbpd1712";

// Create instance of WebServer
ESP8266WebServer server(3000);

// Create global variables we want to send to the blockchain
double longitude = 0;
double latitude = 0;
int yearr = 0;
int monthh = 0;
int dayy = 0;
int hourr = 0;
int minutee = 0;
int secondd = 0;

// Precision of longitude/latitude
const int prec = 10e6;

// Set up connection between ESP & GPS device
static const int RXPin = D6, TXPin = D7;
static const uint32_t GPSBaud = 9600;

// Create instance of TinyGPS++ object
TinyGPSPlus gps;

// Create serial connection to the GPS device
SoftwareSerial ss(RXPin, TXPin);

// Create html code for website displaying variables we want to send to the blockchain
void handleRoot() {
  String javascript = "";
  char temp[600];
  int sec = millis() / 1000;
  int min = sec / 60;
  int hr = min / 60;

  snprintf ( temp, 600,

             "<html>\
  <head>\
    <meta http-equiv='refresh' content='1'/>\
    <title>ESP8266 Demo</title>\
    <style>\
      body { background-color: #cccccc; font-family: Arial, Helvetica, Sans-Serif; Color: #000088; }\
    </style>\
  </head>\
  <body>\
    <h1>Hello from ESP8266!</h1>\
    <p>Latitude: %02d.%07d</p>\
    <p>Longitude: %02d.%07d</p>\
    <p>Day: %02d</p>\
    <p>Month: %02d</p>\
    <p>Year: %02d</p>\
    <p>Hour: %02d</p>\
    <p>Minute: %02d</p>\
    <p>Seconds: %02d</p>\
    </body>\
</html>",

             int(latitude), int(latitude * prec) % prec , int(longitude), int(longitude * prec) % prec , dayy, monthh, yearr, hourr + 1, minutee, secondd
           );

  server.send ( 200, "text/html", temp );
}

// Default function
void handleNotFound() {
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
}

//Initial set-up
void setup()
{
  Serial.begin(115200);
  delay(10);

  // Connect WiFi
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.hostname("Name");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");

  // Print the IP address
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  /* if (mdns.begin("esp8266"), WiFi.localIP()) {
     Serial.println("MDNS responder started");
    }
  */
  
  // Create html code
  server.on("/", handleRoot);

  // Default function
  server.onNotFound(handleNotFound);

  // Start server
  server.begin();
  Serial.println("HTTP server started");

  //Start GPS connection
  ss.begin(GPSBaud);

  Serial.println("Start up successfully completed");
}


// Read out and display GPS data
void displayInfo()
{
  // location data
  Serial.print(F("Location: "));
  if (gps.location.isValid())
  {
    Serial.print(gps.location.lat(), 6);
    latitude = gps.location.lat();
    Serial.print(F(","));
    Serial.print(gps.location.lng(), 6);
    longitude = gps.location.lng();
  }
  else
  {
    Serial.print(F("INVALID"));
  }

  // date data
  Serial.print(F("  Date/Time: "));
  if (gps.date.isValid())
  {
    Serial.print(gps.date.month());
    Serial.print(F("/"));
    monthh = gps.date.month();
    Serial.print(gps.date.day());
    dayy = gps.date.day();
    Serial.print(F("/"));
    Serial.print(gps.date.year());
    yearr = gps.date.year();
  }
  else
  {
    Serial.print(F("INVALID"));
  }

  // time data
  Serial.print(F(" "));
  if (gps.time.isValid())
  {
    if (gps.time.hour() < 10) Serial.print(F("0"));
    Serial.print(gps.time.hour());
    Serial.print(F(":"));
    hourr = gps.time.hour();
    if (gps.time.minute() < 10) Serial.print(F("0"));
    Serial.print(gps.time.minute());
    Serial.print(F(":"));
    minutee = gps.time.minute();
    if (gps.time.second() < 10) Serial.print(F("0"));
    Serial.print(gps.time.second());
    Serial.print(F("."));
    secondd = gps.time.second();
    if (gps.time.centisecond() < 10) Serial.print(F("0"));
    Serial.print(gps.time.centisecond());
  }
  else
  {
    Serial.print(F("INVALID"));
  }

  Serial.println();
}


void loop()
{
  /*
    // Blockchain connection
    //call web3 methods
    char result[128];

    web3.Web3ClientVersion(result);
    USE_SERIAL.println(result);

    web3.Web3Sha3("0x68656c6c6f20776f726c64", result);
    USE_SERIAL.println(result);

    //call to Contract
    Contract contract(&web3, CONTRACT_ADDRESS);
    strcpy(contract.options.from, MY_ADDRESS);
    strcpy(contract.options.gasPrice,"2000000000000");
    contract.options.gas = 5000000;
    contract.SetupContractData(result, "get()");
    contract.Call(result);
    USE_SERIAL.println(result);

    //sendTransaction to Contract
    Contract contract(&web3, CONTRACT_ADDRESS);
    contract.SetPrivateKey((uint8_t*)PRIVATE_KEY);
    uint32_t nonceVal = (uint32_t)web3.EthGetTransactionCount((char *)MY_ADDRESS);

    uint32_t gasPriceVal = 141006540;
    uint32_t  gasLimitVal = 3000000;
    uint8_t toStr[] = CONTRACT_ADDRESS;
    uint8_t valueStr[] = "0x00";
    uint8_t dataStr[100];
    memset(dataStr, 0, 100);
    contract.SetupContractData((char*)dataStr, "set(uint256)", 123);
    contract.SendTransaction((uint8_t *) result,
                         nonceVal, gasPriceVal, gasLimitVal, toStr, valueStr, dataStr);

    USE_SERIAL.println(result);
    ////////////////////////////////////////////////////////////////////////////////////*/

  // while connection to GPS device is established
  while (ss.available() > 0)
  {
    // read GPS data
    if (gps.encode(ss.read()))
      displayInfo();
    
    // 5 second steps
    //delay(5000);
    
    // update website
    server.handleClient();
    
    //mdns.update();
  }
  // default if GPS device is not recognized
  if (millis() > 5000 && gps.charsProcessed() < 10)
  {
    Serial.println(F("No GPS detected: check wiring."));
  }
}
