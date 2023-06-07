const express = require('express');
const router = express.Router();

const createAlpha = require('../../obj/alphaManger');

const net = require('net');

const alpha = createAlpha('192.168.1.25', 502);
/**
 * @swagger
 * /api/alpha/data:
 *   get:
 *     tags:
 *       - AlphaAPI
 *     summary: Get alpha data
 *     responses:
 *       '200':
 *         description: OK
 */

router.get('/data', (req, res) => {
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


module.exports = router;
