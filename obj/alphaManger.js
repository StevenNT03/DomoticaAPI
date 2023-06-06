const Modbus = require('jsmodbus');
const net = require('net');

const registerArray = {
  '2': 1, // potenza usata attuale [W]
  '9': 1, // potenza media utilizzata aggiornata ogni 15 min [W]
  '30': 2, // energia Utilizzata in Giorno-1 in F1 [Wh]
  '32': 2, // energia Utilizzata in Giorno-1 in F2 [Wh]
  '34': 2, // energia Utilizzata in Giorno-1 in F3 [Wh]
  '203': 1 // fascia oraria attuale
};

let registerValues;

function createAlpha(ip, port) {
  let client = null;

  function createConnection() {
    // Crea una connessione TCP con il server Modbus
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
          const values = results.map((result) => result.response._body._valuesAsArray[0]);
          resolve(results.map((result) => parseInt(result.response._body._valuesAsBuffer.toString('hex'), 16)));
        })
        .catch((err) => {
          console.error('Errore nella lettura dei registri:', err);
          reject(err);
        });
    });
  }


  function updateRegisters() {
    // Aggiorna i valori dei registri
    readRegisters(registerArray)
      .then((values) => {
        registerValues = values;
        console.log("registri aggiornati", registerValues);
      })
      .catch((err) => {
        console.error('Errore nell\'aggiornamento dei registri:', err);
      });
  }
  
  createConnection();

  // Aggiorna periodicamente i valori dei registri ogni secondo
  setInterval(updateRegisters, 1000);

  function getValues() {
    // Restituisce i valori dei registri
    return registerValues;
  }

  return {
    getValues
  };
}

module.exports = createAlpha;
