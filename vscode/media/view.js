(function () {
  const vscode = acquireVsCodeApi();
  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);
  const stage = DeskBuddy.createStage({
    mount: document.getElementById('stage'), size: 84, character: 'mika',
    onAction: (action, r) => vscode.postMessage({ type: 'action', action, id: r.id })
  });
  window.addEventListener('message', e => {
    const m = e.data;
    if (m.type === 'settings') { stage.setCharacter(m.character); stage.setPet(m.pet); }
    if (m.type === 'remind') stage.remind(m.reminder);
  });
  document.getElementById('pro').addEventListener('click', () => vscode.postMessage({ type: 'pro' }));
  vscode.postMessage({ type: 'ready' });
})();
