# Utiliser une image de base Node.js stable et légère
FROM node:20-alpine

# Définir le dossier de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY . .

# Informer Docker que le conteneur écoute sur le port 3000
EXPOSE 3000

# Commande par défaut pour lancer le serveur d'application
CMD ["npm", "start"]