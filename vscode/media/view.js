(function () {
  const vscode = acquireVsCodeApi();
  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);
  const mount = document.getElementById('stage');
  let stage = null, settings = { character: 'mika', pet: true }, builtFor = 0;

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
      onAction: (action, r) => { if (!r.quiet) vscode.postMessage({ type: 'action', action, id: r.id }); }
    });
    stage.setPet(settings.pet);
  }
  build();
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 150); });
  window.addEventListener('message', e => {
    const m = e.data;
    if (m.type === 'settings') { settings = { character: m.character, pet: m.pet }; stage.setCharacter(m.character); stage.setPet(m.pet); }
    if (m.type === 'remind') {
      if (mount.clientHeight >= 210) { stage.remind(m.reminder); return; }
      // Panel too short for the bubble and buttons: wave here, and let VS Code show the question.
      vscode.postMessage({ type: 'fallback', id: m.reminder.id });
      stage.remind({ id: m.reminder.id, kind: m.reminder.kind, quiet: true, text: 'Hey!', actions: [], timeout: 5000 });
    }
  });
  document.getElementById('pro').addEventListener('click', () => vscode.postMessage({ type: 'pro' }));
  vscode.postMessage({ type: 'ready' });
})();
