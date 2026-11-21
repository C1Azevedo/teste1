const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const page = (body) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Teste ESPN</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem}
pre{background:#f4f4f4;padding:1rem;white-space:pre-wrap;word-break:break-all;border-radius:6px}
.err{color:#b00020}</style></head><body>${body}</body></html>`;

// ---------------------------------------------------------------------------
// App de Jogos da rodada
// ---------------------------------------------------------------------------
const SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const TTL_MS = 60 * 1000;

const cache = new Map(); // chave -> { data, ts }
const inflight = new Map(); // chave -> Promise
let lastCalendar = null;

function normalizeCalendar(raw) {
  const out = [];
  for (const block of raw || []) {
    if (block.value !== '2' && block.value !== '3') continue; // temporada regular e playoffs
    for (const e of block.entries || []) {
      out.push({
        key: `${block.value}-${e.value}`,
        type: Number(block.value),
        number: Number(e.value),
        label: e.label,
        detail: e.detail,
      });
    }
  }
  return out;
}

function normalizeEvent(e) {
  const c = e.competitions[0];
  const side = (ha) => {
    const t = c.competitors.find((x) => x.homeAway === ha);
    const rec = (t.records || []).find((r) => r.type === 'total') || (t.records || [])[0];
    return {
      abbr: t.team.abbreviation,
      name: t.team.displayName,
      logo: t.team.logo || t.team.logoDark || null,
      nick: t.team.name,
      color: t.team.color || null,
      alt: t.team.alternateColor || null,
      record: rec ? rec.summary : '',
      score: t.score != null ? Number(t.score) : null,
      winner: !!t.winner,
    };
  };
  return {
    id: e.id,
    date: e.date,
    state: e.status.type.state, // pre | in | post
    statusDetail: e.status.type.shortDetail,
    neutral: !!c.neutralSite,
    venue: c.venue ? c.venue.fullName : '',
    away: side('away'),
    home: side('home'),
  };
}

function normalizeBoard(d) {
  const calendar = normalizeCalendar(d.leagues && d.leagues[0] && d.leagues[0].calendar);
  if (calendar.length) lastCalendar = calendar;
  return {
    currentKey: `${d.season.type}-${d.week.number}`,
    calendar: calendar.length ? calendar : lastCalendar || [],
    bye: ((d.week && d.week.teamsOnBye) || []).map((t) => t.abbreviation),
    events: (d.events || []).map(normalizeEvent),
  };
}

async function fetchBoard(key) {
  const url = key ? `${SCOREBOARD}?seasontype=${key.split('-')[0]}&week=${key.split('-')[1]}` : SCOREBOARD;
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`ESPN respondeu ${r.status} ${r.statusText}`);
  return normalizeBoard(await r.json());
}

// Cache de 60 s por rodada; se a ESPN falhar, devolve o último dado bom.
async function getBoard(key) {
  const ck = key || 'atual';
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.ts < TTL_MS) return { ...hit.data, fetchedAt: hit.ts, stale: false };
  if (!inflight.has(ck)) {
    inflight.set(
      ck,
      fetchBoard(key)
        .then((data) => {
          cache.set(ck, { data, ts: Date.now() });
          return data;
        })
        .finally(() => inflight.delete(ck))
    );
  }
  try {
    const data = await inflight.get(ck);
    return { ...data, fetchedAt: cache.get(ck).ts, stale: false };
  } catch (err) {
    console.error('Falha ao buscar ESPN:', err.message);
    if (hit) return { ...hit.data, fetchedAt: hit.ts, stale: true };
    throw err;
  }
}

app.get('/api/jogos', async (req, res) => {
  const key = /^[23]-\d{1,2}$/.test(req.query.week || '') ? req.query.week : null;
  try {
    res.set('Cache-Control', 'no-store').json(await getBoard(key));
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.get('/teste-espn', async (_req, res) => {
  const start = Date.now();
  try {
    const r = await fetch(ESPN_URL, { signal: AbortSignal.timeout(15000) });
    const text = await r.text();
    const ms = Date.now() - start;
    res.send(
      page(`<h1>Teste ESPN</h1>
<p><b>Status:</b> ${r.status} ${esc(r.statusText)}</p>
<p><b>Tempo de resposta:</b> ${ms} ms</p>
<p><b>Primeiros 100 caracteres:</b></p>
<pre>${esc(text.slice(0, 100))}</pre>`)
    );
  } catch (err) {
    const ms = Date.now() - start;
    const full = err && err.stack ? err.stack : String(err);
    const cause = err && err.cause ? `\n\nCausa: ${err.cause.stack || err.cause}` : '';
    res.status(500).send(
      page(`<h1 class="err">Erro ao chamar a ESPN</h1>
<p><b>Tempo até o erro:</b> ${ms} ms</p>
<pre class="err">${esc(full + cause)}</pre>`)
    );
  }
});

app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));
