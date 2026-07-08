// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { renderEra, renderTimeline, renderCharacters, renderError, loadHistory } from '../history.js';

// ─── Chemins ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const HTML_PATH = resolve(__dirname, '../../history.html');

// ─── Fixture ──────────────────────────────────────────────
const TEST_DATA = {
  meta: {
    title: 'La Première Guerre',
    subtitle: 'Test Subtitle',
    era: 'Première Guerre',
    startYear: 0,
    endYear: 4,
  },
  timeline: [
    {
      id: 'test-event-1',
      date: '0',
      dateLabel: 'An 0',
      title: "L'Ouverture du Portail",
      description: 'Description du premier événement',
      type: 'major',
      characterIds: ['guldan', 'medivh'],
    },
    {
      id: 'test-event-2',
      date: '4',
      dateLabel: 'An 4',
      title: 'La Chute de Hurlevent',
      description: 'Description du second événement',
      type: 'major',
      characterIds: ['lothar', 'llane'],
    },
  ],
  characters: [
    {
      id: 'guldan',
      name: "Gul'dan",
      title: 'Le Traître',
      description: 'Premier sorcier orc',
      race: 'Orc',
      faction: 'Horde',
      role: 'antagonist',
      class: 'Démoniste',
    },
    {
      id: 'lothar',
      name: 'Anduin Lothar',
      title: 'Le Lion d’Azeroth',
      description: 'Commandant des armées',
      race: 'Humain',
      faction: 'Alliance',
      role: 'protagonist',
      class: 'Guerrier',
    },
    {
      id: 'medivh',
      name: 'Medivh',
      title: 'Le Gardien Corrompu',
      description: 'Dernier gardien de Tirisfal',
      race: 'Humain',
      faction: 'Alliance (corrompu)',
      role: 'antagonist',
      class: 'Mage',
    },
    {
      id: 'llane',
      name: 'Roi Llane Wrynn',
      title: 'Roi de Hurlevent',
      description: 'Monarque de Stormwind',
      race: 'Humain',
      faction: 'Alliance',
      role: 'protagonist',
      class: 'Guerrier',
    },
  ],
};

// ─── Accès au fichier HTML réel ───────────────────────────
function readRealHTML() {
  try {
    return readFileSync(HTML_PATH, 'utf-8');
  } catch {
    return null;
  }
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : '';
}

// ─── Setup DOM (préfère le fichier réel, fallback hardcodé) ─
const FALLBACK_HTML = `
  <main id="history-page">
    <header id="era-header">
      <h1></h1>
      <p class="era-subtitle"></p>
      <p class="era-date"></p>
    </header>
    <section id="timeline"></section>
    <section id="characters"></section>
    <div id="error-container" class="hidden">
      <p id="error-message"></p>
    </div>
  </main>
`;

function setupDOM() {
  const realHTML = readRealHTML();
  if (realHTML) {
    document.body.innerHTML = extractBody(realHTML);
  } else {
    document.body.innerHTML = FALLBACK_HTML;
  }
}

// ─── Lifecycle ────────────────────────────────────────────
beforeAll(() => {
  if (typeof globalThis.fetch === 'undefined') {
    globalThis.fetch = vi.fn();
  }
});

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════
//  1.  STRUCTURE DU FICHIER HTML
// ═══════════════════════════════════════════════════════════
describe('Structure de history.html', () => {
  let html;

  beforeAll(() => { html = readRealHTML(); });

  it('T-HTML-1 : le fichier history.html existe et est lisible', () => {
    expect(html).not.toBeNull();
  });

  it('T-HTML-2 : contient la déclaration <!DOCTYPE html>', () => {
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('T-HTML-3 : contient le conteneur #era-header', () => {
    expect(html).toContain('id="era-header"');
  });

  it('T-HTML-4 : contient la section #timeline', () => {
    expect(html).toContain('id="timeline"');
  });

  it('T-HTML-5 : contient la section #characters', () => {
    expect(html).toContain('id="characters"');
  });

  it('T-HTML-6 : contient #error-container et #error-message', () => {
    expect(html).toContain('id="error-container"');
    expect(html).toContain('id="error-message"');
  });

  it('T-HTML-7 : inclut le script js/history.js', () => {
    expect(html).toMatch(/src=["']js\/history\.js["']/);
  });

  it('T-HTML-8 : appelle loadHistory au chargement (DOMContentLoaded)', () => {
    expect(html).toMatch(/DOMContentLoaded/);
    expect(html).toMatch(/loadHistory\s*\(/);
  });

  it('T-HTML-9 : contient une balise <nav> pour la navigation', () => {
    expect(html).toMatch(/<nav/i);
  });

  it('T-HTML-10 : la navigation contient un lien vers index.html', () => {
    expect(html).toMatch(/href=["']index\.html["']/i);
  });
});

// ═══════════════════════════════════════════════════════════
//  2.  TESTS DE RENDU (existant, utilisent désormais le vrai HTML)
// ═══════════════════════════════════════════════════════════
describe('Rendu (rendu réel)', () => {
  describe('renderEra', () => {
    it('affiche le titre et le sous-titre dans le header', () => {
      setupDOM();
      renderEra(TEST_DATA.meta);

      expect(document.querySelector('#era-header h1').textContent).toBe('La Première Guerre');
      expect(document.querySelector('.era-subtitle').textContent).toBe('Test Subtitle');
    });

    it('affiche la période (années de début et fin)', () => {
      setupDOM();
      renderEra(TEST_DATA.meta);

      const dateEl = document.querySelector('.era-date');
      expect(dateEl.textContent).toContain('0');
      expect(dateEl.textContent).toContain('4');
    });
  });

  describe('renderTimeline', () => {
    it('crée un article par événement', () => {
      setupDOM();
      renderTimeline(TEST_DATA.timeline, TEST_DATA.characters);

      expect(document.querySelectorAll('.timeline-event').length).toBe(2);
    });

    it('affiche la date, le titre et la description', () => {
      setupDOM();
      renderTimeline(TEST_DATA.timeline, TEST_DATA.characters);

      const article = document.querySelector('.timeline-event');
      expect(article.querySelector('.event-date').textContent).toBe('An 0');
      expect(article.querySelector('.event-title').textContent).toBe("L'Ouverture du Portail");
      expect(article.querySelector('.event-description').textContent).toBe('Description du premier événement');
    });

    it('insère des liens vers les personnages associés', () => {
      setupDOM();
      renderTimeline(TEST_DATA.timeline, TEST_DATA.characters);

      const links = document.querySelector('.timeline-event').querySelectorAll('.character-link');
      expect(links.length).toBe(2);
      expect(links[0].textContent).toBe("Gul'dan");
    });

    it('gère une chronologie vide', () => {
      setupDOM();
      renderTimeline([], TEST_DATA.characters);
      expect(document.querySelectorAll('.timeline-event').length).toBe(0);
    });
  });

  describe('renderCharacters', () => {
    it('crée une fiche par personnage', () => {
      setupDOM();
      renderCharacters(TEST_DATA.characters);
      expect(document.querySelectorAll('.character-card').length).toBe(4);
    });

    it('affiche le nom, le titre et la description', () => {
      setupDOM();
      renderCharacters(TEST_DATA.characters);

      const card = document.querySelector('.character-card');
      expect(card.querySelector('.character-name').textContent).toBe("Gul'dan");
      expect(card.querySelector('.character-title').textContent).toBe('Le Traître');
      expect(card.querySelector('.character-description').textContent).toBe('Premier sorcier orc');
    });

    it('affiche les traits (race, faction, classe)', () => {
      setupDOM();
      renderCharacters(TEST_DATA.characters);

      const traits = document.querySelector('.character-card').querySelectorAll('.character-trait');
      expect(traits.length).toBe(3);
      expect(traits[0].textContent).toBe('Orc');
      expect(traits[1].textContent).toBe('Horde');
      expect(traits[2].textContent).toBe('Démoniste');
    });

    it('affiche le badge de rôle', () => {
      setupDOM();
      renderCharacters(TEST_DATA.characters);

      const protagonist = document.querySelector('[data-character-id="lothar"]');
      const antagonist = document.querySelector('[data-character-id="guldan"]');

      expect(protagonist.querySelector('.role-badge').textContent).toMatch(/protagonist/i);
      expect(antagonist.querySelector('.role-badge').textContent).toMatch(/antagonist/i);
    });

    it('gère une liste vide', () => {
      setupDOM();
      renderCharacters([]);
      expect(document.querySelectorAll('.character-card').length).toBe(0);
    });
  });

  describe('renderError', () => {
    it('affiche le message dans le conteneur', () => {
      setupDOM();
      renderError('Échec du chargement');

      const container = document.getElementById('error-container');
      expect(container.classList.contains('hidden')).toBe(false);
      expect(document.getElementById('error-message').textContent).toBe('Échec du chargement');
    });
  });

  describe('loadHistory (intégration fetch + rendu)', () => {
    it('charge et rend les données complètes', async () => {
      setupDOM();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TEST_DATA),
      });
      await loadHistory();

      expect(document.querySelectorAll('.timeline-event').length).toBe(2);
      expect(document.querySelectorAll('.character-card').length).toBe(4);
      expect(document.querySelector('#era-header h1').textContent).toBe('La Première Guerre');
    });

    it('affiche une erreur si le JSON est introuvable', async () => {
      setupDOM();
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Fichier introuvable'));
      await loadHistory();

      expect(document.getElementById('error-container').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('error-message').textContent).toBe('Fichier introuvable');
    });

    it("affiche une erreur si le serveur répond avec un code HTTP d'échec", async () => {
      setupDOM();
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      await loadHistory();

      expect(document.getElementById('error-container').classList.contains('hidden')).toBe(false);
    });
  });
});
