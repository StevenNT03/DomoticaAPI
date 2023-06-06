const express = require('express');
const router = express.Router();
const  createTplink= require('../../obj/tplinkManager'); 


const tplink = createTplink("192.168.1.26"); // Crea l'oggetto TP-Link con l'indirizzo IP



// Endpoint per accendere il TP-Link
router.post('/on', (req, res) => {
  tplink.accendiPresa();
  res.send('Presa accesa');
});

// Endpoint per spegnere il TP-Link
router.post('/off', (req, res) => {
  tplink.spegniPresa();
  res.send('Presa spenta');
});

// Endpoint per ottenere i dati della macchinetta del tplink

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

// Endpoint per ottenere lo stato di accensione/spengimento della presa
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
