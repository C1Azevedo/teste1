(() => {
  const TZ = 'America/Sao_Paulo';
  const $ = (id) => document.getElementById(id);
  const listEl = $('list'), weeksEl = $('weeks'), statusEl = $('status');
  let calendar = [], currentKey = null, selected = null, timer = null, reqId = 0;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: TZ });
  const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
  const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TZ });

  const POST = { 'Wild Card': 'Wild Card', 'Divisional Round': 'Divisional', 'Conference Championship': 'Conferência', 'Super Bowl': 'Super Bowl', 'Pro Bowl': 'Pro Bowl' };
  function chipLabel(w) {
    return w.type === 2 ? `Sem ${w.number}` : POST[w.label] || w.label;
  }

  function renderWeeks() {
    weeksEl.innerHTML = calendar
      .map((w) => `<button class="chip${w.key === selected ? ' active' : ''}" data-key="${w.key}">${esc(chipLabel(w))}</button>`)
      .join('');
    const a = weeksEl.querySelector('.active');
    if (a) a.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  function team(t, mark) {
    const img = t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=ph></div>'">` : '<div class="ph"></div>';
    return `<div class="team" title="${esc(t.name)}">${img}<div class="abbr">${mark ? `<span class="mark">${mark}</span>` : ''}${esc(t.abbr)}</div><div class="rec">${esc(t.record)}</div></div>`;
  }

  function center(g) {
    const d = new Date(g.date);
    if (g.state === 'pre') {
      const day = dayFmt.format(d).replace('.', '');
      return `<div class="day">${esc(day)} · ${dateFmt.format(d)}</div><div class="time">${timeFmt.format(d)}</div>`;
    }
    const a = g.away.score, h = g.home.score;
    const cls = (x, y) => (g.state === 'post' ? (x > y ? 'w' : x < y ? 'l' : '') : '');
    const sub = g.state === 'in'
      ? `<div class="sub live"><span class="dot"></span>${esc(g.statusDetail)}</div>`
      : `<div class="sub final">${esc(g.statusDetail)}</div>`;
    return `<div class="score"><span class="${cls(a, h)}">${a}</span><span class="dash">–</span><span class="${cls(h, a)}">${h}</span></div>${sub}`;
  }

  function card(g) {
    const bc = g.broadcast || 'ESPN e Disney Plus';
    return `<article class="card">
      <div class="match">${team(g.away, '')}<div class="center">${center(g)}</div>${team(g.home, g.neutral ? 'vs' : '@')}</div>
      <div class="foot"><span>${esc(g.venue)}</span><span class="bc">${esc(bc)}</span></div>
    </article>`;
  }

  function render(data) {
    calendar = data.calendar || calendar;
    currentKey = data.currentKey;
    if (!selected) selected = currentKey;
    renderWeeks();
    listEl.innerHTML = data.events.length
      ? data.events.map(card).join('') + (data.bye.length ? `<p class="bye">Folga: ${esc(data.bye.join(', '))}</p>` : '')
      : '<p class="msg">Nenhum jogo nesta semana.</p>';
    const t = new Date(data.fetchedAt);
    statusEl.className = 'status' + (data.stale ? ' stale' : '');
    statusEl.textContent = data.stale
      ? `Sem conexão com a ESPN · dados de ${timeFmt.format(t)}`
      : `Atualizado ${timeFmt.format(t)}`;
  }

  async function load(key, { quiet = false } = {}) {
    const id = ++reqId;
    if (!quiet) listEl.innerHTML = '<p class="msg">Carregando…</p>';
    try {
      const r = await fetch('/api/jogos' + (key ? `?week=${key}` : ''), { cache: 'no-store' });
      const data = await r.json();
      if (id !== reqId) return;
      if (!r.ok) throw new Error(data.error || r.status);
      render(data);
    } catch (e) {
      if (id !== reqId) return;
      if (quiet) { statusEl.className = 'status stale'; statusEl.textContent = 'Falha ao atualizar'; return; }
      listEl.innerHTML = `<p class="msg err">Não foi possível carregar os jogos.<br><small>${esc(e.message)}</small></p>`;
    }
  }

  weeksEl.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b || b.dataset.key === selected) return;
    selected = b.dataset.key;
    renderWeeks();
    load(selected);
    window.scrollTo({ top: 0 });
  });

  // Atualiza sozinho a cada 60 s enquanto a aba está visível
  function schedule() {
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) load(selected, { quiet: true }); }, 60000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && selected) load(selected, { quiet: true }); });

  load(null).then(schedule);
})();
