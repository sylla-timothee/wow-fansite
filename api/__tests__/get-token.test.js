import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import handler, { __resetCache } from '../get-token.js';

// ─── Constantes ───────────────────────────────────────────
const TOKEN_URL = 'https://oauth.battle.net/token';
const MOCK_TOKEN = 'BLIZZARD_MOCK_TOKEN_abc123';
const MOCK_RESPONSE = {
  access_token: MOCK_TOKEN,
  token_type: 'bearer',
  expires_in: 86400,
  scope: 'wow.profile',
};

// ─── MSW – Interception HTTP ──────────────────────────────
let blizzardCallCount = 0;
let lastBlizzardRequest = null;

const server = setupServer(
  http.post(TOKEN_URL, async ({ request }) => {
    blizzardCallCount++;
    lastBlizzardRequest = {
      authorization: request.headers.get('authorization'),
      contentType: request.headers.get('content-type'),
      body: await request.text(),
    };
    return HttpResponse.json(MOCK_RESPONSE);
  }),
);

// ─── Setup / Teardown ─────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

afterEach(() => {
  server.resetHandlers();
  __resetCache();
  blizzardCallCount = 0;
  lastBlizzardRequest = null;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

afterAll(() => server.close());

// ─── Helpers ──────────────────────────────────────────────
async function callHandler(query = {}) {
  const state = { statusCode: 200, body: null };
  const req = { query };
  const res = {
    status(code) { state.statusCode = code; return this; },
    json(data) { state.body = data; },
  };
  await handler(req, res);
  return { status: state.statusCode, body: state.body };
}

function createSlowHandler(delay = 100) {
  return http.post(TOKEN_URL, async () => {
    blizzardCallCount++;
    await new Promise(r => setTimeout(r, delay));
    return HttpResponse.json(MOCK_RESPONSE);
  });
}

// ─── Tests ────────────────────────────────────────────────
describe('api/get-token.js – serveur', () => {
  it('T1 – retourne 500 si BLIZZARD_CLIENT_ID est manquant', async () => {
    vi.stubEnv('BLIZZARD_CLIENT_ID', '');

    const { status, body } = await callHandler();

    expect(status).toBe(500);
    expect(body.error).toContain('BLIZZARD_CLIENT_ID');
  });

  it('T2 – retourne 500 si BLIZZARD_CLIENT_SECRET est manquant', async () => {
    vi.stubEnv('BLIZZARD_CLIENT_SECRET', '');

    const { status, body } = await callHandler();

    expect(status).toBe(500);
    expect(body.error).toContain('BLIZZARD_CLIENT_SECRET');
  });

  it('T3 – retourne un token valide depuis Blizzard', async () => {
    const { status, body } = await callHandler();

    expect(status).toBe(200);
    expect(body.access_token).toBe(MOCK_TOKEN);

    expect(lastBlizzardRequest).not.toBeNull();
    expect(lastBlizzardRequest.authorization).toMatch(/^Basic /);
    expect(lastBlizzardRequest.body).toBe('grant_type=client_credentials');
  });

  it('T4 – utilise le cache si le token est encore valide', async () => {
    const first = await callHandler();
    expect(first.status).toBe(200);
    expect(first.body.access_token).toBe(MOCK_TOKEN);
    expect(blizzardCallCount).toBe(1);

    const second = await callHandler();
    expect(second.status).toBe(200);
    expect(second.body.access_token).toBe(MOCK_TOKEN);
    expect(blizzardCallCount).toBe(1);
  });

  it('T5 – renouvelle le token expiré', async () => {
    const START_TIME = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => START_TIME);

    // Réponse Blizzard avec expires_in court (3600 s)
    server.use(
      http.post(TOKEN_URL, async () => {
        blizzardCallCount++;
        return HttpResponse.json({ ...MOCK_RESPONSE, expires_in: 3600 });
      }),
    );

    await callHandler();
    expect(blizzardCallCount).toBe(1);

    // Avance le temps après expiration
    Date.now.mockImplementation(() => START_TIME + 3_601_000);

    await callHandler();
    expect(blizzardCallCount).toBe(2);
  });

  it('T6 – gère une erreur Blizzard (401 Unauthorized)', async () => {
    server.use(
      http.post(TOKEN_URL, () =>
        HttpResponse.json({ error: 'invalid_client' }, { status: 401 }),
      ),
    );

    const { status, body } = await callHandler();

    expect(status).toBe(502);
    expect(body.error).toBeDefined();
  });

  it('T7 – gère un timeout / erreur réseau', async () => {
    server.use(
      http.post(TOKEN_URL, () => HttpResponse.error()),
    );

    const { status, body } = await callHandler();

    expect(status).toBe(504);
    expect(body.error).toBeDefined();
  });

  it('T28 – évite les appels multiples lors de requêtes concurrentes', async () => {
    server.use(createSlowHandler(100));

    const results = await Promise.all(
      Array.from({ length: 10 }, () => callHandler()),
    );

    results.forEach(({ status, body }) => {
      expect(status).toBe(200);
      expect(body.access_token).toBe(MOCK_TOKEN);
    });
    expect(blizzardCallCount).toBe(1);
  });
});
