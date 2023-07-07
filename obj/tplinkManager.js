const { Client } = require('tplink-smarthome-api');

function createTPLink(ipAddress, publisher) {
  const client = new Client();
  let consumi;
  let timer;
  
 

  function saveConsumi() {
    ottieniConsumi()
      .then((consumi) => {
        this.consumi = consumi;
        const sse = {
          tplinkStampante: consumi
        }
        publisher.sendEventsToAll(sse);
      })
      .catch((error) => {
        console.error('Errore durante il salvataggio dei consumi:', error);
      });
  }
  

  function startSavingConsumi() {
    timer = setInterval(saveConsumi.bind(this), 10000); 
  }

  function stopSavingConsumi() {
    clearInterval(timer);
  }

  function accendiPresa() {
    client.getDevice({ host: ipAddress })
      .then((device) => {
        device.setPowerState(true)
          .then(() => {
            console.log('Presa accesa');
          })
          .catch((error) => {
            console.error("Errore durante l'accensione della presa:", error);
          });
      })
      .catch((error) => {
        console.error('Errore durante la connessione alla presa:', error);
      });
  }

  function spegniPresa() {
    client.getDevice({ host: ipAddress })
      .then((device) => {
        device.setPowerState(false)
          .then(() => {
            console.log('Presa spenta');
          })
          .catch((error) => {
            console.error('Errore durante lo spegnimento della presa:', error);
          });
      })
      .catch((error) => {
        console.error('Errore durante la connessione alla presa:', error);
      });
  }

  function isPresaAccesa() {
    return new Promise((resolve, reject) => {
      client.getDevice({ host: ipAddress })
        .then((device) => {
          device.getPowerState()
            .then((powerState) => {
              resolve(powerState);
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          console.error('Errore durante la connessione alla presa:', error);
          reject(error);
        });
    });
  }

  function ottieniConsumi() {
    return new Promise((resolve, reject) => {
      client.getDevice({ host: ipAddress })
        .then((device) => {
          device.emeter.getRealtime()
            .then((emeterRealtime) => {
              const consumi = {
                id: 300,
                power: {
                  value: emeterRealtime.power,
                  unit: 'W',
                },
                voltage: {
                  value: emeterRealtime.voltage,
                  unit: 'V',
                },
                current: {
                  value: emeterRealtime.current,
                  unit: 'A',
                },
                total: {
                  value: emeterRealtime.total,
                  unit: 'kWh',
                },
              };
              resolve(consumi);
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          console.error('Errore durante la connessione alla presa:', error);
          reject(error);
        });
    });
  }

  function getConsumi() {
    return this.consumi;
  }

  return {
    accendiPresa,
    spegniPresa,
    getConsumi,
    isPresaAccesa,
    startSavingConsumi,
    stopSavingConsumi,
    ottieniConsumi
  };
}

module.exports = createTPLink;
