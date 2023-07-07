const express = require('express');
const AirManager = require('../../obj/SmartPlugObj/AirManager');
const dotenv = require('dotenv');
const router = express.Router();
dotenv.config(); // Carica le variabili d'ambiente dal file .env
let publisher;
let AirMachine;
  function setPublisher(P){
  publisher=  P; 
   AirMachine = new AirManager("7413019100004faea16b2f60",publisher);
  AirMachine.start();
}
/**
 * @swagger
 * /api/air/registers:
 *   get:
 *     tags:
 *       - AirApi
 *     summary: Get data from Niveus smart plug
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/registers', (req, res) => {
  const data = AirMachine.getData();
  const jsonData = {
    id : 400,
    data: data
  };
  res.json(jsonData);
});

/**
 * @swagger
 * /api/air/data:
 *   get:
 *     tags:
 *       - AirApi
 *     summary: Get data from Niveus smart plug within a specific time range
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *         description: Start date and time in the format "YYYY-MM-DD HH:mm:SS"
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *         description: End date and time in the format "YYYY-MM-DD HH:mm:SS"
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/data', async (req, res) => {
  const { start, end } = req.query;

  // Verifica se le date sono presenti e valide
  if (start && end) {
    try {
      const startISO = new Date(start).toISOString();
      const endISO = new Date(end).toISOString();

      const result = await AirMachine.querySmartPlugData(startISO, endISO);

      const jsonData = {
        id : 400,
        data: result,
      };

      res.json(jsonData);
    } catch (error) {
      console.error('Error querying smart plug data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(400).json({ error: 'Missing start or end parameter' });
  }
});
const AirAPI ={
  router,
  setPublisher
}

module.exports = AirAPI;
