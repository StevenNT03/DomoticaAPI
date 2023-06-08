const { Point } = require('@influxdata/influxdb-client');
const { InfluxDB } = require('@influxdata/influxdb-client');
const dotenv = require('dotenv');
const PlugManager = require('../../obj/SmartPlugObj/PlugManger');
dotenv.config(); // Carica le variabili d'ambiente dal file .env

// Configurazione del client InfluxDB
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const ipAddress = process.env.INFLUX_IP_ADDRESS;
const client = new InfluxDB({ url: `http://${ipAddress}:8086`, token: token });
const writeApi = client.getWriteApi(org, bucket);

class AirManager {
  
  constructor(deviceId) {
    this.plugManager = new PlugManager(deviceId);
    this.receivedData = null;
    console.log("air in comunicazione");
  }

  start() {
    let previousWattValue = null; // Valore precedente di data.watt
    let isFirstMinute = true; // Flag per il primo minuto
    let previusdata = null;
    this.plugManager.on('message', (data) => {
      this.receivedData = JSON.parse(data.plugdata);
      console.log(this.receivedData);

      const currentWattValue = this.receivedData.watt;

      if (!isFirstMinute && (currentWattValue > (previousWattValue * 1.2) || currentWattValue < (previousWattValue * 0.8))) {
        this.writeDataToInfluxDB(data); // Scrivi su InfluxDB se l'aumento o il decremento è significativo
        console.log('Data received:', data);
      }

      // Assegna il valore corrente solo dopo il primo minuto
      if (!isFirstMinute) {
        previousWattValue = currentWattValue;
        previusdata = data;
      } else {
        isFirstMinute = false;
      }
    });

    // Scrivi su InfluxDB ogni minuto
    setInterval(() => {
      if (previousWattValue !== null) {
        this.writeDataToInfluxDB(previusdata);
        console.log('Data received:', previusdata);
      }
    }, 60000);

    this.connectToPlugManager();
  }

  connectToPlugManager() {
    this.plugManager.start();

    this.plugManager.on('error', (error) => {
      console.error('PlugManager error:', error);
      this.reconnectToPlugManager();
    });
  }

  reconnectToPlugManager() {
    setTimeout(() => {
      console.log('Tentativo di riconnessione a PlugManager in corso...');
      this.connectToPlugManager();
    }, 5000);
  }

  writeDataToInfluxDB(data) {
    if (this.receivedData) {
      const point = new Point('SmartPlug')
        .tag('deviceid', data.deviceId)
        .floatField('volts', this.receivedData.volts)
        .floatField('ampere', this.receivedData.ampere)
        .floatField('watt', this.receivedData.watt);

      writeApi.writePoint(point);
      writeApi
        .flush()
        .then(() => {
          console.log('Data written to InfluxDB');
        })
        .catch((error) => {
          console.error('Error writing data to InfluxDB:', error);
        });
    }
  }
  getData() {
    const timestamp = new Date().toISOString();
    const data = {
      receivedData: this.receivedData ? JSON.parse(JSON.stringify(this.receivedData)) : null,
      timestamp: timestamp
    };
    return data;
  }
  
  

}

module.exports = AirManager;
