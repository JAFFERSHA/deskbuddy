(function () {
  const vscode = acquireVsCodeApi();
  const style = document.createElement('style');
  style.textContent = DeskBuddy.CSS;
  document.head.appendChild(style);
  const init = JSON.parse(document.body.dataset.init || '{}');
  const box = document.getElementById('locked');
  Object.keys(DeskBuddy.CHARACTERS).filter(id => DeskBuddy.CHARACTERS[id].pro).forEach(id => {
    const d = document.createElement('div');
    DeskBuddy.render(d, id);
    const b = document.createElement('span'); b.className = 'badge'; b.textContent = 'PRO';
    d.append(b, DeskBuddy.CHARACTERS[id].name);
    box.appendChild(d);
  });
  const form = document.getElementById('waitlist'), msg = document.getElementById('msg');
  function joined() { form.hidden = true; msg.textContent = 'Thanks! Your interest in Pro is saved.'; }
  if (init.joined) joined();
  form.addEventListener('submit', e => { e.preventDefault(); vscode.postMessage({ type: 'waitlist', email: document.getElementById('email').value.trim() }); });
  window.addEventListener('message', e => { if (e.data.type === 'joined') joined(); });
})();
