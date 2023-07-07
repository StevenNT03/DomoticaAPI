const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const publisher = require('./obj/Publisher/publisher');


const m = 1883; // Porta del server MQTT

server.listen(m, () => {
  console.log('Server MQTT avviato');
});

// Importa le rotte delle API
const alphaAPIRoutes = require('./Routes/AlphaAPI/Alpha');
alphaAPIRoutes.setPublisher(publisher);
const shellyAPIRoutes = require('./Routes/ShellyAPI/Shelly');
shellyAPIRoutes.setPublisher(publisher);
const smartPlugAPIRoutes = require('./Routes/SmartPlugAPI/Plug');
smartPlugAPIRoutes.setPublisher(publisher);
const CoffeAPIRoutes = require('./Routes/CoffeeAPI/Coffe');
CoffeAPIRoutes.setPublisher(publisher);
const AirApiRoutes = require('./Routes/AirAPI/Air');
AirApiRoutes.setPublisher(publisher);
// Middleware CORS
app.use(cors());

// Utilizza le rotte delle API
app.use('/api/alpha', alphaAPIRoutes.router);
app.use('/api/shelly', shellyAPIRoutes.router);
app.use('/api/tplink', smartPlugAPIRoutes.router);
app.use('/api/coffee', CoffeAPIRoutes.router);
app.use('/api/air', AirApiRoutes.router);


// Configurazione Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Documentation for the APIs',
    },
  },
  apis: [
    './Routes/AlphaAPI/Alpha.js',
    './Routes/ShellyAPI/Shelly.js',
    './Routes/SmartPlugAPI/Plug.js',
    './Routes/CoffeeAPI/Coffe.js',
    './Routes/AirAPI/Air.js',
    './index.js',
  ],
  apisExclude: ['./node_modules/**'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /coffee:
 *   get:
 *     tags:
 *       - PageAPI
 *     summary: Get the coffee page
 *     responses:
 *       '200':
 *         description: OK
 */
app.get('/coffee', (req, res) => {
  res.sendFile(path.join(__dirname, 'coffee.html'));
});

// Avvia il server
const port = 3000;
app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});
/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - PageAPI
 *     summary: Redirect to Swagger UI.
 *     description: Redirects the user to the Swagger UI page.
 *     responses:
 *       302:
 *         description: Redirect to Swagger UI.
 */
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});
/**
 * @swagger
 * /events:
 *   get:
 *     tags:
 *       - SSEConnect
 *     summary: Connect to sse comunication for being notified of new events
 *     description: 
 *     responses:
 *       302:
 *         description: Redirect to Swagger UI.
 */
app.get('/events', publisher.eventsHandler);
