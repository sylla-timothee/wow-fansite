# wow-fansite
```
Architecture : 

wow-fansite/
├── index.html                               # Accueil
├── pages/
│   ├── character/
│   │   ├── index.html                       # Liste de tous les personnages
│   │   ├── arthas.html                      # Page spécifique
│   │   └── jaina.html
│   ├── univers/
│   │   ├── index.html                       # Présentation globale (Magie, Panthéon)
│   │   ├── classes/                         #présentation de toutes les classes
│   │   │   ├── warrior.html
│   │   │   ├── paladin.html
│   │   └──factions.html
│   └── history/
│       ├── index.html                       # Chronologie générale
│       └── guerre-anciens.html              # Un évènement précis
├── assets/
│   ├── img/
│   │   ├── ui/                              # Boutons, cadres etc...
│   │   ├── characters/                      # Portraits des personnages.
│   │   ├── regions/                         # Fanart des régions d'Azeroth
│   │   └── icons/                           # Icônes de classes ou de sorts
├── css/
│    ├── style.css                           # Sommaire du CSS qui import tout les autres
│    ├── global.css                          # Reset (marges par défaut), polices, variables
│    ├── layout.css                          # Structure : Header, Footer, Menu de navigation
│    │── components/                         # Éléments réutilisables
│    │    ├── character-card.css             # Le style des petites cartes de personnages
│    │    ├── character-profile.css          # Le style pour la page détaillée d'un héros
│    │    └── history-timeline.css           # CSS pour les pages histoires
└── js/
├── main.js                  # Script principal (chargé sur toutes les pages)
├── components/              # Scripts spécifiques à des éléments
│   ├── navbar.js            # Gère le menu mobile (hamburger)
│   ├── timeline.js          # Effets visuels sur la chronologie
│   └── audio-player.js      # Si vous voulez mettre la musique de Hurlevent !
└── utils/
    └── template-loader.js   # Script pour injecter le Header/Footer automatiquement
```
