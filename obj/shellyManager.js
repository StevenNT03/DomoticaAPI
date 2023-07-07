const axios = require('axios');
const { InfluxDB } = require('@influxdata/influxdb-client');
const dotenv = require('dotenv');
const mqtt = require('mqtt');
const { json } = require('express');



dotenv.config();
const ipAddress = process.env.INFLUX_IP_ADDRESS;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_SHELLY_BUCKET;
const client = new InfluxDB({ url: `http://${ipAddress}:8086`, token: token });
const writeApi = client.getWriteApi(org, bucket);


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createShelly(ipAddress, id, rooms, publisher) {
  const shellyUrl = `http://${ipAddress}/relay/`;
  const statusUrl = `http://${ipAddress}/rpc/Switch.GetStatus?id=`;
  console.log("shelly IP: " + ipAddress + " In comunicazione");
  let status = [];

  for (let i = 0; i < rooms.length; i++) {
    const url = statusUrl + i;
    try {
      const response = await axios.get(url);
      status[i] = {
        state: response.data,
        room: rooms[i]
      };
      await sleep(200);
    } catch (error) {
      console.log(`Impossibile ottenere lo stato del relè ${i} del dispositivo Shelly.`);
      throw error;
    }
  }
 

  function getShellyUrl(relayId) {
    return shellyUrl + relayId;
  }


  // Configurazione del broker MQTT
  const brokerUrl = 'mqtt://192.168.1.6:1883'; // Indirizzo del broker MQTT


  // Connessione al broker MQTT
  const mqttClient = mqtt.connect(brokerUrl);

  // Evento di connessione al broker MQTT
  mqttClient.on('connect', () => {
    console.log('Connesso al broker MQTT');
   
    mqttClient.subscribe(`${ipAddress}/status/#`);
  });

  // Evento di ricezione di un messaggio MQTT
  mqttClient.on('message', (topic, message) => {
    message=JSON.parse(message);
    if(topic.startsWith(ipAddress +'/status/switch')){
      let Index=message.id;
      message.id=id*4+message.id;
       
      const sse ={
        room : rooms[Index],
        state : message
      }
    status[Index]={
      room : rooms[Index],
      state : message
    }
    publisher.sendEventsToAll(sse);
    }
  });

  const shelly = {
    // Ottiene lo stato di un relè specifico
    getRelayStatus(relayId) {
      return status[relayId];
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
            relayId: parseInt(realID),
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
            relayId: parseInt(realID),
            message: `Il relè ${realID} è stato spento.`
          };
        })
        .catch(error => {
          console.log(`Impossibile spegnere il relè ${realID} del dispositivo Shelly.`);
          throw error;
        });
    },

   
  };

  return shelly;
}

module.exports = createShelly;
