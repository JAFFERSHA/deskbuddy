const vscode = require('vscode');
const Engine = require('./engine.js'); // shared reminder logic, copied from shared/engine.js by the build


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

let ctx, view, stagePanel, pausedUntil = 0, status, ticker;

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
  if (cfg().get('desktopOverlay')) return; // the desktop app draws reminders over the whole screen instead
  const live = [view, stagePanel].filter(v => v && v.visible);
  if (live.length) { live.forEach(v => v.webview.postMessage({ type: 'remind', reminder: p })); return; }
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
  [view, stagePanel].forEach(pushTo);
}
function pushTo(view) {
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
      if (m.type === 'ready') pushTo(v);
      else if (m.type === 'action') handle(m.action, m.p);
      else if (m.type === 'fallback' && m.p && Array.isArray(m.p.actions)) notify(m.p);
      else if (m.type === 'pro') showPro();
    });
    v.onDidDispose(() => { view = undefined; });
  }
}

function openStage() {
  if (stagePanel) return stagePanel.reveal();
  stagePanel = vscode.window.createWebviewPanel('deskbuddy.stage', 'DeskBuddy', vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'media')] });
  const p = stagePanel;
  p.webview.html = page(p.webview, '<div id="stage"></div><button id="pro" type="button"><span class="badge">PRO</span> Your photo as a buddy, coming soon</button>', 'view.js');
  p.webview.onDidReceiveMessage(m => {
    if (m.type === 'ready') pushTo(p);
    else if (m.type === 'action') handle(m.action, m.p);
    else if (m.type === 'fallback' && m.p && Array.isArray(m.p.actions)) notify(m.p);
    else if (m.type === 'pro') showPro();
  });
  p.onDidDispose(() => { stagePanel = undefined; });
}

/* Pro preview lives in the settings page (same box as the browser popup). */
function showPro() { openSettingsPage(true); }

/* ---- Settings page: the browser popup, running inside a VS Code panel on top of the real settings ---- */
let settingsPanel;
const popupSettings = () => {
  const s = settings(), c = cfg(), pos = ctx.globalState.get('charmpos') || {};
  const ch = c.get('character');
  return Object.assign({}, s, {
    character: FREE.includes(ch) ? ch : 'mika', pet: !!c.get('pet'), charm: c.get('charm') || 'none',
    charmX: typeof pos.x === 'number' ? pos.x : 0.82, charmLen: typeof pos.length === 'number' ? pos.length : -1,
    reminderIcon: c.get('reminderIcon') || 'mix', sound: c.get('sound') || 'off'
  });
};
async function savePopupSettings(p) {
  if (!p || typeof p !== 'object') return;
  const c = cfg(), set = (k, v) => (JSON.stringify(c.get(k)) === JSON.stringify(v) ? null : c.update(k, v, vscode.ConfigurationTarget.Global));
  const jobs = [
    set('name', String(p.name || 'friend').slice(0, 40)), set('character', FREE.includes(p.character) ? p.character : 'mika'), set('pet', !!p.pet),
    set('charm', p.charm), set('reminderIcon', p.reminderIcon), set('sound', p.sound), set('snoozeMinutes', [5, 10, 30].includes(p.snooze) ? p.snooze : 10), set('animations', p.effects !== false)
  ];
  Object.keys(REMINDERS).forEach(id => { const r = (p.reminders || {})[id]; if (!r) return; jobs.push(set(id + '.enabled', !!r.on), set(id + '.minutes', Math.max(1, Math.round(r.every) || 30))); if (id === 'custom' && r.text) jobs.push(set('custom.text', String(r.text).slice(0, 160))); });
  if (p.quiet) jobs.push(set('quietHours.enabled', !!p.quiet.on), set('quietHours.from', p.quiet.from), set('quietHours.to', p.quiet.to));
  if (p.summary) jobs.push(set('dailySummary.enabled', !!p.summary.on), set('dailySummary.time', p.summary.time));
  if (p.focus) jobs.push(set('focus.workMinutes', p.focus.work), set('focus.breakMinutes', p.focus.rest));
  if (Array.isArray(p.schedules)) jobs.push(set('schedules', p.schedules.filter(x => x && x.text && TIME.test(x.time)).map(x => ({ text: x.text, time: x.time, repeat: x.repeat, warn: x.warn, on: x.on !== false }))));
  if (typeof p.charmX === 'number') await ctx.globalState.update('charmpos', { x: p.charmX, length: p.charmLen });
  await Promise.all(jobs.filter(Boolean));
}
async function rpc(m) {
  if (m.op === 'sync.get') return { settings: popupSettings() };
  if (m.op === 'sync.set') { await savePopupSettings(m.value && m.value.settings); return {}; }
  if (m.op === 'local.get') return { [m.key]: ctx.globalState.get(m.key) };
  if (m.op === 'local.set') { for (const k of Object.keys(m.value || {})) await ctx.globalState.update(k, m.value[k]); return {}; }
  if (m.op === 'message') {
    const x = m.value || {};
    if (x.type === 'db:waitlist' && x.entry && typeof x.entry.email === 'string') {
      require('./media/defaults.js'); // globalThis.DB, copied from browser/defaults.js by the build
      const entry = Object.assign({}, x.entry, { email: x.entry.email.slice(0, 200), source: 'VS Code', version: ctx.extension.packageJSON.version });
      return { handled: true, sent: await globalThis.DB.sendWaitlist(entry, globalThis.fetch) };
    }
    if (x.type === 'db:test') show(Engine.intervalPayload(x.id, settings(), REMINDERS));
    else if (x.type === 'db:focus') { await ctx.globalState.update('engine', Engine.setFocus(settings(), ctx.globalState.get('engine'), !!x.on, Date.now())); updateStatus(); }
    return { ok: true };
  }
  return {};
}
function openSettingsPage(focusPro) {
  if (settingsPanel) { settingsPanel.reveal(); if (focusPro === true) settingsPanel.webview.postMessage({ type: 'db:show-pro' }); return; }
  const root = vscode.Uri.joinPath(ctx.extensionUri, 'media');
  settingsPanel = vscode.window.createWebviewPanel('deskbuddy.settings', 'DeskBuddy Settings', vscode.ViewColumn.Active, { enableScripts: true, localResourceRoots: [root] });
  const w = settingsPanel.webview, n = nonce(), u = f => w.asWebviewUri(vscode.Uri.joinPath(root, ...f.split('/')));
  const fs = require('fs');
  let html;
  try { html = fs.readFileSync(vscode.Uri.joinPath(root, 'popup', 'popup.html').fsPath, 'utf8'); } catch (e) { html = null; }
  if (!html) { settingsPanel.dispose(); vscode.commands.executeCommand('workbench.action.openSettings', '@ext:jaffersha.deskbuddy'); return; }
  const shim = `const v=acquireVsCodeApi(),P={};let i=0;const call=(op,key,value)=>new Promise(r=>{const id=++i;P[id]=r;v.postMessage({type:'rpc',id,op,key,value})});
addEventListener('message',e=>{if(e.data&&e.data.type==='rpc'&&P[e.data.id]){P[e.data.id](e.data.result);delete P[e.data.id]}});
window.browser={storage:{sync:{get:k=>call('sync.get',k),set:o=>call('sync.set',null,o)},local:{get:k=>call('local.get',k),set:o=>call('local.set',null,o)}},runtime:{sendMessage:m=>call('message',null,m)}};`;
  html = html.replace('<link rel="stylesheet" href="popup.css">', `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${w.cspSource} 'unsafe-inline'; script-src 'nonce-${n}';"><link rel="stylesheet" href="${u('popup/popup.css')}"><style>body{margin:0 auto}</style>`)
    .replace('<script src="../buddy-core.js"></script>', `<script nonce="${n}">${shim}</script><script nonce="${n}" src="${u('buddy-core.js')}"></script>`)
    .replace('<script src="../engine.js"></script>', `<script nonce="${n}" src="${u('engine.js')}"></script>`)
    .replace('<script src="../defaults.js"></script>', `<script nonce="${n}" src="${u('defaults.js')}"></script>`)
    .replace('<script src="popup.js"></script>', `<script nonce="${n}" src="${u('popup/popup.js')}"></script>`);
  if (focusPro === true) html = html.replace('<body>', '<body data-focus="pro">');
  w.html = html;
  w.onDidReceiveMessage(async m => { if (m && m.type === 'rpc') { const result = await rpc(m).catch(() => ({})); w.postMessage({ type: 'rpc', id: m.id, result }); } });
  settingsPanel.onDidDispose(() => { settingsPanel = undefined; });
}

/* ---- Outside the box: the desktop app floats over the whole screen, VS Code included ---- */
function openDesktopApp() {
  const cp = require('child_process'), fs = require('fs');
  const fail = async () => {
    const pick = await vscode.window.showInformationMessage('DeskBuddy desktop app is not installed. It puts the buddy, rides and charm over your whole screen, outside VS Code.', 'Download');
    if (pick) vscode.env.openExternal(vscode.Uri.parse('https://github.com/JAFFERSHA/deskbuddy/releases/latest'));
  };
  let child;
  try {
    if (process.platform === 'darwin') {
      if (!fs.existsSync('/Applications/DeskBuddy.app')) return fail();
      child = cp.spawn('open', ['-a', 'DeskBuddy'], { detached: true, stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      const exe = require('path').join(process.env.LOCALAPPDATA || '', 'Programs', 'DeskBuddy', 'DeskBuddy.exe');
      if (!fs.existsSync(exe)) return fail();
      child = cp.spawn(exe, [], { detached: true, stdio: 'ignore' });
    } else {
      child = cp.spawn('deskbuddy', [], { detached: true, stdio: 'ignore' });
    }
    child.on('error', fail); child.unref();
    vscode.window.setStatusBarMessage('DeskBuddy: opening the desktop buddy', 4000);
  } catch (e) { fail(); }
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
  if (cfg().get('desktopOverlay')) openDesktopApp();
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
    vscode.commands.registerCommand('deskbuddy.openStage', openStage),
    vscode.commands.registerCommand('deskbuddy.showPro', showPro),
    vscode.commands.registerCommand('deskbuddy.openSettings', openSettingsPage),
    vscode.commands.registerCommand('deskbuddy.openNativeSettings', () => vscode.commands.executeCommand('workbench.action.openSettings', '@ext:jaffersha.deskbuddy')),
    vscode.commands.registerCommand('deskbuddy.openDesktop', openDesktopApp),
    vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('deskbuddy')) pushSettings(); if (e.affectsConfiguration('deskbuddy.desktopOverlay') && cfg().get('desktopOverlay')) openDesktopApp(); }),
    { dispose: () => clearInterval(ticker) }
  );
}

module.exports = { activate, deactivate() {}, _test: { tick: () => tick(), settings } };
