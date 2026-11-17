/* DeskBuddy content script: shows the buddy at the bottom of the page inside a shadow root. */
(function () {
  'use strict';
  if (window.top !== window || window.__deskBuddyLoaded) return;
  window.__deskBuddyLoaded = true;

  const api = globalThis.browser || globalThis.chrome;
  let stage = null, host = null, shadow = null, charm = null, settings = null, hiddenHere = false, charmHidden = false;

  function ensureHost() {
    if (host) return shadow;
    host = document.createElement('desk-buddy');
    host.style.cssText = 'all:initial;position:fixed;left:0;bottom:0;width:0;height:0;z-index:2147483646;';
    shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = DeskBuddy.CSS;
    shadow.appendChild(style);
    (document.body || document.documentElement).appendChild(host);
    return shadow;
  }
  let fx = null;
  function ensureFx() {
    if (!fx) fx = DeskBuddy.createFx({ mount: ensureHost(), fixed: true });
    return fx;
  }
  const FX_X = { drop: 0.16, rocket: 0.3, balloon: 0.32, peek: 0.86, car: 0.5, swing: 0.6, confetti: 0.5 };
  function ensureStage() {
    if (stage) return stage;
    ensureHost();
    stage = DeskBuddy.createStage({
      mount: shadow,
      fixed: true,
      size: Math.min(96, Math.max(64, Math.round(window.innerWidth * 0.09))),
      character: settings.character,
      closable: true,
      onAction: (action, r) => {
        if (action === 'done' && settings.effects) ensureFx().play('confetti', { x: 0.12 });
        try { api.runtime.sendMessage({ type: 'db:action', action, p: { key: r.key, id: r.id, kind: r.kind, counts: !!r.counts } }); } catch (e) { /* extension reloaded */ }
      },
      onHide: () => { hiddenHere = true; teardown(); }
    });
    return stage;
  }
  function teardown() {
    if (stage) stage.destroy();
    stage = null;
    cleanup();
  }
  function cleanup() {
    if (!stage && !charm && host) { if (fx) { fx.destroy(); fx = null; } host.remove(); host = shadow = null; }
  }
  function applyCharm() {
    const want = charmHidden ? 'none' : settings.charm;
    if (want === 'none') { if (charm) { charm.destroy(); charm = null; cleanup(); } return; }
    const len = settings.charmLen >= 0 ? settings.charmLen : (window.innerWidth < 700 ? 60 : 90);
    if (charm) { charm.setCharm(want); charm.setPosition(settings.charmX, len); return; }
    charm = DeskBuddy.createCharm({
      mount: ensureHost(), fixed: true, charm: want, closable: true,
      size: window.innerWidth < 700 ? 50 : 62, x: settings.charmX, length: len,
      onHide: () => { charmHidden = true; applyCharm(); },
      onMove: pos => {
        // Remember where the user dragged it, for every page.
        api.storage.sync.get('settings').then(res => {
          const next = DB.merge(res.settings);
          next.charmX = Math.round(pos.x * 1000) / 1000; next.charmLen = pos.length;
          return api.storage.sync.set({ settings: next });
        }).catch(() => {});
      }
    });
  }
  function apply() {
    applyCharm();
    if (hiddenHere) return;
    if (settings.pet) { ensureStage().setCharacter(settings.character); stage.setPet(true); }
    else if (stage) { stage.setCharacter(settings.character); stage.setPet(false); }
  }

  api.storage.sync.get('settings').then(res => { settings = DB.merge(res.settings); apply(); });
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) { settings = DB.merge(changes.settings.newValue); apply(); }
  });
  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'db:remind') {
      if (!settings) settings = DB.merge();
      hiddenHere = false;
      ensureStage().setCharacter(settings.character);
      const r = DeskBuddy.plan(msg.reminder, settings.reminderIcon);
      stage.remind(r);
      DeskBuddy.sound(settings.sound, r.ride);
      if (charm) charm.kick(2.4);
      if (settings.effects && r.effect) ensureFx().play(r.effect, { x: FX_X[r.effect] || 0.5, character: settings.character });
      sendResponse({ ok: true });
    }
  });
})();
