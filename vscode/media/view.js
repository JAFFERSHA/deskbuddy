(function () {
  const vscode = acquireVsCodeApi();
  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);
  const mount = document.getElementById('stage');
  let stage = null, charm = null, charmKey = '', settings = { character: 'mika', pet: true, charm: 'none', effects: true }, builtFor = 0, fxLayer = null;
  const fx = () => fxLayer || (fxLayer = DeskBuddy.createFx({ mount }));
  const FX_X = { drop: 0.3, rocket: 0.5, balloon: 0.55, peek: 0.8, car: 0.5, swing: 0.6, confetti: 0.5 };

  // The view can be any height, so the character is sized to fit it.
  function fitSize() {
    const h = mount.clientHeight || 160;
    return Math.round(Math.max(30, Math.min(84, (h - 8) * 0.6)));
  }
  function build() {
    if (stage && stage.isBusy()) return;
    const size = fitSize();
    if (stage && size === builtFor) return;
    if (stage) stage.destroy();
    builtFor = size;
    stage = DeskBuddy.createStage({
      mount, size, character: settings.character,
      onAction: (action, r) => {
        if (r.quiet) return;
        if (action === 'done' && settings.effects && mount.clientHeight >= 210) fx().play('confetti', { x: 0.2 });
        vscode.postMessage({ type: 'action', action, p: { key: r.key, id: r.id, kind: r.kind, counts: !!r.counts } });
      }
    });
    stage.setPet(settings.pet);
  }
  // The charm needs some height to hang in; it is skipped in very short panels.
  function buildCharm() {
    const h = mount.clientHeight || 0;
    const want = settings.charm !== 'none' && h >= 150 ? settings.charm : 'none';
    const size = Math.round(Math.max(30, Math.min(52, h * 0.2)));
    const key = want + ':' + size;
    if (key === charmKey) return;
    charmKey = key;
    if (charm) { charm.destroy(); charm = null; }
    if (want === 'none') return;
    const saved = vscode.getState() || {};
    charm = DeskBuddy.createCharm({
      mount, charm: want, size,
      x: typeof saved.x === 'number' ? saved.x : 0.78,
      length: typeof saved.length === 'number' ? Math.min(saved.length, Math.max(0, h - size * 1.6)) : Math.round(size * 0.7),
      onMove: pos => vscode.setState(pos)
    });
  }
  build(); buildCharm();
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { build(); buildCharm(); }, 150); });
  window.addEventListener('message', e => {
    const m = e.data;
    if (m.type === 'settings') { settings = { character: m.character, pet: m.pet, charm: m.charm || 'none', effects: m.effects !== false, reminderIcon: m.reminderIcon || 'mix', sound: m.sound || 'off' }; stage.setCharacter(m.character); stage.setPet(m.pet); buildCharm(); }
    if (m.type === 'remind') {
      if (charm) charm.kick(2.4);
      if (mount.clientHeight >= 210) {
        const r = DeskBuddy.plan(m.reminder, settings.reminderIcon);
        stage.remind(r);
        DeskBuddy.sound(settings.sound, r.ride);
        if (settings.effects && r.effect) fx().play(r.effect, { x: FX_X[r.effect] || 0.5, character: settings.character });
        return;
      }
      // Panel too short for the bubble and buttons: wave here, and let VS Code show the question.
      vscode.postMessage({ type: 'fallback', p: m.reminder });
      stage.remind({ id: m.reminder.id, kind: m.reminder.kind, quiet: true, text: 'Hey!', actions: [], timeout: 5000 });
    }
  });
  document.getElementById('pro').addEventListener('click', () => vscode.postMessage({ type: 'pro' }));
  vscode.postMessage({ type: 'ready' });
})();
