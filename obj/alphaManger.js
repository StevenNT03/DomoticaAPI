const Modbus = require('jsmodbus');
const net = require('net');
const { Point } = require('@influxdata/influxdb-client');
const { InfluxDB } = require('@influxdata/influxdb-client');
const dotenv = require('dotenv');
const moment = require('moment-timezone');
dotenv.config();

const ipAddress = process.env.INFLUX_IP_ADDRESS;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_ALPHA_BUCKET;
const client = new InfluxDB({ url: `http://${ipAddress}:8086`, token: token });
const writeApi = client.getWriteApi(org, bucket);

const registerArray = {
  '2': 1, // potenza usata attuale [W]
  '9': 1, // potenza media utilizzata aggiornata ogni 15 min [W]
  '30': 2, // energia Utilizzata in Giorno-1 in F1 [Wh]
  '32': 2, // energia Utilizzata in Giorno-1 in F2 [Wh]
  '34': 2, // energia Utilizzata in Giorno-1 in F3 [Wh]
  '203': 1 // fascia oraria attuale
};

let registerValues;
let lastInstantValue = null;
let lastAverageValue = null;

async function queryInstantPowerValues(start, end) {
  const startTimestamp = new Date(start).toISOString();
  const endTimestamp = new Date(end).toISOString();

  const query = `from(bucket:"${bucket}")
    |> range(start: ${startTimestamp}, stop: ${endTimestamp})
    |> filter(fn: (r) => r._measurement == "instant")`;

  const result = await client.getQueryApi(org).collectRows(query);

  const powerValues = result.map((row) => {
    const timestamp = moment(row._time).tz('Europe/Rome').format('YYYY-MM-DD HH:mm:ss');
    return {
      timestamp,
      power: row._value, // Verifica il nome corretto della colonna
    };
  });

  return powerValues;
}

async function queryAveragePowerValues(start, end) {
  const startTimestamp = new Date(start).toISOString();
  const endTimestamp = new Date(end).toISOString();

  const query = `from(bucket:"${bucket}")
    |> range(start: ${startTimestamp}, stop: ${endTimestamp})
    |> filter(fn: (r) => r._measurement == "average")`;

  const result = await client.getQueryApi(org).collectRows(query);
  const powerValues = result.map((row) => {
    const timestamp = moment(row._time).tz('Europe/Rome').format('YYYY-MM-DD HH:mm:ss');
    console.log(timestamp);
    return {
      timestamp,
      average: row._value,
    };
  });

  return powerValues;
}


function createAlpha(ip, port) {
  let client = null;

  function createConnection() {
    const socket = new net.Socket();
    client = new Modbus.client.TCP(socket);

    socket.on('error', (err) => {
      console.error('Errore nella connessione:', err);
      setTimeout(createConnection, 5000);
    });

    socket.connect(port, ip, () => {
      console.log('Connessione al server Modbus aperta');
    });

    process.on('exit', () => {
      socket.end(() => {
        console.log('Connessione al server Modbus chiusa');
      });
    });
  }

  function readRegisters() {
    return new Promise((resolve, reject) => {
      if (!client) {
        reject(new Error('Connessione Modbus non disponibile'));
        return;
      }

      const promises = Object.entries(registerArray).map(([address, count]) => {
        return client.readHoldingRegisters(parseInt(address), parseInt(count));
      });

      Promise.all(promises)
        .then((results) => {
          resolve(results.map((result) => parseInt(result.response._body._valuesAsBuffer.toString('hex'), 16)));
        })
        .catch((err) => {
          console.error('Errore nella lettura dei registri:', err);
          reject(err);
        });
    });
  }

  function updateRegisters() {
    readRegisters(registerArray)
      .then((values) => {
        registerValues = values;
        console.log("Registri aggiornati", registerValues);

        const [powerValue, averagePowerValue] = registerValues;

        const instantVariation = lastInstantValue ? (powerValue - lastInstantValue) / lastInstantValue * 100 : 0;
        const now = new Date();

        if (!lastInstantValue || instantVariation >= 20 || instantVariation <= -20 || (now.getMinutes() % 5 === 0 && now.getSeconds() === 0)) {
          const instantPoint = new Point('instant')
            .floatField('power', powerValue)
            .timestamp(now);
        
          writeApi.writePoint(instantPoint);
          lastInstantValue = powerValue;
          console.log('Valore scritto nel punto istantanea:', powerValue);
        }
        
        if (!lastAverageValue || (now.getMinutes() % 15 === 0 && now.getSeconds() === 0)) {
          const averagePoint = new Point('average')
            .floatField('power', averagePowerValue)
            .timestamp(now);
        
          writeApi.writePoint(averagePoint);
          lastAverageValue = averagePowerValue;
          console.log('Valore scritto nel punto media:', averagePowerValue);
        }
      })
      .catch((err) => {
        console.error('Errore nell\'aggiornamento dei registri:', err);
      });
  }

  createConnection();
  setInterval(updateRegisters, 1000);

  function getValues() {
    return registerValues;
  }

  return {
    getValues,
    queryInstantPowerValues,
    queryAveragePowerValues
  };
}

module.exports = createAlpha;
