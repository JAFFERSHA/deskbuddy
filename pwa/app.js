/* DeskBuddy web app: draws the buddy on the page, runs the shared reminder engine, stores everything in localStorage. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'deskbuddy.v1';
  let store = { sync: {}, local: {} };
  try { store = Object.assign({ sync: {}, local: {} }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* first run or storage blocked */ }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage full or blocked */ } }
  const settings = () => DB.merge(store.sync.settings);

  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);
  let stage = null, charm = null, petHidden = false, charmHidden = false;
  const fx = DeskBuddy.createFx({ mount: document.body, fixed: true });
  const FX_X = { drop: 0.12, rocket: 0.24, balloon: 0.26, peek: 0.88, car: 0.5, swing: 0.6, confetti: 0.5 };
  const stageSize = () => Math.max(84, Math.min(150, Math.round(Math.min(innerWidth, innerHeight) * 0.14)));

  function ensureStage() {
    if (stage) return stage;
    stage = DeskBuddy.createStage({
      mount: document.body, fixed: true, size: stageSize(), character: settings().character, closable: true,
      onAction: (action, r) => {
        if (action === 'done' && settings().effects) fx.play('confetti', { x: 0.1 });
        onAction(action, { key: r.key, id: r.id, kind: r.kind, counts: !!r.counts });
      },
      onHide: () => { petHidden = true; stage.setPet(false); }
    });
    return stage;
  }
  function apply() {
    const s = settings();
    ensureStage().setCharacter(s.character);
    stage.setPet(s.pet && !petHidden);
    const want = charmHidden ? 'none' : s.charm;
    if (want === 'none') { if (charm) { charm.destroy(); charm = null; } }
    else if (charm) charm.setCharm(want);
    else {
      charm = DeskBuddy.createCharm({
        mount: document.body, fixed: true, charm: want, size: 70, x: s.charmX, length: s.charmLen >= 0 ? s.charmLen : 110, closable: true,
        onHide: () => { charmHidden = true; apply(); },
        onMove: pos => { const c = settings(); c.charmX = Math.round(pos.x * 1000) / 1000; c.charmLen = Math.round(pos.length) || 0; store.sync.settings = c; persist(); }
      });
    }
    stats();
  }
  function stats() {
    const n = store.local.stats && store.local.stats.day === DB.today() ? (store.local.stats.counts.water || 0) : 0;
    $('stat').textContent = n ? n + ' water check-in' + (n === 1 ? '' : 's') + ' today' : 'No sips logged today';
  }

  async function notify(payload) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      const opts = { body: payload.text, icon: 'icon-192.png', tag: 'db-' + payload.key };
      if (reg) reg.showNotification(payload.title || 'DeskBuddy', opts); else new Notification(payload.title || 'DeskBuddy', opts);
    } catch (e) { /* notifications unavailable */ }
  }
  function remind(r) {
    const s = settings();
    if (document.hidden) notify(r);
    petHidden = false;
    const p = DeskBuddy.plan(r, s.reminderIcon);
    ensureStage().remind(p);
    DeskBuddy.sound(s.sound, p.ride);
    if (charm) charm.kick(2.4);
    if (s.effects && p.effect) fx.play(p.effect, { x: FX_X[p.effect] || 0.5, character: s.character });
  }
  function onAction(action, p) {
    if (!p || typeof p.key !== 'string') return;
    const res = DBEngine.act(settings(), store.local.engine, store.local.stats, p, String(action), Date.now());
    store.local.engine = res.state; store.local.stats = res.stats;
    persist(); stats();
  }
  function tick() {
    const s = settings();
    const res = DBEngine.tick(s, store.local.engine, Date.now(), store.local.stats, DB.REMINDERS);
    store.local.engine = res.state;
    if (res.settingsChanged) { store.sync.settings = s; reloadSettingsFrame(); }
    persist();
    if (res.payload) remind(res.payload);
  }
  const fire = id => { if (DB.REMINDERS[id]) remind(DBEngine.intervalPayload(id, settings(), DB.REMINDERS)); };

  // The shared settings page runs in an iframe and talks to this object through its `browser` shim (settings-shim.js).
  window.DBApp = {
    get: (area, key) => (store[area] || {})[key],
    set: (area, obj) => {
      if (area !== 'sync' && area !== 'local') return;
      if (obj && typeof obj === 'object') Object.assign(store[area], obj);
      if (area === 'sync') store.sync.settings = DB.merge(store.sync.settings);
      persist(); apply();
    },
    message: msg => {
      if (msg && msg.type === 'db:test') { $('settings').classList.remove('on'); fire(msg.id); }
      else if (msg && msg.type === 'db:focus') { store.local.engine = DBEngine.setFocus(settings(), store.local.engine, !!msg.on, Date.now()); persist(); }
      return { ok: true };
    }
  };
  function reloadSettingsFrame() { if ($('settings').classList.contains('on')) $('frame').contentWindow.location.reload(); }

  // Buttons
  const tryBox = $('try');
  Object.keys(DB.REMINDERS).forEach(id => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = DB.REMINDERS[id].title;
    b.onclick = () => { $('panel').hidden = true; fire(id); };
    tryBox.appendChild(b);
  });
  $('btn-panel').onclick = () => { $('panel').hidden = !$('panel').hidden; };
  $('btn-settings').onclick = () => { $('panel').hidden = true; $('frame').src = 'settings/popup.html'; $('settings').classList.add('on'); };
  $('btn-close').onclick = () => { $('settings').classList.remove('on'); $('frame').src = 'about:blank'; apply(); };
  document.addEventListener('pointerdown', e => { if (!$('panel').hidden && !e.target.closest('#panel, #btn-panel')) $('panel').hidden = true; });

  const nb = $('btn-notif');
  function notifUi() {
    if (!('Notification' in window)) { nb.hidden = true; $('notif-note').textContent = 'This browser does not support notifications. The buddy still shows on screen.'; return; }
    if (Notification.permission === 'granted') { nb.textContent = 'Notifications are on'; nb.disabled = true; }
    else if (Notification.permission === 'denied') { nb.textContent = 'Blocked in browser settings'; nb.disabled = true; }
  }
  nb.onclick = async () => { try { await Notification.requestPermission(); } catch (e) { /* ignore */ } notifUi(); };
  notifUi();
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (/iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document && !standalone) $('ios').style.display = 'block';

  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
  try { if (navigator.wakeLock && !document.hidden) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* ignore */ }

  apply();
  setInterval(tick, 20000);
  setTimeout(() => { if (!store.local.welcomed) { store.local.welcomed = true; persist(); fire('water'); } }, 800);
})();
