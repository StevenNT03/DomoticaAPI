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

// Endpoint per spegnere tutti i relè
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
// Endpoint per ottenere lo stato di tutti i relè
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
// Endpoint per ottenere lo stato di un relè
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


// Endpoint per attivare o disattivare un relè
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

// Endpoint per spegnere un relè specifico
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

// Endpoint per accendere un relè specifico
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
