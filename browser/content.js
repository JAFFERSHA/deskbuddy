/* DeskBuddy content script: shows the buddy at the bottom of the page inside a shadow root. */
(function () {
  'use strict';
  if (window.top !== window || window.__deskBuddyLoaded) return;
  window.__deskBuddyLoaded = true;

  const api = globalThis.browser || globalThis.chrome;
  let stage = null, host = null, settings = null, hiddenHere = false;

  function ensureStage() {
    if (stage) return stage;
    host = document.createElement('desk-buddy');
    host.style.cssText = 'all:initial;position:fixed;left:0;bottom:0;width:0;height:0;z-index:2147483646;';
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = DeskBuddy.CSS;
    shadow.appendChild(style);
    (document.body || document.documentElement).appendChild(host);
    stage = DeskBuddy.createStage({
      mount: shadow,
      fixed: true,
      size: Math.min(96, Math.max(64, Math.round(window.innerWidth * 0.09))),
      character: settings.character,
      closable: true,
      onAction: (action, r) => {
        if (action === 'timeout') action = 'later';
        try { api.runtime.sendMessage({ type: 'db:action', id: r.id, action }); } catch (e) { /* extension reloaded */ }
      },
      onHide: () => { hiddenHere = true; teardown(); }
    });
    return stage;
  }
  function teardown() {
    if (stage) stage.destroy();
    if (host) host.remove();
    stage = host = null;
  }
  function apply() {
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
      stage.remind(msg.reminder);
      sendResponse({ ok: true });
    }
  });
})();
