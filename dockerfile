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

# Avvia l'applicazione
CMD [ "npm", "start" ]
