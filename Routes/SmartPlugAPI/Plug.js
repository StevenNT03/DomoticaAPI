const express = require('express');
const router = express.Router();
const  createTplink= require('../../obj/tplinkManager'); 


const tplink = createTplink("192.168.1.26"); // Crea l'oggetto TP-Link con l'indirizzo IP


/**
 * @swagger
 * /api/tplink/data:
 *   get:
 *     tags:
 *       - TpLinkAPI
 *     summary: Get data from tplink smart plug
 *     responses:
 *       '200':
 *         description: OK
 */

router.get('/data', (req, res) => {
  tplink.ottieniConsumi().then(tplinkData => {
    const jsonData = {
      tplinkStampante: tplinkData
    };
    res.json(jsonData);
  }).catch(error => {
    console.error('Errore durante il recupero dei dati:', error);
    res.status(500).send('Errore durante il recupero dei dati');
  });
});

/**
 * @swagger
 * /api/tplink/on:
 *   post:
 *     tags:
 *       - TpLinkAPI
 *     summary: Turn on printer smart plug
 *     responses:
 *       '200':
 *         description: OK
 */

router.post('/on', (req, res) => {
  tplink.accendiPresa();
  res.send('Presa accesa');
});

/**
 * @swagger
 * /api/tplink/off:
 *   post:
 *     tags:
 *       - TpLinkAPI
 *     summary: Turn off printer smart plug
 *     responses:
 *       '200':
 *         description: OK
 */

router.post('/off', (req, res) => {
  tplink.spegniPresa();
  res.send('Presa spenta');
});


/**
 * @swagger
 * /api/tplink/status:
 *   get:
 *     tags:
 *       - TpLinkAPI
 *     summary: Get status of the printer smart plug
 *     responses:
 *       '200':
 *         description: OK
 */
router.get('/status', (req, res) => {
  tplink.isPresaAccesa().then(powerState => {
    const status = powerState;
    res.json({ "stato_presa": status });
  }).catch(error => {
    console.error('Errore durante il recupero dello stato della presa:', error);
    res.status(500).send('Errore durante il recupero dello stato della presa');
  });
});



module.exports = router;
