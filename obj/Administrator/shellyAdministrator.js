const axios = require('axios');
const createShelly = require('../shellyManager');
const { InfluxDB } = require('@influxdata/influxdb-client');
const { Point } = require('@influxdata/influxdb-client');
const dotenv = require('dotenv');
dotenv.config();

const ipAddress = process.env.INFLUX_IP_ADDRESS;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_SHELLY_BUCKET;
const client = new InfluxDB({ url: `http://${ipAddress}:8086`, token: token });
const writeApi = client.getWriteApi(org, bucket);


function createAdministrator() {
  const shelly1 = createShelly('192.168.1.21'); 
  const shelly2 = createShelly('192.168.1.22');
  const shelly3 = createShelly('192.168.1.23');

  function getShellyInstance(relayId) {
    let shelly;
    let room;

    if (relayId >= 0 && relayId <= 3) {
      shelly = shelly1;
      
      if (relayId === 0) {
        room = "Ufficio Andrea";
      } else if (relayId === 1) {
        room = "Sala Riunioni";
      } else if (relayId === 2) {
        room = "Ufficio Flavio";
      } else if (relayId === 3) {
        room = "Laboratorio";
      }
      
      relayId %= 4;
    } else if (relayId >= 4 && relayId <= 7) {
      shelly = shelly2;
      
      if (relayId === 4) {
        room = "Cucina-Ripostiglio";
      } else if (relayId === 5) {
        room = "Ingresso";
      } else if (relayId === 6) {
        room = "BreakTime Space";
      } else if (relayId === 7) {
        room = "Open Space";
      }
      
      relayId = (relayId - 4) % 4;
    } else if (relayId >= 8 && relayId <= 9) {
      shelly = shelly3;
      
      if (relayId === 8) {
        room = "Punto luce non attivo";
      } else if (relayId === 9) {
        room = "----";
      }
      
      relayId = (relayId - 8) % 2;
    }
    
    return { shelly, relayId, room };
  }

  function storeRelayStatus(lightID) {
    const { shelly, relayId: shellyRelayId, room } = getShellyInstance(lightID);

    if (shelly) {
      shelly.getRelayStatus(shellyRelayId)
        .then(state => {
          const point = new Point('Lights')
            .tag('lightID', lightID.toString())
            .floatField('watt', state.apower);
           
          writeApi.writePoint(point);
          writeApi
            .flush()
            .then(() => {
              console.log('Data written to InfluxDB');
            })
            .catch((error) => {
              console.error('Error writing data to InfluxDB:', error);
            });
        })
        .catch(error => {
          console.error('Errore durante il recupero dello stato del relè: ' + lightID, error);
        });
    } else {
      console.error('Errore durante l\'invio dei dati a InfluxDB:', error);
    }
  }

  const shellyAdministrator = {
   
     getAllStatus() {
      const promises = [];
      const statesWithRoom = [];
    
      for (let k = 0; k < 10; k++) {
        const { shelly, relayId: shellyRelayId, room } = getShellyInstance(k);
        //console.log(shelly, shellyRelayId, room , relayId)
    
        if (shelly) {
          promises.push(
            shelly.getRelayStatus(shellyRelayId)
              .then(state => {
                statesWithRoom.push( { state: { ...state, id: k }, room });
                //console.log(statesWithRoom)
              })
          );
        } else {
          const errorMessage = `Shelly instance not found for relayId ${relayId}`;
          console.error(errorMessage);
        }
      }
    // console.log(promises)
      return Promise.all(promises)
        .then(() => {
          return {
            data: statesWithRoom,
          };
        })
        .catch(error => {
          const response = {
            error: 'Impossibile ottenere lo stato dei relè.',
          };
          return response;
        });

       p;
    },
      
 

    getARelayStatus(relayId) {
      const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

      if (shelly) {
        return shelly.getRelayStatus(shellyRelayId)
          .then(state => {
            return { state: { ...state, id: relayId }, room };
          })
          .catch(error => {
            throw new Error('Impossibile ottenere lo stato del relè.');
          });
      } else {
        throw new Error('Shelly non trovato per l\'ID specificato.');
      }
    },
    
    SwitchStatus(relayId) {
      const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

      if (shelly) {
        return shelly.toggleRelay(shellyRelayId, relayId)
          .then(state => {
            return { state: { ...state, relayId: relayId }, room };
          })
          .catch(error => {
            throw new Error('Impossibile attivare o disattivare il relè.');
          });
      } else {
        throw new Error('Shelly non trovato per l\'ID specificato.');
      }
    },

    AllOff() {
      const promises = [];

      promises.push(shelly1.turnOffAllRelays());
      promises.push(shelly2.turnOffAllRelays());
      promises.push(shelly3.turnOffAllRelays());

      return Promise.all(promises)
        .then(results => {
          return { results };
        })
        .catch(error => {
          throw new Error('Errore durante lo spegnimento dei relè.');
        });
    },

    setARelayOn(relayId) {
      const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

      if (shelly) {
        return shelly.setRelayOn(shellyRelayId, relayId)
          .then(state => {
            return { state: { ...state, relayId: relayId }, room };
          })
          .catch(error => {
            throw new Error('Impossibile accendere il relè.');
          });
      } else {
        throw new Error('Shelly non trovato per l\'ID specificato.');
      }
    },

    setARelayOff(relayId) {
      const { shelly, relayId: shellyRelayId, room } = getShellyInstance(relayId);

      if (shelly) {
        return shelly.setRelayOff(shellyRelayId, relayId)
          .then(state => {
            return { state: { ...state, relayId: relayId }, room };
          })
          .catch(error => {
            throw new Error('Impossibile spegnere il relè.');
          });
      } else {
        throw new Error('Shelly non trovato per l\'ID specificato.');
      }
    }
  };

  setInterval(() => {
    for (let relayId = 0; relayId < 8; relayId++) {
      storeRelayStatus(relayId);
    }
  }, 5*60*1000); // Run every 5 minutes (5 * 60 * 1000 milliseconds)

  return shellyAdministrator;
}

module.exports = createAdministrator;
