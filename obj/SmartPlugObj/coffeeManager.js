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

class CoffeeManager {
  constructor(deviceId) {
    this.plugManager = new PlugManager(deviceId);
    this.receivedData = null;
    this.accensioni = 0;
    this.coffeeCount = 0;
  }

  start() {
    let currentDate = new Date().getDate(); // Data corrente
    let lastPeakWatt = 0; // Ultimo picco di watt
    let lastPeakTimestamp = 0; // Timestamp dell'ultimo picco di watt
    let i = 0;
    this.plugManager.on('message', (data) => {
      console.log('Data received:', data);
      this.receivedData = JSON.parse(data.plugdata);
      console.log(this.receivedData);
      const currentTimestamp = Date.now();
  
      // Verifica se la data è cambiata
      if (new Date().getDate() !== currentDate) {
        console.log("nuovo giorno")
        currentDate = new Date().getDate();
        this.coffeeCount = 0;
        this.accensioni = 0;
      }
  
      // Verifica se è presente un picco di watt
      if (this.receivedData.watt > 1000) {

        // Verifica se il wattaggio è sceso a 30 dopo l'ultimo picco
       
        
  
        // Verifica se il wattaggio supera i 1400 watt per più di 10 secondi per contare un'accesione
        if (this.receivedData.watt > 1400) {
          i++;
          if (i === 10) {
            this.accensioni++;
           
          }
        } else {
          i = 0;
        }
  
        lastPeakWatt = this.receivedData.watt;
        lastPeakTimestamp = currentTimestamp;
        console.log(lastPeakTimestamp, lastPeakWatt);
      }else  if (lastPeakWatt > 1000 && this.receivedData.watt < 30) {
        const timeSinceLastPeak = currentTimestamp - lastPeakTimestamp;
        console.log(timeSinceLastPeak, currentTimestamp, lastPeakTimestamp);

        // Verifica se il wattaggio è sceso a 30 in meno di 10 secondi dopo l'ultimo picco
        if (timeSinceLastPeak < 10000) {
          this.coffeeCount++;
          lastPeakWatt=0;
        } else {
          this.coffeeCount += 2;
          lastPeakWatt=0;
        }
      }
  
      this.writeDataToInfluxDB(data);
    });
  
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
  getAllData() {
    const accensioni = this.getAccensioni();
    const coffeeCount = this.countCoffes();
    const jsonData = {
      accensioni: accensioni,
      coffeeCount: coffeeCount-accensioni*2
    };
    console.log(jsonData);

    return jsonData;
  }

  getData() {
    const timestamp = new Date().toISOString();
    const data = {
      receivedData: this.receivedData,
      timestamp: timestamp
    };
    return data;
  }

  getDataAndCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Imposta l'orario a mezzanotte per ottenere l'inizio della giornata corrente
    const currentTime = new Date();

    const query = `from(bucket: "${bucket}")
      |> range(start: ${today.toISOString()}, stop: ${currentTime.toISOString()})
      |> filter(fn: (r) => r._measurement == "coffee" and r.type == "count")`;

    return client
      .getQueryApi(org)
      .collectRows(query)
      .then((result) => {
        let totalCoffeeToday = 0;
        let count1 = 0;
        let count2 = 0;

        result.forEach((row) => {
          const countValue = row._value;
          totalCoffeeToday += countValue;

          if (countValue === 1) {
            count1++;
          } else if (countValue === 2) {
            count2++;
          }
        });

        const jsonData = {
          macchinettaCaffe: this.getData(),
          totalCoffeeToday: totalCoffeeToday,
          count1: count1,
          count2: count2,
        };

        return jsonData;
      })
      .catch((error) => {
        console.error('Error:', error);
        throw new Error('Internal Server Error');
      });
  }
  getAccensioni(){
    return this.accensioni;
  }
  countCoffes(){
    return this.coffeeCount;
  }

  
}

module.exports = CoffeeManager;
