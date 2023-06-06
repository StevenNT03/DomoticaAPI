const express = require('express');
const axios = require('axios');
const EventSource = require('eventsource');
const EventEmitter = require('events');
// Installa il pacchetto dotenv tramite npm o yarn
const dotenv = require('dotenv');
dotenv.config(); // Carica le variabili d'ambiente dal file .env

// Ora puoi accedere alle variabili d'ambiente nel tuo codice
const clientId = process.env.TRACKLE_clientId;
const clientSecret = process.env.TRACKLE_clientSecret;

const app = express();

class PlugManager extends EventEmitter {
  constructor(deviceId) {
    super();
    this.deviceId = deviceId;
    this.started = false;
    

    // Prepara i dati per richiedere un token di accesso
    this.postData = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    });
  }

  start() {
    this.started = true;
    console.log('Avviata comunicazione SmartPlug');
    let token;
    this.getToken()
     .then((token) => {
        // Ottieni il token di accesso e avvia l'ascolto degli eventi SSE
        this.startSSE(token);
     })
     .catch((error) => {
       console.error('Errore durante il recupero del token:', error);
        // Programma un nuovo tentativo di connessione dopo 5 secondi
        setTimeout(() => {
          this.start();
        }, 5000);
      });
  }

  getToken() {
    const options = {
      method: 'POST',
      url: 'https://api.trackle.io/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': this.postData.length
      },
      data: this.postData
    };
  
    return axios(options)
      .then((response) => {
        let tokenw = response.data.access_token;
        return tokenw;
        console.log(tokenw);
      })
      .catch((error) => {
        console.error('Errore nella richiesta:', error);
        throw error;
      });
  }
  async startSSE(token) {
    const sseUrl = `https://api.trackle.io/v1/products/1002/devices/${this.deviceId}/events`;
  
    const headers = {
      Authorization: `Bearer ${token}`
    };
  
    // Funzione per gestire il tentativo di riconnessione
    const reconnect = async () => {
      console.log('Tentativo di riconnessione in corso...');
      try {
        let newToken = await this.getToken();
        this.startSSE(newToken); // Avvia nuovamente la connessione SSE con il nuovo token
      } catch (error) {
        console.error('Errore durante il recupero del token:', error);
        // Programma un nuovo tentativo di connessione dopo 5 secondi
        setTimeout(reconnect, 5000);
      }
    };
  
    // Avvia la connessione SSE per ricevere gli eventi dal dispositivo
    const eventSource = new EventSource(sseUrl, { headers });
  
    // Gestisci l'evento "status" che contiene i dati del dispositivo
    eventSource.on('status', (event) => {
      const plugdata = JSON.parse(event.data).data;
  
      const jsonsemnd = {
        "deviceId": this.deviceId,
        plugdata
      }
  
      // Emetti l'evento "message" con i dati del dispositivo
      this.emit('message', jsonsemnd);
    });
  
    // Gestisci l'evento di errore SSE
    eventSource.on('error', async (error) => {
      console.error('SSE error:', error);
      if (error.status === 401) {
        // Token non valido, genera un nuovo token
        await reconnect();
      } else {
        // Programma un nuovo tentativo di connessione dopo 5 secondi
        setTimeout(reconnect, 5000);
      }
    });
  }
  
}  

module.exports = PlugManager;
