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


function createAdministrator(publisher) {
  const shellyData = [
    { ip: '192.168.1.21', relayOffset: 0, rooms: ["Andrea's Office", "Meeting Room", "Flavio's Office", "Laboratory"], publisher },
    { ip: '192.168.1.22', relayOffset: 1, rooms: ["Kitchen", "Entrance", "Break Time Space", "Open Space"], publisher },
    { ip: '192.168.1.23', relayOffset: 2, rooms: ["Punto luce non attivo", "----"], publisher }
  ];

  const shellyArray = shellyData.map(data => {
    const { ip, relayOffset, rooms, publisher } = data;
    return createShelly(ip, relayOffset, rooms, publisher);
  });

  async function storeRelayStatus(lightID) {
    const offset = Math.floor(lightID / 4);
  
    if (shellyArray[offset]) {
      const shelly = await shellyArray[offset];
      const shellyRelayId = lightID % 4;
  
      try {
        const state = await shelly.getRelayStatus(shellyRelayId);
        state.id = lightID;
  
        const point = new Point('Lights')
          .tag('lightID', lightID.toString())
          .floatField('watt', state.state.apower);
  
        writeApi.writePoint(point);
        console.log('Data written to InfluxDB');
      } catch (error) {
        console.error('Errore durante il recupero dello stato del relè: ' + lightID, error);
      }
    } else {
      console.error('Shelly device not found for offset: ' + offset);
    }
  }
  
  const shellyAdministrator = {
    async getAllStatus() {
      const statesWithRoom = [];
    
      for (let relayId = 0; relayId < 10; relayId++) {
        const offset = Math.floor(relayId / 4);
        
        if (shellyArray[offset]) {
          const shelly = await shellyArray[offset];
          const shellyRelayId = relayId % 4;
        
          const state = await shelly.getRelayStatus(shellyRelayId);
          state.state.id = parseInt(relayId);
    
          statesWithRoom.push(state);
        }
        
      }
    
      return {
        data: statesWithRoom,
      };
    },

    async getARelayStatus(relayId) {
      const offset = Math.floor(relayId / 4);

      if (shellyArray[offset]) {
        const shelly = await shellyArray[offset];
        const shellyRelayId = relayId % 4;
      
        const state = await shelly.getRelayStatus(shellyRelayId);
        state.state.id =parseInt(relayId);
        return state;
      }
    },
    async AllOff() {
      const promises = [];
      shellyArray.forEach(async shellyPromise => {
        const shelly = await shellyPromise;
        promises.push(shelly.turnOffAllRelays());
      });
    
      return Promise.all(promises)
        .then(results => {
          return true;
        })
        .catch(error => {
          throw new Error('Errore durante lo spegnimento dei relè.');
        });
    },

    async setARelayOn(relayId) {
      const offset = Math.floor(relayId / 4);

      if (shellyArray[offset]) {
        const shelly = await shellyArray[offset];
        const shellyRelayId = relayId % 4;
      
        const state = await shelly.setRelayOn(shellyRelayId, relayId);
        return state;
      }
    },

    async setARelayOff(relayId) {
      const offset = Math.floor(relayId / 4);

      if (shellyArray[offset]) {
        const shelly = await shellyArray[offset];
        const shellyRelayId = relayId % 4;
      
        const state = await shelly.setRelayOff(shellyRelayId, relayId);
        return state;
      }
    },
  };

  setInterval(() => {
    for (let relayId = 0; relayId < 8; relayId++) {
      storeRelayStatus(relayId);
    }
  }, 5 * 60* 1000); // Esegui ogni 5 minuti (5 * 60 * 1000 millisecondi)

  return shellyAdministrator;
}

module.exports = createAdministrator;
