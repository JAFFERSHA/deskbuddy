(function () {
  'use strict';
  const host = window.deskbuddyHost;
  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);

  let settings = null, stage = null, charm = null, petHidden = false, charmHidden = false;

  function ensureStage() {
    if (stage) return stage;
    stage = DeskBuddy.createStage({
      mount: document.body, fixed: true, size: 100, character: settings.character, closable: true,
      onAction: (action, r) => host.action(action === 'timeout' ? 'later' : action, r.id),
      onHide: () => { petHidden = true; stage.setPet(false); }
    });
    return stage;
  }
  function apply() {
    ensureStage().setCharacter(settings.character);
    stage.setPet(settings.pet && !petHidden);
    const want = charmHidden ? 'none' : settings.charm;
    if (want === 'none') { if (charm) { charm.destroy(); charm = null; } return; }
    const len = settings.charmLen >= 0 ? settings.charmLen : 110;
    if (charm) { charm.setCharm(want); return; }
    charm = DeskBuddy.createCharm({
      mount: document.body, fixed: true, charm: want, size: 70, x: settings.charmX, length: len, closable: true,
      onHide: () => { charmHidden = true; apply(); },
      onMove: pos => host.charmMoved(pos)
    });
  }

  host.onSettings(s => {
    // Choosing something again in the menu brings back anything hidden with the x button.
    if (settings && s.pet && !settings.pet) petHidden = false;
    if (settings && s.charm !== settings.charm) charmHidden = false;
    settings = s; apply();
  });
  host.onRemind(r => { if (!settings) return; petHidden = false; ensureStage().remind(r); if (charm) charm.kick(2.4); });

  // The window ignores the mouse everywhere except over the buddy, its bubble and the charm.
  let over = false, pressed = false;
  function check(e) {
    const hit = !!(e.target && e.target.closest && e.target.closest('.db-actor, .db-bubble, .db-charm-body'));
    if (hit !== over && !pressed) { over = hit; host.setIgnore(!hit); }
  }
  window.addEventListener('mousemove', check);
  window.addEventListener('pointerdown', () => { pressed = true; });
  window.addEventListener('pointerup', e => { pressed = false; check(e); });
  window.addEventListener('mouseleave', () => { if (!pressed) { over = false; host.setIgnore(true); } });
  host.ready();
})();
