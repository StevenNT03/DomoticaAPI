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

/**
 * @swagger
 * tags:
 *   name: CoffeeAPI
 *   description: API per ottenere dati dal coffee smart plug
 */

/**
 * @swagger
 * /api/coffee/data/count:
 *   get:
 *     tags:
 *       - CoffeeAPI
 *     summary: Ottieni il conteggio dei dati dal coffee smart plug
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         description: Data di inizio (formato ISO 8601)
 *         schema:
 *           type: string
 *       - in: query
 *         name: end
 *         required: true
 *         description: Data di fine (formato ISO 8601)
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/data/count', (req, res) => {
  const { start, end } = req.query;
  if (start && end) {
    firstMachine
      .getDataCount(start, end)
      .then((data) => {
        const jsonData = {
          data: data,
        };
        res.json(jsonData);
      })
      .catch((error) => {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  } else {
    res.status(400).json({ error: 'Bad Request' });
  }
});

/**
 * @swagger
 * /api/coffee/data/watt:
 *   get:
 *     tags:
 *       - CoffeeAPI
 *     summary: Ottieni i dati di watt dal coffee smart plug
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         description: Data di inizio (formato ISO 8601)
 *         schema:
 *           type: string
 *       - in: query
 *         name: end
 *         required: true
 *         description: Data di fine (formato ISO 8601)
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/data/watt', (req, res) => {
  const { start, end } = req.query;
  if (start && end) {
    firstMachine
      .getDataWatt(start, end)
      .then((data) => {
        const jsonData = {
          data: data,
        };
        res.json(jsonData);
      })
      .catch((error) => {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  } else {
    res.status(400).json({ error: 'Bad Request' });
  }
});

module.exports = router;
