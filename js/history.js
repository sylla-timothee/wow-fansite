/**
 * Affiche le titre, sous-titre et les dates de l'époque dans le header
 */
export function renderEra(meta) {
  const titleEl = document.querySelector('#era-header h1');
  const subtitleEl = document.querySelector('.era-subtitle');
  const dateEl = document.querySelector('.era-date');

  if (titleEl) titleEl.textContent = meta.title;
  if (subtitleEl) subtitleEl.textContent = meta.subtitle;
  if (dateEl) dateEl.textContent = `Période : de l'An ${meta.startYear} à l'An ${meta.endYear}`;
}

/**
 * Génère la frise chronologique (Timeline) et crée les liens vers les personnages
 */
export function renderTimeline(events, characters) {
  const container = document.getElementById('timeline');
  if (!container) return;
  container.innerHTML = '';

  events.forEach(event => {
    const article = document.createElement('article');
    article.className = 'timeline-event';

    // Récupérer les données complètes des personnages liés à cet événement
    const associatedChars = (event.characterIds || [])
      .map(id => characters.find(c => c.id === id))
      .filter(Boolean);

    // Créer les badges HTML pour chaque personnage lié
    const linksHtml = associatedChars
      .map(char => `<span class="character-link">${char.name}</span>`)
      .join(', ');

    article.innerHTML = `
      <div class="event-date">${event.dateLabel || `An ${event.date}`}</div>
      <h3 class="event-title">${event.title}</h3>
      <p class="event-description">${event.description}</p>
      ${linksHtml ? `<div class="event-characters">Acteurs clés : ${linksHtml}</div>` : ''}
    `;
    container.appendChild(article);
  });
}

/**
 * Génère les fiches descriptives des personnages historiques
 */
export function renderCharacters(characters) {
  const container = document.getElementById('characters');
  if (!container) return;
  container.innerHTML = '';

  characters.forEach(char => {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.setAttribute('data-character-id', char.id);

    card.innerHTML = `
      <h3 class="character-name">${char.name}</h3>
      <h4 class="character-title">${char.title}</h4>
      <p class="character-description">${char.description}</p>
      <div class="character-traits">
        <span class="character-trait">${char.race}</span>
        <span class="character-trait">${char.faction}</span>
        <span class="character-trait">${char.class || 'Sans classe'}</span>
      </div>
      <span class="role-badge">${char.role}</span>
    `;
    container.appendChild(card);
  });
}

/**
 * Affiche le bloc d'erreur en cas de problème de réseau ou de fichier manquant
 */
export function renderError(message) {
  const container = document.getElementById('error-container');
  const msgEl = document.getElementById('error-message');
  if (container) container.classList.remove('hidden');
  if (msgEl) msgEl.textContent = message;
}

/**
 * Orchestrateur principal : lit l'URL, charge le JSON et déclenche le rendu
 */
export async function loadHistory() {
  try {
    // Étape dynamique : on récupère "?era=..." depuis l'URL (par défaut : first-war)
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const era = params.get('era') || 'first-war';

    // On charge le morceau d'histoire ciblé
    const res = await fetch(`/data/history/${era}.json`);

    if (!res.ok) {
      throw new Error(`Impossible de charger l'époque "${era}" (Code ${res.status})`);
    }

    const data = await res.json();
    
    // Déclenchement des affichages
    renderEra(data.meta);
    renderTimeline(data.timeline, data.characters);
    renderCharacters(data.characters);
  } catch (error) {
    renderError(error.message || 'Une erreur inconnue est survenue.');
  }
}