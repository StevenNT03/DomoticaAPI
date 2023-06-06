const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Importa le rotte delle API
const alphaAPIRoutes = require('./Routes/AlphaAPI/Alpha');
const shellyAPIRoutes = require('./Routes/ShellyAPI/Shelly');
const smartPlugAPIRoutes = require('./Routes/SmartPlugAPI/Plug');
const CoffeAPIRoutes = require('./Routes/CoffeeAPI/Coffe');

// Middleware CORS
app.use(cors());

// Utilizza le rotte delle API
app.use('/api/alpha', alphaAPIRoutes);
app.use('/api/shelly', shellyAPIRoutes);
app.use('/api/tplink', smartPlugAPIRoutes);
app.use('/api/coffee', CoffeAPIRoutes);



// Rotta per la pagina "/coffee"
app.get('/coffee', (req, res) => {
  res.sendFile(path.join(__dirname, 'coffee.html'));
});

// Avvia il server
const port = 3000;
app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});
