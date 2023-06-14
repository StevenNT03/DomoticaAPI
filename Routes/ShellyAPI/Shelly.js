const express = require('express');
const router = express.Router();
const { InfluxDB } = require('@influxdata/influxdb-client');
const createAdministrator = require('../../obj/Administrator/shellyAdministrator');
const dotenv = require('dotenv');
const moment = require('moment-timezone');
dotenv.config();

const ipAddress = process.env.INFLUX_IP_ADDRESS;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_SHELLY_BUCKET;
const client = new InfluxDB({ url: `http://${ipAddress}:8086`, token: token });
const shellyAdmin = createAdministrator();

/**
 * @swagger
 * /api/shelly/relays/all/off:
 *   post:
 *     tags:
 *       - ShellyAPI
 *     summary: Turn off all relays
 *     responses:
 *       '200':
 *         description: OK
 */
router.post('/relays/all/off', (req, res) => {
  shellyAdmin.AllOff()
    .then(results => {
      res.json(results);
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

/**
 * @swagger
 * /api/shelly/relays/all/status:
 *   get:
 *     tags:
 *       - ShellyAPI
 *     summary: Get relays full info
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/relays/all/status', (req, res) => {
  shellyAdmin.getAllStatus()
    .then(statesWithRoom => {
      res.json(statesWithRoom);
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

/**
 * @swagger
 * /api/shelly/relays/{id}/status:
 *   get:
 *     tags:
 *       - ShellyAPI
 *     summary: Get relay full info
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the relay
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/relays/:relayId/status', (req, res) => {
  const relayId = req.params.relayId;
  shellyAdmin.getARelayStatus(relayId)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

/**
 * @swagger
 * /api/shelly/relays/{id}/toggle:
 *   post:
 *     tags:
 *       - ShellyAPI
 *     summary: Toggle relay
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the relay
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 */
router.post('/relays/:relayId/toggle', (req, res) => {
  const relayId = req.params.relayId;
  shellyAdmin.SwitchStatus(relayId)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

/**
 * @swagger
 * /api/shelly/relays/{id}/off:
 *   post:
 *     tags:
 *       - ShellyAPI
 *     summary: Turn off relay
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the relay
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 */
router.post('/relays/:relayId/off', (req, res) => {
  const relayId = req.params.relayId;
  shellyAdmin.setARelayOff(relayId)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

/**
 * @swagger
 * /api/shelly/relays/{id}/on:
 *   post:
 *     tags:
 *       - ShellyAPI
 *     summary: Turn on relay
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the relay
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 */
router.post('/relays/:relayId/on', (req, res) => {
  const relayId = req.params.relayId;
  shellyAdmin.setARelayOn(relayId)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

/**
 * @swagger
 * /api/shelly/{relayID}/data:
 *   get:
 *     tags:
 *       - ShellyAPI
 *     summary: Get data for a specific relay
 *     parameters:
 *       - name: relayID
 *         in: path
 *         description: ID of the relay
 *         required: true
 *         schema:
 *           type: string
 *       - name: start
 *         in: query
 *         description: Start timestamp
 *         required: true
 *         schema:
 *           type: string
 *       - name: end
 *         in: query
 *         description: End timestamp
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Missing values start or end
 *       '500':
 *         description: Error executing the query
 */
router.get('/:relayID/data', async (req, res) => {
  const { relayID } = req.params; // Get id from params
  const { start, end } = req.query; // Get start and end from query

  if (start && end) {
    try {
      // Convert start and end to ISO timestamps
      const startTimestamp = new Date(start).toISOString();
      const endTimestamp = new Date(end).toISOString();

      // Build the Flux query
      const fluxQuery = `
        from(bucket: "${bucket}")
          |> range(start: ${startTimestamp}, stop: ${endTimestamp})
          |> filter(fn: (r) => r["_measurement"] == "Lights")
          |> filter(fn: (r) => r["lightID"] == "${relayID}")
      `;

      // Execute the Flux query
      const result = await client.getQueryApi(org).collectRows(fluxQuery);

      const modifiedResult = result.map(data => ({
        time: moment(data._time).tz('Europe/Rome').format('YYYY-MM-DD HH:mm:ss'),
        watt: data._value,
        id: data.lightID
      }));

      res.json(modifiedResult);
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Error executing query' });
    }
  } else {
    res.status(400).json({ error: 'Missing values start or end' });
  }
});

module.exports = router;
