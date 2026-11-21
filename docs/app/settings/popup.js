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
    Object.keys(DeskBuddy.CHARACTERS).sort((a, b) => DeskBuddy.CHARACTERS[a].pro - DeskBuddy.CHARACTERS[b].pro).forEach(id => {
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
        b.addEventListener('click', () => $('pro').scrollIntoView({ behavior: 'smooth', block: 'center' }));
      } else {
        b.setAttribute('aria-pressed', String(settings.character === id));
        b.addEventListener('click', () => {
          settings.character = id; save(); renderChars(); renderRides();
          stage.setCharacter(id); stage.poke();
        });
      }
      box.appendChild(b);
    });
    DeskBuddy.render($('logo'), settings.character);
  }

  function renderRides() {
    const box = $('rides');
    box.textContent = '';
    const opts = [['buddy', 'My buddy'], ['mix', 'Surprise me']].concat(Object.keys(DeskBuddy.RIDES).map(k => [k, DeskBuddy.RIDES[k].name]));
    opts.forEach(([id, name]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'char';
      if (id === 'buddy') { const h = document.createElement('span'); h.className = 'ride-art'; DeskBuddy.render(h, settings.character); b.appendChild(h); }
      else if (id === 'mix') { const x = document.createElement('span'); x.className = 'none'; x.textContent = '\u2728'; b.appendChild(x); }
      else { const h = document.createElement('span'); h.className = 'ride-art'; DeskBuddy.renderRide(h, id); b.appendChild(h); }
      const label = document.createElement('span');
      label.textContent = name;
      b.appendChild(label);
      b.setAttribute('aria-pressed', String(settings.reminderIcon === id));
      b.addEventListener('click', () => {
        settings.reminderIcon = id; save(); renderRides();
        stage.remind(DeskBuddy.plan({ id: 'preview', kind: 'preview', title: 'Preview', text: 'This is how I will bring your reminders.', timeout: 6000,
          actions: [{ id: 'done', label: 'Got it', primary: true }, { id: 'later', label: 'Later' }] }, id === 'mix' ? (() => { const k = Object.keys(DeskBuddy.RIDES); return k[Math.floor(Math.random() * k.length)]; })() : id));
        DeskBuddy.sound(settings.sound, id === 'buddy' ? null : id);
      });
      box.appendChild(b);
    });
  }

  function renderCharms() {
    const box = $('charms');
    box.textContent = '';
    ['none'].concat(Object.keys(DeskBuddy.CHARMS)).forEach(id => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'char';
      if (id === 'none') { const x = document.createElement('span'); x.className = 'none'; x.textContent = '\u2715'; b.appendChild(x); }
      else DeskBuddy.renderCharm(b, id);
      const label = document.createElement('span');
      label.textContent = id === 'none' ? 'None' : DeskBuddy.CHARMS[id].name;
      b.appendChild(label);
      b.setAttribute('aria-pressed', String(settings.charm === id));
      b.addEventListener('click', () => { settings.charm = id; save(); renderCharms(); });
      box.appendChild(b);
    });
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

  const REPEAT = { once: 'Once', daily: 'Every day', weekdays: 'Weekdays' };
  function renderSchedules() {
    const box = $('schedules');
    box.textContent = '';
    if (!settings.schedules.length) {
      const p = document.createElement('p'); p.className = 'empty';
      p.textContent = 'None yet. Add one for a meeting, medicine or anything at a set time.';
      box.appendChild(p); return;
    }
    settings.schedules.forEach((sc, i) => {
      const row = document.createElement('div'); row.className = 'sched';
      const sw = document.createElement('input');
      sw.type = 'checkbox'; sw.className = 'switch'; sw.checked = sc.on;
      sw.setAttribute('aria-label', 'Turn on ' + sc.text);
      sw.addEventListener('change', () => { sc.on = sw.checked; save(); });
      const info = document.createElement('div');
      const b = document.createElement('b'); b.textContent = sc.text;
      const sm = document.createElement('small');
      sm.textContent = sc.time + ' \u00b7 ' + REPEAT[sc.repeat] + (sc.warn ? ' \u00b7 ' + sc.warn + ' min warning' : '');
      info.append(b, sm);
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'del'; del.textContent = '\u2715';
      del.setAttribute('aria-label', 'Delete ' + sc.text);
      del.addEventListener('click', () => { settings.schedules.splice(i, 1); save(); renderSchedules(); });
      row.append(sw, info, del);
      box.appendChild(row);
    });
  }

  async function renderFocus() {
    const { engine } = await api.storage.local.get('engine');
    const f = engine && engine.focus;
    const on = !!(f && f.on);
    $('focus-toggle').textContent = on ? 'Stop focus timer' : 'Start focus timer';
    $('focus-toggle').dataset.on = on ? '1' : '';
    if (on) {
      const mins = Math.max(0, Math.ceil((f.until - Date.now()) / 60000));
      $('focus-status').textContent = (f.phase === 'work' ? 'Working' : 'On a break') + ': ' + mins + ' min left. The break reminder is paused while this runs.';
    } else $('focus-status').textContent = 'The buddy tells you when to take a break and when to get back to work.';
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

  async function renderWeek() {
    const { stats } = await api.storage.local.get('stats');
    const w = DBEngine.weekSummary(stats, Date.now());
    const box = $('week'); box.textContent = '';
    const max = Math.max(1, ...w.days.map(d => d.total));
    w.days.forEach(d => {
      const col = document.createElement('div');
      col.className = 'd' + (d.total ? ' has' : '') + (d.today ? ' today' : '');
      const n = document.createElement('span'); n.className = 'n'; n.textContent = d.total || '';
      const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = Math.round(4 + (d.total / max) * 40) + 'px';
      const l = document.createElement('span'); l.textContent = d.label;
      col.append(n, bar, l); box.appendChild(col);
    });
    $('streak').textContent = w.streak ? w.streak + (w.streak === 1 ? ' day' : '-day') + ' streak. ' + w.total + ' reminders finished this week.' : 'Finish a reminder to start a streak.';
  }

  async function init() {
    const res = await api.storage.sync.get('settings');
    settings = DB.merge(res.settings);
    stage = DeskBuddy.createStage({
      mount: $('preview'), size: 72, character: settings.character,
      onAction: (action, r) => { if (action === 'done') setTimeout(() => { renderStat(); renderWeek(); }, 400); }
    });
    stage.setPet(true);
    $('name').value = settings.name === 'friend' ? '' : settings.name;
    $('pet').checked = settings.pet;
    renderChars(); renderRides(); renderCharms(); renderReminders(); renderPause(); renderStat(); renderWeek(); renderSchedules(); renderFocus();
    $('sound').value = settings.sound;
    $('sound').addEventListener('change', () => { settings.sound = $('sound').value; save(); DeskBuddy.sound(settings.sound, null); });

    $('sched-form').addEventListener('submit', e => {
      e.preventDefault();
      const text = $('sched-text').value.trim(), time = $('sched-time').value;
      if (!text || !time || settings.schedules.length >= 20) return;
      settings.schedules.push({ id: 't' + Date.now().toString(36), text, time, repeat: $('sched-repeat').value, warn: Number($('sched-warn').value), on: true });
      save(); renderSchedules();
      $('sched-text').value = '';
    });
    $('focus-work').value = settings.focus.work; $('focus-rest').value = settings.focus.rest;
    const focusChange = () => {
      settings.focus = { work: Math.max(1, Math.min(180, Math.round(Number($('focus-work').value)) || 50)), rest: Math.max(1, Math.min(60, Math.round(Number($('focus-rest').value)) || 10)) };
      $('focus-work').value = settings.focus.work; $('focus-rest').value = settings.focus.rest; save();
    };
    $('focus-work').addEventListener('change', focusChange); $('focus-rest').addEventListener('change', focusChange);
    $('focus-toggle').addEventListener('click', async () => {
      await api.runtime.sendMessage({ type: 'db:focus', on: !$('focus-toggle').dataset.on });
      renderFocus();
    });
    $('snooze').value = String(settings.snooze);
    $('snooze').addEventListener('change', () => { settings.snooze = Number($('snooze').value); save(); });
    $('quiet-on').checked = settings.quiet.on; $('quiet-from').value = settings.quiet.from; $('quiet-to').value = settings.quiet.to;
    const quietChange = () => { settings.quiet = { on: $('quiet-on').checked, from: $('quiet-from').value || '22:00', to: $('quiet-to').value || '08:00' }; save(); };
    ['quiet-on', 'quiet-from', 'quiet-to'].forEach(id => $(id).addEventListener('change', quietChange));
    $('summary-on').checked = settings.summary.on; $('summary-time').value = settings.summary.time;
    const sumChange = () => { settings.summary = { on: $('summary-on').checked, time: $('summary-time').value || '18:00' }; save(); };
    ['summary-on', 'summary-time'].forEach(id => $(id).addEventListener('change', sumChange));
    $('effects').checked = settings.effects;
    $('effects').addEventListener('change', () => { settings.effects = $('effects').checked; save(); });

    $('name').addEventListener('change', () => { settings.name = $('name').value.trim() || 'friend'; save(); });
    $('pet').addEventListener('change', () => { settings.pet = $('pet').checked; save(); });
    $('pause').addEventListener('click', () => {
      settings.pausedUntil = settings.pausedUntil > Date.now() ? 0 : Date.now() + 3600000;
      save(); renderPause();
    });

    renderPro((await api.storage.local.get('waitlist')).waitlist);
    // VS Code's "Preview Pro" command opens this page at the Pro box.
    const showPro = () => $('pro').scrollIntoView({ block: 'start' });
    if (document.body.dataset.focus === 'pro') showPro();
    addEventListener('message', e => { if (e.data && e.data.type === 'db:show-pro') showPro(); });
  }

  /* ---- Pro preview: locked characters, "what would you use" picks, email sign-up ---- */
  const wants = new Set();
  function renderPro(joined) {
    const chars = $('prochars');
    chars.textContent = '';
    Object.keys(DeskBuddy.CHARACTERS).filter(id => DeskBuddy.CHARACTERS[id].pro).forEach(id => {
      const d = document.createElement('div');
      DeskBuddy.render(d, id);
      const n = document.createElement('span');
      n.textContent = DeskBuddy.CHARACTERS[id].name;
      d.appendChild(n);
      chars.appendChild(d);
    });
    const box = $('wants');
    box.textContent = '';
    DB.PRO_FEATURES.forEach(f => {
      const b = document.createElement('button');
      b.type = 'button';
      const i = document.createElement('span'); i.className = 'ic'; i.textContent = f.icon;
      const t = document.createElement('b'); t.textContent = f.name;
      const m = document.createElement('small'); m.textContent = f.text;
      b.append(i, t, m);
      const sync = () => b.setAttribute('aria-pressed', String(wants.has(f.id)));
      sync();
      b.addEventListener('click', () => { wants.has(f.id) ? wants.delete(f.id) : wants.add(f.id); sync(); });
      box.appendChild(b);
    });
    if (joined) { (joined.wants || []).forEach(w => wants.add(w)); showJoined(joined); }
    $('waitlist').addEventListener('submit', join);
  }

  async function join(e) {
    e.preventDefault();
    const btn = $('waitlist').querySelector('button');
    const isFirefox = !!(globalThis.browser && browser.runtime && browser.runtime.getBrowserInfo);
    // Firefox asks the user before an add-on may send personal data; must run straight from the click.
    let allowed = true;
    if (DB.WAITLIST_KEY && isFirefox && browser.permissions) {
      try { allowed = await browser.permissions.request({ data_collection: ['personallyIdentifyingInfo'] }); } catch (err) { allowed = false; }
    }
    const manifest = api.runtime.getManifest ? api.runtime.getManifest() : null;
    const entry = { email: $('email').value.trim().slice(0, 200), wants: [...wants], source: api.host || (isFirefox ? 'Firefox' : 'Edge/Chrome'),
      version: manifest ? manifest.version : '', ts: Date.now(), sent: false };
    btn.disabled = true; btn.textContent = 'Sending\u2026';
    if (allowed && DB.WAITLIST_KEY) {
      // Sent from this page in every app: Web3Forms' free plan refuses server-side (Node) requests.
      entry.sent = await DB.sendWaitlist(entry, globalThis.fetch && globalThis.fetch.bind(globalThis));
    }
    btn.disabled = false; btn.textContent = 'Notify me';
    if (allowed && DB.WAITLIST_KEY && !entry.sent) {
      $('waitmsg').hidden = false;
      $('waitmsg').textContent = 'Could not send right now. Check your connection and try again.';
      return;
    }
    await api.storage.local.set({ waitlist: entry });
    showJoined(entry);
  }

  function showJoined(entry) {
    $('waitlist').hidden = true; $('waitmsg').hidden = true; $('joined').hidden = false;
    $('wants').querySelectorAll('button').forEach(b => { b.disabled = true; });
    $('joinedtext').textContent = entry.sent
      ? 'We will email ' + entry.email + ' when Pro is ready.'
      : 'Your interest in Pro is saved (' + entry.email + ').';
  }
  init();
})();
