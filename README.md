```
wow-fansite/
├── index.html                   # Accueil du site
├── character.html               # Page UNIQUE pour TOUS les personnages (ex: character.html?name=Arthas&realm=Hyjal)
├── univers.html                 # Page pour l'univers et les classes
├── history.html                 # Chronologie générale
│
├── api/                         # 🛡️ ZONE SÉCURISÉE (Serverless - S'exécute côté serveur)
│   ├── get-token.js             # Échange secrètement le Client ID + Secret contre le Jeton Blizzard
│   └── get-character.js         # Reçoit la demande du navigateur, y ajoute le Jeton et interroge Blizzard
│
├── js/                          # 🌐 ZONE PUBLIQUE (S'exécute dans le navigateur de l'utilisateur)
│   ├── app.js                   # Gestion globale (navigation, chargement des en-têtes)
│   ├── character.js             # Extrait les paramètres de l'URL, appelle l'API locale, et remplit character.html
│   └── univers.js               # Récupère et affiche dynamiquement les données des classes
│
├── css/
│   ├── style.css                # Centralise les imports
│   ├── global.css               # Variables magiques, polices WoW, reset
│   ├── layout.css               # Structure (Header, Footer, Grille Kanban si besoin)
│   └── components/
│       ├── character-sheet.css  # Design de la fiche de personnage dynamique
│       └── class-card.css       # Design des cartes de classes
│
├── assets/
│   └── img/
│       └── ui/                  # Textures locales (cadres dorés, curseurs WoW, etc.)
│
├── .env                         # Fichier secret
└── .gitignore                   # Indique à Git de ne JAMAIS envoyer le fichier .env sur internet
```
