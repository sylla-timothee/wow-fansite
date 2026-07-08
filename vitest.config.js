import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Charger les variables d'environnement du fichier .env pour les tests
dotenv.config();

export default defineConfig({
  test: {
    // Par défaut, on utilise l'environnement Node pour l'API Serverless
    environment: 'node',
    globals: true,
  },
});