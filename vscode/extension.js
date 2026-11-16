const vscode = require('vscode');

/* Where Pro waitlist sign-ups are sent. Leave '' to keep them only on the user's machine. */
const WAITLIST_ENDPOINT = '';

const REMINDERS = {
  water:   { title: 'Water',    text: 'Hey {name}, did you drink water?', done: 'Yes!', cheer: 'Hydrated. Nice one!' },
  rest:    { title: 'Break',    text: 'Time for a short break, {name}. Step away for five minutes.', done: 'Taking it', cheer: 'Enjoy the break!' },
  stretch: { title: 'Stretch',  text: 'Stretch time, {name}. Roll your shoulders and stand up.', done: 'Stretched', cheer: 'Feels better, right?' },
  eyes:    { title: 'Eye rest', text: 'Eye rest: look at something far away for 20 seconds.', done: 'Done', cheer: 'Your eyes say thanks!' },
  custom:  { title: 'Custom',   text: '', done: 'Done', cheer: 'Great!' }
};
const FREE = ['mika', 'arjun', 'zoe'];
const PRO = ['Bolt', 'Mochi', 'Nova', 'Kage'];

let ctx, view, timers = {}, snoozes = {}, pausedUntil = 0, status;

const cfg = () => vscode.workspace.getConfiguration('deskbuddy');
const nonce = () => Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');

function payload(id) {
  const meta = REMINDERS[id];
  const raw = id === 'custom' ? (cfg().get('custom.text') || 'Reminder') : meta.text;
  return {
    id, kind: id, cheer: meta.cheer,
    text: raw.replace(/\{name\}/g, cfg().get('name') || 'friend'),
    actions: [{ id: 'done', label: meta.done, primary: true }, { id: 'later', label: 'Remind me later' }]
  };
}

function schedule() {
  Object.values(timers).forEach(clearInterval);
  timers = {};
  for (const id of Object.keys(REMINDERS)) {
    if (!cfg().get(id + '.enabled')) continue;
    const mins = Math.max(1, Number(cfg().get(id + '.minutes')) || 30);
    timers[id] = setInterval(() => fire(id, false), mins * 60000);
  }
}

function handle(action, id) {
  if (action === 'done') {
    const day = new Date().toDateString();
    const st = ctx.globalState.get('stats');
    const stats = st && st.day === day ? st : { day, counts: {} };
    stats.counts[id] = (stats.counts[id] || 0) + 1;
    ctx.globalState.update('stats', stats);
    updateStatus();
  } else if (action === 'later' || action === 'timeout') {
    clearTimeout(snoozes[id]);
    snoozes[id] = setTimeout(() => fire(id, false), Math.max(1, Number(cfg().get('snoozeMinutes')) || 10) * 60000);
  }
}

async function fire(id, force) {
  if (!force && (pausedUntil > Date.now() || !vscode.window.state.focused)) return;
  const p = payload(id);
  if (view && view.visible) {
    view.webview.postMessage({ type: 'remind', reminder: p });
    return;
  }
  notify(p, id);
}

async function notify(p, id) {
  const pick = await vscode.window.showInformationMessage('DeskBuddy: ' + p.text, p.actions[0].label, 'Remind me later');
  if (pick === p.actions[0].label) handle('done', id);
  else if (pick === 'Remind me later') handle('later', id);
}

function updateStatus() {
  const st = ctx.globalState.get('stats');
  const n = st && st.day === new Date().toDateString() ? (st.counts.water || 0) : 0;
  const paused = pausedUntil > Date.now();
  status.text = paused ? '$(debug-pause) DeskBuddy' : '$(heart) DeskBuddy';
  status.tooltip = (paused ? 'Reminders paused. ' : '') + (n ? n + ' water check-ins today' : 'No water check-ins yet today') + '. Click to open.';
}

function pushSettings() {
  if (!view) return;
  const ch = cfg().get('character');
  view.webview.postMessage({ type: 'settings', character: FREE.includes(ch) ? ch : 'mika', pet: !!cfg().get('pet'), charm: cfg().get('charm') || 'none' });
}

function page(webview, body, script, data) {
  const n = nonce();
  const uri = f => webview.asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri, 'media', f));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${n}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${uri('view.css')}"></head>
<body data-init='${JSON.stringify(data || {}).replace(/'/g, '&#39;')}'>${body}
<script nonce="${n}" src="${uri('buddy-core.js')}"></script>
<script nonce="${n}" src="${uri(script)}"></script></body></html>`;
}

class BuddyView {
  resolveWebviewView(v) {
    view = v;
    v.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'media')] };
    v.webview.html = page(v.webview,
      '<div id="stage"></div><button id="pro" type="button"><span class="badge">PRO</span> Your photo as a buddy, coming soon</button>',
      'view.js');
    v.webview.onDidReceiveMessage(m => {
      if (m.type === 'ready') pushSettings();
      else if (m.type === 'action' && REMINDERS[m.id]) handle(m.action, m.id);
      else if (m.type === 'fallback' && REMINDERS[m.id]) notify(payload(m.id), m.id);
      else if (m.type === 'pro') showPro();
    });
    v.onDidDispose(() => { view = undefined; });
  }
}

let proPanel;
function showPro() {
  if (proPanel) return proPanel.reveal();
  proPanel = vscode.window.createWebviewPanel('deskbuddy.pro', 'DeskBuddy Pro', vscode.ViewColumn.Active,
    { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'media')] });
  proPanel.webview.html = page(proPanel.webview, `
<main class="pro">
  <p><span class="badge">PRO</span> Coming soon</p>
  <h1>Make your buddy look like you</h1>
  <ul>
    <li><b>Your photo as your buddy</b><small>Upload a picture and get a character that looks like you</small></li>
    <li><b>Trending characters</b><small>New buddies added regularly</small></li>
    <li><b>More on the way</b><small>Extra animations and reminder styles</small></li>
  </ul>
  <div id="locked" class="chars"></div>
  <form id="waitlist"><input id="email" type="email" required placeholder="you@example.com"><button type="submit">I'm interested</button></form>
  <p id="msg" class="note">No payment needed now. Everything in the free version stays free.</p>
</main>`, 'pro.js', { joined: !!ctx.globalState.get('waitlist') });
  proPanel.webview.onDidReceiveMessage(async m => {
    if (m.type !== 'waitlist' || typeof m.email !== 'string') return;
    const entry = { email: m.email.slice(0, 200), source: 'vscode', ts: Date.now(), sent: false };
    if (WAITLIST_ENDPOINT && typeof fetch === 'function') {
      try {
        const r = await fetch(WAITLIST_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
        entry.sent = r.ok;
      } catch (e) { entry.sent = false; }
    }
    await ctx.globalState.update('waitlist', entry);
    proPanel.webview.postMessage({ type: 'joined' });
  });
  proPanel.onDidDispose(() => { proPanel = undefined; });
}

function activate(context) {
  ctx = context;
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  status.command = 'deskbuddy.view.focus';
  status.show();
  updateStatus();
  context.subscriptions.push(
    status,
    vscode.window.registerWebviewViewProvider('deskbuddy.view', new BuddyView(), { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.commands.registerCommand('deskbuddy.remindNow', async () => {
      const pick = await vscode.window.showQuickPick(Object.keys(REMINDERS).map(id => ({ label: REMINDERS[id].title, id })), { placeHolder: 'Which reminder do you want to try?' });
      if (pick) fire(pick.id, true);
    }),
    vscode.commands.registerCommand('deskbuddy.chooseCharacter', async () => {
      const items = FREE.map(id => ({ label: id[0].toUpperCase() + id.slice(1), id }))
        .concat(PRO.map(n => ({ label: '$(lock) ' + n, description: 'Pro, coming soon', pro: true })));
      const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Choose your buddy' });
      if (!pick) return;
      if (pick.pro) return showPro();
      await cfg().update('character', pick.id, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('deskbuddy.chooseCharm', async () => {
      const items = [['none', 'None'], ['evileye', 'Evil eye'], ['lemon', 'Lemon & chilli'], ['mask', 'Drishti mask'], ['hamsa', 'Hamsa hand'], ['webby', 'Webby the spider']].map(([id, label]) => ({ label, id }));
      const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Choose a hanging charm for the DeskBuddy view' });
      if (pick) await cfg().update('charm', pick.id, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('deskbuddy.togglePause', () => {
      pausedUntil = pausedUntil > Date.now() ? 0 : Date.now() + 3600000;
      updateStatus();
      vscode.window.setStatusBarMessage(pausedUntil ? 'DeskBuddy paused for 1 hour' : 'DeskBuddy resumed', 3000);
    }),
    vscode.commands.registerCommand('deskbuddy.showPro', showPro),
    vscode.commands.registerCommand('deskbuddy.openSettings', () => vscode.commands.executeCommand('workbench.action.openSettings', '@ext:jaffersha.deskbuddy')),
    vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('deskbuddy')) { schedule(); pushSettings(); } }),
    { dispose: () => { Object.values(timers).forEach(clearInterval); Object.values(snoozes).forEach(clearTimeout); } }
  );
  schedule();
}

module.exports = { activate, deactivate() {} };
