(function () {
  'use strict';
  const host = window.deskbuddyHost;
  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);

  let settings = null, stage = null, charm = null, petHidden = false, charmHidden = false;
  const fx = DeskBuddy.createFx({ mount: document.body, fixed: true });
  const FX_X = { drop: 0.12, rocket: 0.24, balloon: 0.26, peek: 0.88, car: 0.5, swing: 0.6, confetti: 0.5 };

  function ensureStage() {
    if (stage) return stage;
    stage = DeskBuddy.createStage({
      mount: document.body, fixed: true, size: 100, character: settings.character, closable: true,
      onAction: (action, r) => {
        if (action === 'done' && settings.effects) fx.play('confetti', { x: 0.1 });
        host.action(action, { key: r.key, id: r.id, kind: r.kind, counts: !!r.counts });
      },
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
  host.onRemind(r => {
    if (!settings) return;
    petHidden = false;
    const p = DeskBuddy.plan(r, settings.reminderIcon);
    ensureStage().remind(p);
    DeskBuddy.sound(settings.sound, p.ride);
    if (charm) charm.kick(2.4);
    if (settings.effects && p.effect) fx.play(p.effect, { x: FX_X[p.effect] || 0.5, character: settings.character });
  });

  // The window ignores the mouse everywhere except over the buddy, its bubble and the charm.
  let over = false, pressed = false;
  function check(e) {
    const hit = !!(e.target && e.target.closest && e.target.closest('.db-actor, .db-bubble, .db-charm-body, .db-fx-click'));
    if (hit !== over && !pressed) { over = hit; host.setIgnore(!hit); }
  }
  window.addEventListener('mousemove', check);
  window.addEventListener('pointerdown', () => { pressed = true; });
  window.addEventListener('pointerup', e => { pressed = false; check(e); });
  window.addEventListener('mouseleave', () => { if (!pressed) { over = false; host.setIgnore(true); } });
  host.ready();
})();
