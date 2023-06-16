const axios = require('axios');
const { InfluxDB } = require('@influxdata/influxdb-client');
const dotenv = require('dotenv');
dotenv.config();
const ipAddress = process.env.INFLUX_IP_ADDRESS;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_SHELLY_BUCKET;
const client = new InfluxDB({ url: `http://${ipAddress}:8086`, token: token });
const writeApi = client.getWriteApi(org, bucket);

function createShelly(ipAddress) {
  const shellyUrl = `http://${ipAddress}/relay/`;
  const statusUrl = `http://${ipAddress}/rpc/Switch.GetStatus?id=`;
  console.log("shelly IP: " + ipAddress + " In comunicazione");

  function getShellyUrl(relayId) {
    return shellyUrl + relayId;
  }
  
  const shelly = {
    // Ottiene lo stato di un relè specifico
    getRelayState(relayId) {
      const url = getShellyUrl(relayId);
      return axios.get(url)
        .then(response => {
          
          const currentState = response.data.ison;
          return {
            relayId: relayId,
            ipAddress: ipAddress,
            ison: currentState
          };
        })
        .catch(error => {
          console.log(`Impossibile ottenere lo stato del relè ${relayId} del dispositivo Shelly.`);
          throw error;
        });
    },

    // Ottiene lo stato dettagliato di un relè specifico
    getRelayStatus(relayId) {
      const url = statusUrl + relayId;
      return axios.get(url)
        .then(response => { return response.data})
        .catch(error => {
          console.log(`Impossibile ottenere lo stato del relè ${relayId} del dispositivo Shelly.`);
          throw error;
        });
    },

    // Inverte lo stato di un relè specifico (lo accende se è spento e viceversa)
    toggleRelay(relayId, realID) {
      return this.getRelayState(relayId)
        .then(currentState => {
          const turn = !currentState.ison; // Inverti lo stato booleano
          const url = getShellyUrl(relayId) + `?turn=${turn ? 'on' : 'off'}`;
          return axios.post(url)
            .then(() => {
              return {
                relayId: relayId,
                message: `Il relè ${realID} è stato ${turn ? 'acceso' : 'spento'}.`
              };
            })
            .catch(error => {
              console.log(`Impossibile ${turn ? 'accendere' : 'spegnere'} il relè ${realID} del dispositivo Shelly.`);
              throw error;
            });
        });
    },

    // Spegne tutti i relè del dispositivo Shelly
    turnOffAllRelays() {
      const url = `http://${ipAddress}/rpc/Script.Start`;
      const scriptId = 1;

      const requestData = {
        id: scriptId,
        enabled: true
      };

      return axios.post(url, requestData)
        .then(() => {
          return {
            message: "Lo script è stato avviato correttamente."
          };
        })
        .catch(error => {
          return {
            error: "Errore durante l'avvio dello script: " + error.message
          };
        });
    },

    // Accende un relè specifico
    setRelayOn(relayId, realID) {
      const url = getShellyUrl(relayId) + '?turn=on';
      return axios.post(url)
        .then(() => {
          return {
            relayId: relayId,
            message: `Il relè ${realID} è stato acceso.`
          };
        })
        .catch(error => {
          console.log(`Impossibile accendere il relè ${realID} del dispositivo Shelly.`);
          throw error;
        });
    },

    // Spegne un relè specifico
    setRelayOff(relayId, realID) {
      const url = getShellyUrl(relayId) + '?turn=off';
      return axios.post(url)
        .then(() => {
          return {
            relayId: relayId,
            message: `Il relè ${realID} è stato spento.`
          };
        })
        .catch(error => {
          console.log(`Impossibile spegnere il relè ${realID} del dispositivo Shelly.`);
          throw error;
        });
    }
  };

  return shelly;
}

module.exports = createShelly;

