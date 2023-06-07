const express = require('express');
const router = express.Router();

const createShelly = require('../../obj/shellyManager'); // Importa la funzione createShelly

// Crea un'istanza di ShellyAPI con gli indirizzi IP desiderati
const shelly1 = createShelly('192.168.1.21'); 
const shelly2 = createShelly('192.168.1.22');
const shelly3 = createShelly('192.168.1.23');

let room;

// Funzione ausiliaria per ottenere l'istanza corretta di Shelly in base all'ID del relè
function getShellyInstance(relayId) {
  let shelly;
  
  if (relayId >= 0 && relayId <= 3) {
    shelly = shelly1;
    
    if(relayId == 0){
      room = "Ufficio Andrea";
    } else if(relayId == 1){
      room = "Sala Riunioni";
    } else if(relayId == 2){
      room = "Ufficio Flavio";
    } else if(relayId == 3){
      room = "Laboratorio";
    }
    
    relayId %= 4;
  } else if (relayId >= 4 && relayId <= 7) {
    shelly = shelly2;
    
    if(relayId == 4){
      room = "Cucina-Ripostiglio";
    } else if(relayId == 5){
      room = "Ingresso";
    } else if(relayId == 6){
      room = "BreakTime Space";
    } else if(relayId == 7){
      room = "Open Space";
    }
    
    relayId = (relayId - 4) % 4;
  } else if (relayId >= 8 && relayId <= 9) {
    shelly = shelly3;
    
    if(relayId == 8){
      room = "Punto luce non attivo";
    } else if(relayId == 9){
      room = "----";
    }
    
    relayId = (relayId - 8) % 2;
  }
  
  return { shelly, relayId, room };
}

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
  const promises = [];

  promises.push(shelly1.turnOffAllRelays());
  promises.push(shelly2.turnOffAllRelays());
  promises.push(shelly3.turnOffAllRelays());

  Promise.all(promises)
    .then(results => {
      res.json({ results });
    })
    .catch(error => {
      res.status(500).json({ error: 'Errore durante lo spegnimento dei relè.' });
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
  const promises = [];
  const statesWithRoom = [];

  for (let relayId = 0; relayId < 10; relayId++) {
    const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

    if (shelly) {
      promises.push(
        shelly.getRelayStatus(shellyRelayId)
          .then(state => {
            statesWithRoom.push({ state: { ...state, id: relayId }, room });
          })
      );
    }
  }

  Promise.all(promises)
    .then(() => {
      res.json(statesWithRoom);
    })
    .catch(error => {
      res.status(500).json({ error: 'Impossibile ottenere lo stato dei relè.' });
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
  const relayId = parseInt(req.params.relayId);
  const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

  if (shelly) {
    shelly.getRelayStatus(shellyRelayId)
      .then(state => {
        res.json({ state: { ...state, id: relayId }, room });
      })
      .catch(error => {
        res.status(500).json({ error: 'Impossibile ottenere lo stato del relè.' });
      });
  } else {
    res.status(404).json({ error: 'Shelly non trovato per l\'ID specificato.' });
  }
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
  const relayId = parseInt(req.params.relayId);
  const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

  if (shelly) {
    shelly.toggleRelay(shellyRelayId, relayId)
    .then(state => {
      res.json({ state: { ...state, relayId: relayId}, room });
      })
      .catch(error => {
        res.status(500).json({ error: 'Impossibile attivare o disattivare il relè.' });
      });
  } else {
    res.status(404).json({ error: 'Shelly non trovato per l\'ID specificato.' });
  }
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
  const relayId = parseInt(req.params.relayId);
  const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

  if (shelly) {
    shelly.setRelayOff(shellyRelayId, relayId)
    .then(state => {
      res.json({ state: { ...state, relayId: relayId}, room });
      })
      .catch(error => {
        res.status(500).json({ error: 'Impossibile spegnere il relè.' });
      });
  } else {
    res.status(404).json({ error: 'Shelly non trovato per l\'ID specificato.' });
  }
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
  const relayId = parseInt(req.params.relayId);
  const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

  if (shelly) {
    shelly.setRelayOn(shellyRelayId, relayId)
    .then(state => {
      res.json({ state: { ...state, relayId: relayId }, room });
      })
      .catch(error => {
        res.status(500).json({ error: 'Impossibile accendere il relè.' });
      });
  } else {
    res.status(404).json({ error: 'Shelly non trovato per l\'ID specificato.' });
  }
});



module.exports = router;
