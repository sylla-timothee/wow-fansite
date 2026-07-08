// Coffre-fort temporaire pour le jeton (Cache en mémoire)
let cache = {
  accessToken: null,
  expiresAt: 0
};

// Variable pour regrouper les requêtes simultanées (Anti-bombardement)
let pendingPromise = null;

/**
 * Nettoie le cache (Uniquement utilisé par le fichier de test Vitest)
 */
export function __resetCache() {
  cache = { accessToken: null, expiresAt: 0 };
  pendingPromise = null;
}

/**
 * Handler Serverless principal
 */
export default async function handler(req, res) {
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

  // T1 & T2 : Vérification des clés secrètes
  if (!clientId) {
    return res.status(500).json({ error: "Le paramètre BLIZZARD_CLIENT_ID est manquant." });
  }
  if (!clientSecret) {
    return res.status(500).json({ error: "Le paramètre BLIZZARD_CLIENT_SECRET est manquant." });
  }

  // T4 & T5 : Si le jeton est en cache et toujours valide, on le renvoie directement
  if (cache.accessToken && Date.now() < cache.expiresAt) {
    return res.status(200).json({ access_token: cache.accessToken });
  }

  // T28 : Si une requête vers Blizzard est déjà en cours, on s'y greffe au lieu d'en recréer une
  if (!pendingPromise) {
    pendingPromise = (async () => {
      try {
        // Encodage en Base64 des identifiants pour l'authentification "Basic" de Blizzard
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await fetch('https://oauth.battle.net/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        });

        // T6 : Gestion des erreurs renvoyées par Blizzard (ex: 401 Unauthorized)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const err = new Error(errorData.error || 'Blizzard Auth Failed');
          err.status = 502; // Bad Gateway
          throw err;
        }

        const data = await response.json();
        
        // Stockage du jeton et calcul de la date d'expiration
        cache.accessToken = data.access_token;
        cache.expiresAt = Date.now() + (data.expires_in * 1000);
        
        return cache.accessToken;
      } catch (error) {
        // T7 : Si c'est une erreur réseau pure (sans code HTTP), on lève une 504 Gateway Timeout
        if (!error.status) {
          error.status = 504;
          error.message = "Erreur réseau ou Timeout avec les serveurs Blizzard.";
        }
        throw error;
      } finally {
        // Une fois la file d'attente vidée, on libère le verrou
        pendingPromise = null;
      }
    })();
  }

  // Résolution finale de la requête (qu'elle vienne du cache, du premier appel ou d'un appel concurrent)
  try {
    const token = await pendingPromise;
    return res.status(200).json({ access_token: token });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}