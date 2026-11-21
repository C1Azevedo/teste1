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

app.get('/', (_req, res) => {
  res.send(page('<h1>Teste NFL</h1><p><a href="/teste-espn">/teste-espn</a></p>'));
});

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
