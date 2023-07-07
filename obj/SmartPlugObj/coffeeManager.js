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
const recognize = require("../SmartPlugObj/coffeRecognizer/recognizer");

class CoffeeManager {
  constructor(deviceId, publisher) {
    this.plugManager = new PlugManager(deviceId);
    this.accensioni = 0;
    this.coffeeCount = 0;
    this.communicationArray = {v: [], t:[]};
    this.timeout = null;
    this.receivedData=null;
    this.publisher=publisher;
  }

  start() {
    let i = 0;
    
    this.plugManager.on('message', (data) => {
      const sse={
        id : 100,
        data:{
        receivedData : data.plugdata
        }
      }
      this.publisher.sendEventsToAll(sse);
      this.receivedData= data.plugdata;
         
      // Aggiungi i nuovi dati al singolo oggetto nell'array
      if(data.plugdata.watt>=20){
      this.communicationArray.v.push(data.plugdata.watt);
      this.communicationArray.t.push(data.timestamp);
      }
      let count=9;
      let notify;
      // Resetta il timeout a 7 secondi ogni volta che viene ricevuta una comunicazione
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        if(this.communicationArray.v.length>0){
        count = recognize(this.communicationArray);}
        notify = {
          id : 1000,
          count
        }
        this.publisher.sendEventsToAll(notify);
        if(count!=9){
        this.writeCountToInfluxDB(count);}
        this.communicationArray.v = [];
        this.communicationArray.t = [];

      }, 5000);
  
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

  writeCountToInfluxDB(count) {
    if (this.receivedData) {
      let field;
      switch (count) {
        case -1:
          field = "spegnimento";
          break;
        case 0:
          field = "accensione";
          break;
        case 1:
          field = "UNCaffe";
          break;
        case 2:
          field = "DUECaffe";
          break;
        default:
          field = "unknown";
      }
  
      const point = new Point('coffee')
        .tag('deviceid', this.plugManager.deviceId)
        .intField(field, 1);
  
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
      id: 100,
      accensioni: accensioni,
      coffeeCount: coffeeCount - accensioni * 2,
    };
    console.log(jsonData);

    return jsonData;
  }

  getData() {
    const timestamp = new Date().toISOString();
    const data = {
      receivedData: this.receivedData,
    };
    return data;
  }

  getDataCount(start, end) {
    if(start && end){
      const startTimestamp = new Date(start).toISOString();
      const endTimestamp = new Date(end).toISOString();
    const query = `from(bucket: "${bucket}")
      |> range(start: ${startTimestamp}, stop: ${endTimestamp})
      |> filter(fn: (r) => r._measurement == "coffee")
      |> group(columns: ["_field"])
      |> count()`;

  
    return client
      .getQueryApi(org)
      .collectRows(query)
      .then((result) => {
        console.log(result);
        const fieldCounts = {};
        result.forEach((row) => {
          if(row._field!="count"){
          const field = row._field;
          const count = row._value;
          fieldCounts[field] = count;}
        });
  
        return fieldCounts;
      })
      .catch((error) => {
        console.error('Error:', error);
        throw new Error('Internal Server Error');
      });
  }
}

getDataWatt(start, end) {
  return new Promise((resolve, reject) => {
    if (start && end) {
      const startTimestamp = new Date(start).toISOString();
      const endTimestamp = new Date(end).toISOString();

      const query = `from(bucket: "${bucket}")
        |> range(start: ${startTimestamp}, stop: ${endTimestamp})
        |> filter(fn: (r) => r._field == "watt")
        |> aggregateWindow(every: 1s, fn: last, createEmpty: false)`;

      client.getQueryApi(org).collectRows(query)
        .then((result) => {
          const data = [];

          result.forEach((row) => {
            const value = row._value;
            const timestamp = new Date(row._time).getTime();

            data.push({ value, timestamp });
          });

          resolve(data);
        })
        .catch((error) => {
          console.error('Error:', error);
          reject(new Error('Internal Server Error'));
        });
    } else {
      reject(new Error('Missing start and end timestamps'));
    }
  });
}
}

module.exports = CoffeeManager;
