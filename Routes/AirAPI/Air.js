const express = require('express');
const AirManager = require('../../obj/SmartPlugObj/AirManager');
const AirMachine = new AirManager("7413019100004faea16b2f60");
AirMachine.start();
const router = express.Router();
/**
 * @swagger
 * /api/air/data:
 *   get:
 *     tags:
 *       - AirApi
 *     summary: Get data from Niveus smart plug
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/data', (req, res) => {
  const data = AirMachine.getData();
  const jsonData = {
    data: data
  };
  res.json(jsonData);
});

  
  module.exports = router;