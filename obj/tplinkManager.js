const { Client } = require('tplink-smarthome-api');

// Funzione per creare la comunicazione con la presa TP-Link
function createTPLink(ipAddress) {
  const client = new Client();
    console.log("connessione tplink creata");
  // Funzione per accendere la presa
  function accendiPresa() {
    client.getDevice({ host: ipAddress }).then(device => {
      device.setPowerState(true).then(() => {
        console.log('Presa accesa');
      }).catch(error => {
        console.error("Errore durante l'accensione della presa:", error);
      });
    }).catch(error => {
      console.error('Errore durante la connessione alla presa:', error);
    });
  }

  // Funzione per spegnere la presa
  function spegniPresa() {
    client.getDevice({ host: ipAddress }).then(device => {
      device.setPowerState(false).then(() => {
        console.log('Presa spenta');
      }).catch(error => {
        console.error('Errore durante lo spegnimento della presa:', error);
      });
    }).catch(error => {
      console.error('Errore durante la connessione alla presa:', error);
    });
  }

  function isPresaAccesa() {
    return new Promise((resolve, reject) => {
      client.getDevice({ host: ipAddress }).then(device => {
        device.getPowerState().then(powerState => {
          resolve(powerState);
        }).catch(error => {
          reject(error);
        });
      }).catch(error => {
        console.error('Errore durante la connessione alla presa:', error);
        reject(error);
      });
    });
  }

  // Funzione per ottenere i consumi della presa
  function ottieniConsumi() {
    return new Promise((resolve, reject) => {
      client.getDevice({ host: ipAddress }).then(device => {
        device.emeter.getRealtime().then(emeterRealtime => {
          const consumi = {
            power: {
              value: emeterRealtime.power,
              unit: 'W'
            },
            voltage: {
              value: emeterRealtime.voltage,
              unit: 'V'
            },
            current: {
              value: emeterRealtime.current,
              unit: 'A'
            },
            total: {
              value: emeterRealtime.total,
              unit: 'kWh'
            }
          };
          resolve(consumi);
        }).catch(error => {
          reject(error);
        });
      }).catch(error => {
        console.error('Errore durante la connessione alla presa:', error);
        reject(error);
      });
    });
  }

  return {
    accendiPresa,
    spegniPresa,
    ottieniConsumi,
    isPresaAccesa
  };
}

module.exports = createTPLink;
