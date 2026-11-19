/* DeskBuddy desktop: a transparent always-on-top window that shows the buddy and charm over the whole screen. */
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
require('./ui/engine.js');   // defines globalThis.DBEngine (shared reminder logic)
require('./ui/defaults.js'); // defines globalThis.DB (shared with the browser extension)

const CHARACTERS = [['mika', 'Mika'], ['arjun', 'Arjun'], ['zoe', 'Zoe']];
const CHARMS = [['none', 'None'], ['evileye', 'Evil eye'], ['lemon', 'Lemon & chilli'], ['mask', 'Drishti mask'], ['hamsa', 'Hamsa hand'], ['webby', 'Webby the spider']];

let overlay = null, settingsWin = null, tray = null;
let store = { sync: {}, local: {} };
const file = () => path.join(app.getPath('userData'), 'deskbuddy.json');

function load() {
  try { store = Object.assign({ sync: {}, local: {} }, JSON.parse(fs.readFileSync(file(), 'utf8'))); } catch (e) { /* first run */ }
}
function persist() {
  try { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file(), JSON.stringify(store)); } catch (e) { /* disk unavailable */ }
}
const settings = () => DB.merge(store.sync.settings);
function update(change) {
  const s = settings();
  change(s);
  store.sync.settings = s;
  persist(); apply();
  if (settingsWin) settingsWin.reload(); // keep the settings window in step with tray changes
}

function createOverlay() {
  const area = screen.getPrimaryDisplay().workArea;
  overlay = new BrowserWindow({
    x: area.x, y: area.y, width: area.width, height: area.height,
    transparent: true, frame: false, resizable: false, movable: false, hasShadow: false,
    skipTaskbar: true, focusable: false, alwaysOnTop: true, show: false, fullscreenable: false,
    webPreferences: { preload: path.join(__dirname, 'preload-overlay.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.setIgnoreMouseEvents(true, { forward: true });
  overlay.loadFile('overlay.html');
  overlay.once('ready-to-show', () => overlay.showInactive());
  overlay.on('closed', () => { overlay = null; });
}
function fitOverlay() {
  if (!overlay) return;
  overlay.setBounds(screen.getPrimaryDisplay().workArea);
}

function openSettings() {
  if (settingsWin) { settingsWin.show(); settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 392, height: 680, resizable: false, title: 'DeskBuddy', backgroundColor: '#14161d', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload-settings.js'), contextIsolation: true, nodeIntegration: false }
  });
  settingsWin.loadFile(path.join('ui', 'popup', 'popup.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

let ticker = null;
function tick() {
  const s = settings();
  const res = DBEngine.tick(s, store.local.engine, Date.now(), store.local.stats, DB.REMINDERS);
  store.local.engine = res.state;
  if (res.settingsChanged) { store.sync.settings = s; if (settingsWin) settingsWin.reload(); }
  persist();
  if (res.payload && overlay) overlay.webContents.send('remind', res.payload);
}
function fire(id) {
  if (!DB.REMINDERS[id] || !overlay) return;
  overlay.webContents.send('remind', DBEngine.intervalPayload(id, settings(), DB.REMINDERS));
}
function onAction(action, p) {
  if (!p || typeof p.key !== 'string') return;
  const res = DBEngine.act(settings(), store.local.engine, store.local.stats, p, String(action), Date.now());
  store.local.engine = res.state; store.local.stats = res.stats;
  persist(); buildTray();
}
function setFocus(on) {
  store.local.engine = DBEngine.setFocus(settings(), store.local.engine, on, Date.now());
  persist(); buildTray();
  if (settingsWin) settingsWin.reload();
}

function buildTray() {
  if (!tray) return;
  const s = settings();
  const paused = s.pausedUntil > Date.now();
  const sips = store.local.stats && store.local.stats.day === DB.today() ? (store.local.stats.counts.water || 0) : 0;
  const login = app.getLoginItemSettings().openAtLogin;
  const focusOn = !!(store.local.engine && store.local.engine.focus && store.local.engine.focus.on);
  tray.setToolTip('DeskBuddy');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: sips ? sips + ' water check-in' + (sips === 1 ? '' : 's') + ' today' : 'No water check-ins yet today', enabled: false },
    { type: 'separator' },
    { label: 'Try a reminder', submenu: Object.keys(DB.REMINDERS).map(id => ({ label: DB.REMINDERS[id].title, click: () => fire(id) })) },
    { label: 'Character', submenu: CHARACTERS.map(([id, label]) => ({ label, type: 'radio', checked: s.character === id, click: () => update(x => { x.character = id; }) })) },
    { label: 'Hanging charm', submenu: CHARMS.map(([id, label]) => ({ label, type: 'radio', checked: s.charm === id, click: () => update(x => { x.charm = id; }) })) },
    { label: 'Reminders', submenu: Object.keys(DB.REMINDERS).map(id => ({ label: DB.REMINDERS[id].title + ' (every ' + s.reminders[id].every + ' min)', type: 'checkbox', checked: s.reminders[id].on, click: () => update(x => { x.reminders[id].on = !x.reminders[id].on; }) })) },
    { label: focusOn ? 'Stop focus timer' : 'Start focus timer (' + s.focus.work + ' / ' + s.focus.rest + ' min)', click: () => setFocus(!focusOn) },
    { label: 'Desk pet (buddy walks around)', type: 'checkbox', checked: s.pet, click: () => update(x => { x.pet = !x.pet; }) },
    { label: paused ? 'Resume reminders' : 'Pause reminders for 1 hour', click: () => update(x => { x.pausedUntil = paused ? 0 : Date.now() + 3600000; }) },
    { type: 'separator' },
    { label: 'Settings…', click: openSettings },
    { label: 'Start DeskBuddy at login', type: 'checkbox', checked: login, click: () => { app.setLoginItemSettings({ openAtLogin: !login }); buildTray(); } },
    { type: 'separator' },
    { label: 'Quit DeskBuddy', click: () => app.quit() }
  ]));
}

function apply() {
  buildTray();
  if (overlay) overlay.webContents.send('settings', settings());
}

ipcMain.handle('store:get', (e, area, key) => (store[area] || {})[key]);
ipcMain.handle('store:set', (e, area, obj) => {
  if (area !== 'sync' && area !== 'local') return;
  if (obj && typeof obj === 'object') Object.assign(store[area], obj);
  if (area === 'sync') { store.sync.settings = DB.merge(store.sync.settings); }
  persist(); apply();
});
ipcMain.handle('runtime:message', (e, msg) => {
  if (msg && msg.type === 'db:waitlist' && msg.entry && typeof msg.entry.email === 'string') {
    const entry = Object.assign({}, msg.entry, { email: msg.entry.email.slice(0, 200), source: 'Desktop ' + process.platform, version: app.getVersion() });
    return DB.sendWaitlist(entry, globalThis.fetch).then(sent => ({ handled: true, sent }));
  }
  if (msg && msg.type === 'db:test') fire(msg.id);
  else if (msg && msg.type === 'db:focus') { store.local.engine = DBEngine.setFocus(settings(), store.local.engine, !!msg.on, Date.now()); persist(); buildTray(); }
  return { ok: true };
});
ipcMain.on('overlay:ready', () => { if (overlay) overlay.webContents.send('settings', settings()); });
ipcMain.on('overlay:action', (e, action, p) => onAction(action, p));
ipcMain.on('overlay:ignore', (e, ignore) => { if (overlay) overlay.setIgnoreMouseEvents(!!ignore, { forward: true }); });
ipcMain.on('overlay:charm-moved', (e, pos) => {
  if (!pos || typeof pos.x !== 'number') return;
  const s = settings();
  s.charmX = Math.round(pos.x * 1000) / 1000; s.charmLen = Math.round(pos.length) || 0;
  store.sync.settings = s; persist();
});

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', openSettings);
  app.whenReady().then(() => {
    load();
    if (app.dock) app.dock.hide();
    const icon = nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png'));
    tray = new Tray(icon.resize({ width: 18, height: 18 }));
    tray.on('click', () => tray.popUpContextMenu());
    createOverlay();
    apply();
    ticker = setInterval(tick, 20000);
    screen.on('display-metrics-changed', fitOverlay);
    screen.on('display-added', fitOverlay);
    screen.on('display-removed', fitOverlay);
    if (!store.local.welcomed) { store.local.welcomed = true; persist(); openSettings(); }
    if (process.env.DESKBUDDY_SMOKE) require('./smoke.js')({ overlay: () => overlay, settingsWin: () => settingsWin, fire, update, openSettings, app, tick, store: () => store });
  });
  app.on('window-all-closed', () => { /* keep running in the tray */ });
}
