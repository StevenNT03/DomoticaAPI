# Utilizza un'immagine di base Node.js
FROM node:14

# Imposta la directory di lavoro
WORKDIR /DockerDomoticaAPI

# Copia il package.json e il package-lock.json nella directory di lavoro
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia l'applicazione nell'immagine Docker
COPY . .

# Esponi la porta del server
EXPOSE 3000

# Imposta le variabili d'ambiente
ENV INFLUX_TOKEN=3YkAmCMX6u3PUZg-1RgdUNJnjq5b_OQ6tyHspe2HhLPLaQDFMjgteaYPRnrmoJTDExEnfqdcv3NYvR1DMgZfSA==
ENV INFLUX_ORG=d
ENV INFLUX_BUCKET=CoffeData
ENV INFLUX_IP_ADDRESS=192.168.1.6
ENV INFLUX_SHELLY_BUCKET=ShellyData
ENV INFLUX_ALPHA_BUCKET=AlphaData

# Imposta il fuso orario su Europe/Rome
ENV TZ=Europe/Rome

# Avvia l'applicazione
CMD [ "npm", "start" ]
