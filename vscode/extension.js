const vscode = require('vscode');
const Engine = require('./engine.js'); // shared reminder logic, copied from shared/engine.js by the build

/* Where Pro waitlist sign-ups are sent. Leave '' to keep them only on the user's machine. */
const WAITLIST_ENDPOINT = '';

const REMINDERS = {
  water:   { title: 'Water',    text: 'Hey {name}, did you drink water?', done: 'Yes!', cheer: 'Hydrated. Nice one!' },
  rest:    { title: 'Break',    text: 'Time for a short break, {name}. Step away for five minutes.', done: 'Taking it', cheer: 'Enjoy the break!' },
  stretch: { title: 'Stretch',  text: 'Stretch time, {name}. Roll your shoulders and stand up.', done: 'Stretched', cheer: 'Feels better, right?' },
  eyes:    { title: 'Eye rest', text: 'Eye rest: look at something far away for 20 seconds.', done: 'Done', cheer: 'Your eyes say thanks!' },
  custom:  { title: 'Custom',   text: 'Your own reminder goes here.', done: 'Done', cheer: 'Great!' }
};
const FREE = ['mika', 'arjun', 'zoe', 'capy', 'axo', 'boo', 'boba', 'ducky'];
const PRO = ['Bolt', 'Mochi', 'Nova', 'Kage'];
const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;

let ctx, view, pausedUntil = 0, status, ticker;

const cfg = () => vscode.workspace.getConfiguration('deskbuddy');
const nonce = () => Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');
const schedId = (x, i) => 'v' + i + ':' + x.time + ':' + x.text;

/* VS Code settings in the shape the shared engine expects. */
function settings() {
  const c = cfg();
  const reminders = {};
  for (const id of Object.keys(REMINDERS)) {
    reminders[id] = { on: !!c.get(id + '.enabled'), every: Math.max(1, Number(c.get(id + '.minutes')) || 30), text: id === 'custom' ? (c.get('custom.text') || REMINDERS.custom.text) : REMINDERS[id].text };
  }
  const schedules = (c.get('schedules') || []).filter(x => x && typeof x.text === 'string' && x.text.trim() && TIME.test(x.time)).map((x, i) => ({
    id: schedId(x, i), index: i, text: x.text.trim(), time: x.time, repeat: ['once', 'daily', 'weekdays'].includes(x.repeat) ? x.repeat : 'daily', warn: [0, 5, 10, 15].includes(x.warn) ? x.warn : 0, on: x.on !== false
  }));
  return {
    name: c.get('name') || 'friend', snooze: Number(c.get('snoozeMinutes')) || 10, pausedUntil, reminders, schedules,
    quiet: { on: !!c.get('quietHours.enabled'), from: c.get('quietHours.from'), to: c.get('quietHours.to') },
    summary: { on: !!c.get('dailySummary.enabled'), time: c.get('dailySummary.time') },
    focus: { work: Math.max(1, Number(c.get('focus.workMinutes')) || 50), rest: Math.max(1, Number(c.get('focus.breakMinutes')) || 10) },
    effects: c.get('animations') !== false
  };
}

async function tick() {
  const s = settings();
  const res = Engine.tick(s, ctx.globalState.get('engine'), Date.now(), ctx.globalState.get('stats'), REMINDERS);
  await ctx.globalState.update('engine', res.state);
  if (res.settingsChanged) {
    // A "once" reminder has fired: switch it off in the user's settings.
    const list = (cfg().get('schedules') || []).slice();
    s.schedules.forEach(x => { if (!x.on && list[x.index]) list[x.index] = Object.assign({}, list[x.index], { on: false }); });
    await cfg().update('schedules', list, vscode.ConfigurationTarget.Global);
  }
  if (res.payload) show(res.payload);
}

function handle(action, p) {
  if (!p || typeof p.key !== 'string') return;
  const res = Engine.act(settings(), ctx.globalState.get('engine'), ctx.globalState.get('stats'), p, String(action), Date.now());
  ctx.globalState.update('engine', res.state);
  ctx.globalState.update('stats', res.stats);
  updateStatus();
}

function show(p) {
  if (view && view.visible) { view.webview.postMessage({ type: 'remind', reminder: p }); return; }
  notify(p);
}

async function notify(p) {
  const labels = p.actions.map(a => a.label);
  const pick = await vscode.window.showInformationMessage('DeskBuddy' + (p.title ? ' · ' + p.title : '') + ': ' + p.text, ...labels);
  const chosen = p.actions.find(a => a.label === pick);
  if (chosen) handle(chosen.id, p);
}

function updateStatus() {
  const st = ctx.globalState.get('stats');
  const n = st && st.day === Engine.dayKey(Date.now()) ? (st.counts.water || 0) : 0;
  const paused = pausedUntil > Date.now();
  const en = ctx.globalState.get('engine');
  const focus = en && en.focus && en.focus.on ? en.focus : null;
  status.text = paused ? '$(debug-pause) DeskBuddy' : (focus ? '$(target) ' + (focus.phase === 'work' ? 'Focus ' : 'Break ') + Math.max(0, Math.ceil((focus.until - Date.now()) / 60000)) + 'm' : '$(heart) DeskBuddy');
  status.tooltip = (paused ? 'Reminders paused. ' : '') + (n ? n + ' water check-ins today' : 'No water check-ins yet today') + '. Click to open.';
}

function pushSettings() {
  if (!view) return;
  const ch = cfg().get('character');
  view.webview.postMessage({ type: 'settings', character: FREE.includes(ch) ? ch : 'mika', pet: !!cfg().get('pet'), charm: cfg().get('charm') || 'none', effects: cfg().get('animations') !== false, reminderIcon: cfg().get('reminderIcon') || 'mix', sound: cfg().get('sound') || 'off' });
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
      else if (m.type === 'action') handle(m.action, m.p);
      else if (m.type === 'fallback' && m.p && Array.isArray(m.p.actions)) notify(m.p);
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
    <li><b>Calendar sync</b><small>Meeting reminders straight from your calendar</small></li>
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

async function addTimedReminder() {
  const text = await vscode.window.showInputBox({ title: 'Timed reminder (1/4)', prompt: 'What should the buddy remind you about?', placeHolder: 'Meeting with the team', validateInput: v => v.trim() ? null : 'Type a short message' });
  if (!text) return;
  const time = await vscode.window.showInputBox({ title: 'Timed reminder (2/4)', prompt: 'At what time? Use 24-hour time.', placeHolder: '11:00', validateInput: v => TIME.test(v.trim()) ? null : 'Use a time like 09:30 or 16:05' });
  if (!time) return;
  const repeat = await vscode.window.showQuickPick([{ label: 'Every day', id: 'daily' }, { label: 'Weekdays', id: 'weekdays' }, { label: 'Once', id: 'once' }], { title: 'Timed reminder (3/4)', placeHolder: 'How often?' });
  if (!repeat) return;
  const warn = await vscode.window.showQuickPick([{ label: 'Only at the time', n: 0 }, { label: 'Also 5 minutes before', n: 5 }, { label: 'Also 10 minutes before', n: 10 }, { label: 'Also 15 minutes before', n: 15 }], { title: 'Timed reminder (4/4)', placeHolder: 'Warn you early?' });
  if (!warn) return;
  const list = (cfg().get('schedules') || []).concat([{ text: text.trim(), time: time.trim(), repeat: repeat.id, warn: warn.n, on: true }]);
  await cfg().update('schedules', list, vscode.ConfigurationTarget.Global);
  vscode.window.setStatusBarMessage('DeskBuddy: reminder added for ' + time.trim(), 4000);
}

async function removeTimedReminder() {
  const list = cfg().get('schedules') || [];
  if (!list.length) { vscode.window.showInformationMessage('DeskBuddy: there are no timed reminders yet.'); return; }
  const pick = await vscode.window.showQuickPick(list.map((x, i) => ({ label: x.time + '  ' + x.text, description: x.repeat || 'daily', i })), { placeHolder: 'Which timed reminder do you want to remove?' });
  if (!pick) return;
  await cfg().update('schedules', list.filter((x, i) => i !== pick.i), vscode.ConfigurationTarget.Global);
}

function activate(context) {
  ctx = context;
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  status.command = 'deskbuddy.view.focus';
  status.show();
  updateStatus();
  ticker = setInterval(() => { tick(); updateStatus(); }, 30000);
  context.subscriptions.push(
    status,
    vscode.window.registerWebviewViewProvider('deskbuddy.view', new BuddyView(), { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.commands.registerCommand('deskbuddy.remindNow', async () => {
      const pick = await vscode.window.showQuickPick(Object.keys(REMINDERS).map(id => ({ label: REMINDERS[id].title, id })), { placeHolder: 'Which reminder do you want to try?' });
      if (pick) show(Engine.intervalPayload(pick.id, settings(), REMINDERS));
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
    vscode.commands.registerCommand('deskbuddy.addTimedReminder', addTimedReminder),
    vscode.commands.registerCommand('deskbuddy.removeTimedReminder', removeTimedReminder),
    vscode.commands.registerCommand('deskbuddy.toggleFocus', async () => {
      const en = ctx.globalState.get('engine');
      const on = !(en && en.focus && en.focus.on);
      await ctx.globalState.update('engine', Engine.setFocus(settings(), en, on, Date.now()));
      updateStatus();
      const s = settings();
      vscode.window.setStatusBarMessage(on ? 'DeskBuddy: focus timer started, ' + s.focus.work + ' minutes of work' : 'DeskBuddy: focus timer stopped', 4000);
    }),
    vscode.commands.registerCommand('deskbuddy.togglePause', () => {
      pausedUntil = pausedUntil > Date.now() ? 0 : Date.now() + 3600000;
      updateStatus();
      vscode.window.setStatusBarMessage(pausedUntil ? 'DeskBuddy paused for 1 hour' : 'DeskBuddy resumed', 3000);
    }),
    vscode.commands.registerCommand('deskbuddy.showPro', showPro),
    vscode.commands.registerCommand('deskbuddy.openSettings', () => vscode.commands.executeCommand('workbench.action.openSettings', '@ext:jaffersha.deskbuddy')),
    vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('deskbuddy')) pushSettings(); }),
    { dispose: () => clearInterval(ticker) }
  );
}

module.exports = { activate, deactivate() {}, _test: { tick: () => tick(), settings } };
