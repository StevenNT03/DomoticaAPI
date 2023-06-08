const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


// Importa le rotte delle API
const alphaAPIRoutes = require('./Routes/AlphaAPI/Alpha');
const shellyAPIRoutes = require('./Routes/ShellyAPI/Shelly');
const smartPlugAPIRoutes = require('./Routes/SmartPlugAPI/Plug');
const CoffeAPIRoutes = require('./Routes/CoffeeAPI/Coffe');
const AirApiRoutes = require('./Routes/AirAPI/Air');
// Middleware CORS
app.use(cors());

// Utilizza le rotte delle API
app.use('/api/alpha', alphaAPIRoutes);
app.use('/api/shelly', shellyAPIRoutes);
app.use('/api/tplink', smartPlugAPIRoutes);
app.use('/api/coffee', CoffeAPIRoutes);
app.use('/api/air', AirApiRoutes);


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
    './index.js', // Aggiungi il percorso del tuo file app.js
  ],
  apisExclude: ['./node_modules/**'], // Escludi le cartelle di dipendenze dalla documentazione
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
 * /swagger:
 *   get:
 *     tags:
 *       - PageAPI
 *     summary: Redirect to Swagger UI.
 *     description: Redirects the user to the Swagger UI page.
 *     responses:
 *       302:
 *         description: Redirect to Swagger UI.
 */
app.get('/swagger', (req, res) => {
  res.redirect('/api-docs');
});

