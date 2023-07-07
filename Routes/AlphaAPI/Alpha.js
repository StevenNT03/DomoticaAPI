const express = require('express');
const router = express.Router();

const createAlpha = require('../../obj/alphaManger');
let alpha;
const net = require('net');
function setPublisher (P){
  alpha = createAlpha('192.168.1.25', 502, P);
}
/**
 * @swagger
 * /api/alpha/registers:
 *   get:
 *     tags:
 *       - AlphaAPI
 *     summary: Get alpha data
 *     responses:
 *       '200':
 *         description: OK
 */

router.get('/registers', (req, res) => {
  const values = alpha.getValues();
  const data = {
    id : 200,
    powerUsed: values[0],
    averagePowerUsed: values[1],
    energyUsedF1: values[2],
    energyUsedF2: values[3],
    energyUsedF3: values[4],
    currentHour: values[5]
  };
  res.json(data).status(200);
});


/**
 * @swagger
 * /api/alpha/data/instant:
 *   get:
 *     tags:
 *       - AlphaAPI
 *     summary: Get instant power data from Alpha
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *         description: Start timestamp for data retrieval
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *         description: End timestamp for data retrieval
 *     responses:
 *       '200':
 *         description: OK
 */

router.get('/data/instant', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (start && end) {
      // Convert start and end to ISO timestamps
      const startTimestamp = new Date(start).toISOString();
      const endTimestamp = new Date(end).toISOString();

      const instantPowerValues = await alpha.queryInstantPowerValues(startTimestamp, endTimestamp);

      const data = {
        id: 200,
        power: instantPowerValues
      };

      res.json(data).status(200);
    } else {
      res.status(400).json({ error: 'Missing start or end parameter' });
    }
  } catch (err) {
    console.error('Error fetching instant power data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/alpha/data/average:
 *   get:
 *     tags:
 *       - AlphaAPI
 *     summary: Get average power data from Alpha
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *         description: Start timestamp for data retrieval
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *         description: End timestamp for data retrieval
 *     responses:
 *       '200':
 *         description: OK
 */

router.get('/data/average', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (start && end) {
      // Convert start and end to ISO timestamps
      const startTimestamp = new Date(start).toISOString();
      const endTimestamp = new Date(end).toISOString();

      const averagePowerValues = await alpha.queryAveragePowerValues(startTimestamp, endTimestamp);

      const data = {
        id: 200,
        power: averagePowerValues
      };

      res.json(data).status(200);
    } else {
      res.status(400).json({ error: 'Missing start or end parameter' });
    }
  } catch (err) {
    console.error('Error fetching average power data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
const AlphaAPI={
  router,
  setPublisher
}
module.exports = AlphaAPI;



