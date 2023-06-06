const express = require('express');
const { Point } = require('@influxdata/influxdb-client');
const { InfluxDB } = require('@influxdata/influxdb-client');
const coffeeManager = require('../../obj/SmartPlugObj/coffeeManager');
const dotenv = require('dotenv');
dotenv.config(); // Carica le variabili d'ambiente dal file .env


const firstMachine = new coffeeManager("741301910000e45539823e5a");
firstMachine.start();

const router = express.Router();

// Configurazione del client InfluxDB
const ipAddress = process.env.INFLUX_IP_ADDRESS;

const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const client = new InfluxDB({ url: `http://${ipAddress}:8086`, token: token });
const writeApi = client.getWriteApi(org, bucket);

// Endpoint per la registrazione dei dati del caffè
router.post('/:number', (req, res) => {
  const { number } = req.params;
  console.log("numero caffe inseriti", number);

  // Verifica se `number` è un numero valido
  const count = parseInt(number);
  if (isNaN(count)) {
    res.status(400).send('Invalid count value');
    return;
  }
  
  // Creazione di un punto di dati
  const point = new Point('coffee')
    .tag('type', 'count')
    .intField('count', count);

  // Scrittura del punto nel database
  writeApi.writePoint(point);

  res.send('Dati del caffè registrati con successo!');
});

// Endpoint per ottenere i dati della macchinetta del caffè e conteggio dei record con valore 1 e 2
router.get('/data', (req, res) => {
  const coffes = firstMachine.getAllData();
  firstMachine
    .getDataAndCount()
    .then((data) => {
      const jsonData = {
        id: 100,
        coffes: coffes,
        data: data
      };
      res.json(jsonData);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

module.exports = router;

