(function () {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;
  const $ = id => document.getElementById(id);
  let settings = DB.merge();
  let stage;

  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);

  function save() { return api.storage.sync.set({ settings }); }

  function renderChars() {
    const box = $('chars');
    box.textContent = '';
    Object.keys(DeskBuddy.CHARACTERS).forEach(id => {
      const c = DeskBuddy.CHARACTERS[id];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'char' + (c.pro ? ' locked' : '');
      DeskBuddy.render(b, id);
      const label = document.createElement('span');
      label.textContent = c.name;
      b.appendChild(label);
      if (c.pro) {
        const lock = document.createElement('span');
        lock.className = 'lock';
        lock.textContent = 'PRO';
        b.appendChild(lock);
        b.setAttribute('aria-label', c.name + ' (Pro, coming soon)');
        b.addEventListener('click', () => $('interest').scrollIntoView({ behavior: 'smooth', block: 'center' }));
      } else {
        b.setAttribute('aria-pressed', String(settings.character === id));
        b.addEventListener('click', () => {
          settings.character = id; save(); renderChars();
          stage.setCharacter(id); stage.poke();
        });
      }
      box.appendChild(b);
    });
    DeskBuddy.render($('logo'), settings.character);
  }

  function renderReminders() {
    const box = $('reminders');
    box.textContent = '';
    Object.keys(DB.REMINDERS).forEach(id => {
      const meta = DB.REMINDERS[id], r = settings.reminders[id];
      const row = document.createElement('div');
      row.className = 'rem';
      const sw = document.createElement('input');
      sw.type = 'checkbox'; sw.className = 'switch'; sw.checked = r.on;
      sw.setAttribute('aria-label', meta.title + ' reminder');
      sw.addEventListener('change', () => { r.on = sw.checked; save(); });
      const title = document.createElement('b');
      title.textContent = meta.title;
      const every = document.createElement('label');
      every.className = 'every';
      const num = document.createElement('input');
      num.type = 'number'; num.min = 1; num.max = 600; num.value = r.every;
      num.addEventListener('change', () => {
        r.every = Math.max(1, Math.min(600, Math.round(Number(num.value) || meta.every)));
        num.value = r.every; save();
      });
      every.append('every ', num, ' min');
      const tryBtn = document.createElement('button');
      tryBtn.type = 'button'; tryBtn.className = 'try'; tryBtn.textContent = 'Try';
      tryBtn.setAttribute('aria-label', 'Try ' + meta.title + ' reminder now');
      tryBtn.addEventListener('click', () => {
        stage.remind(DB.reminderPayload(id, settings));
        api.runtime.sendMessage({ type: 'db:test', id });
      });
      row.append(sw, title, every, tryBtn);
      if (id === 'custom') {
        const txt = document.createElement('input');
        txt.type = 'text'; txt.maxLength = 160; txt.value = r.text;
        txt.setAttribute('aria-label', 'Custom reminder text');
        txt.addEventListener('change', () => { r.text = txt.value.trim() || meta.text; save(); });
        row.appendChild(txt);
      }
      box.appendChild(row);
    });
  }

  function renderPause() {
    const paused = settings.pausedUntil > Date.now();
    $('pause').textContent = paused ? 'Resume' : 'Pause 1h';
  }

  async function renderStat() {
    const { stats } = await api.storage.local.get('stats');
    const n = stats && stats.day === DB.today() ? (stats.counts.water || 0) : 0;
    $('stat').textContent = n ? n + (n === 1 ? ' sip' : ' sips') + ' logged today' : 'No sips logged today';
  }

  async function init() {
    const res = await api.storage.sync.get('settings');
    settings = DB.merge(res.settings);
    stage = DeskBuddy.createStage({
      mount: $('preview'), size: 72, character: settings.character,
      onAction: (action, r) => { if (action === 'done') setTimeout(renderStat, 400); }
    });
    stage.setPet(true);
    $('name').value = settings.name === 'friend' ? '' : settings.name;
    $('pet').checked = settings.pet;
    renderChars(); renderReminders(); renderPause(); renderStat();

    $('name').addEventListener('change', () => { settings.name = $('name').value.trim() || 'friend'; save(); });
    $('pet').addEventListener('change', () => { settings.pet = $('pet').checked; save(); });
    $('pause').addEventListener('click', () => {
      settings.pausedUntil = settings.pausedUntil > Date.now() ? 0 : Date.now() + 3600000;
      save(); renderPause();
    });

    const wl = await api.storage.local.get('waitlist');
    if (wl.waitlist) showJoined();
    $('interest').addEventListener('click', () => { $('interest').hidden = true; $('waitlist').hidden = false; $('email').focus(); });
    $('waitlist').addEventListener('submit', async e => {
      e.preventDefault();
      const entry = { email: $('email').value.trim(), source: 'browser', ts: Date.now(), sent: false };
      if (DB.WAITLIST_ENDPOINT) {
        try {
          const r = await fetch(DB.WAITLIST_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
          entry.sent = r.ok;
        } catch (err) { entry.sent = false; }
      }
      await api.storage.local.set({ waitlist: entry });
      showJoined();
    });
  }
  function showJoined() {
    $('interest').hidden = true; $('waitlist').hidden = true;
    $('waitmsg').hidden = false;
    $('waitmsg').textContent = 'Thanks! Your interest in Pro is saved.';
  }
  init();
})();
