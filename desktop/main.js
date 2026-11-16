/* DeskBuddy desktop: a transparent always-on-top window that shows the buddy and charm over the whole screen. */
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
require('./ui/defaults.js'); // defines globalThis.DB (shared with the browser extension)

const CHARACTERS = [['mika', 'Mika'], ['arjun', 'Arjun'], ['zoe', 'Zoe']];
const CHARMS = [['none', 'None'], ['evileye', 'Evil eye'], ['lemon', 'Lemon & chilli'], ['mask', 'Drishti mask'], ['hamsa', 'Hamsa hand'], ['webby', 'Webby the spider']];

let overlay = null, settingsWin = null, tray = null;
let store = { sync: {}, local: {} };
let timers = {}, snoozes = {};
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

function schedule() {
  Object.values(timers).forEach(clearInterval);
  timers = {};
  const s = settings();
  Object.keys(DB.REMINDERS).forEach(id => {
    const r = s.reminders[id];
    if (r.on) timers[id] = setInterval(() => fire(id, false), Math.max(1, r.every) * 60000);
  });
}
function fire(id, force) {
  const s = settings();
  if (!force && (s.pausedUntil > Date.now() || !s.reminders[id] || !s.reminders[id].on)) return;
  const payload = DB.reminderPayload(id, s);
  if (payload && overlay) overlay.webContents.send('remind', payload);
}
function onAction(action, id) {
  if (!DB.REMINDERS[id]) return;
  if (action === 'done') {
    const day = DB.today();
    const st = store.local.stats && store.local.stats.day === day ? store.local.stats : { day, counts: {} };
    st.counts[id] = (st.counts[id] || 0) + 1;
    store.local.stats = st; persist(); buildTray();
  } else {
    clearTimeout(snoozes[id]);
    snoozes[id] = setTimeout(() => fire(id, false), Math.max(1, settings().snooze) * 60000);
  }
}

function buildTray() {
  if (!tray) return;
  const s = settings();
  const paused = s.pausedUntil > Date.now();
  const sips = store.local.stats && store.local.stats.day === DB.today() ? (store.local.stats.counts.water || 0) : 0;
  const login = app.getLoginItemSettings().openAtLogin;
  tray.setToolTip('DeskBuddy');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: sips ? sips + ' water check-in' + (sips === 1 ? '' : 's') + ' today' : 'No water check-ins yet today', enabled: false },
    { type: 'separator' },
    { label: 'Try a reminder', submenu: Object.keys(DB.REMINDERS).map(id => ({ label: DB.REMINDERS[id].title, click: () => fire(id, true) })) },
    { label: 'Character', submenu: CHARACTERS.map(([id, label]) => ({ label, type: 'radio', checked: s.character === id, click: () => update(x => { x.character = id; }) })) },
    { label: 'Hanging charm', submenu: CHARMS.map(([id, label]) => ({ label, type: 'radio', checked: s.charm === id, click: () => update(x => { x.charm = id; }) })) },
    { label: 'Reminders', submenu: Object.keys(DB.REMINDERS).map(id => ({ label: DB.REMINDERS[id].title + ' (every ' + s.reminders[id].every + ' min)', type: 'checkbox', checked: s.reminders[id].on, click: () => update(x => { x.reminders[id].on = !x.reminders[id].on; }) })) },
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
  schedule(); buildTray();
  if (overlay) overlay.webContents.send('settings', settings());
}

ipcMain.handle('store:get', (e, area, key) => (store[area] || {})[key]);
ipcMain.handle('store:set', (e, area, obj) => {
  if (area !== 'sync' && area !== 'local') return;
  if (obj && typeof obj === 'object') Object.assign(store[area], obj);
  if (area === 'sync') { store.sync.settings = DB.merge(store.sync.settings); }
  persist(); apply();
});
ipcMain.handle('runtime:message', (e, msg) => { if (msg && msg.type === 'db:test' && DB.REMINDERS[msg.id]) fire(msg.id, true); return { ok: true }; });
ipcMain.on('overlay:ready', () => { if (overlay) overlay.webContents.send('settings', settings()); });
ipcMain.on('overlay:action', (e, action, id) => onAction(String(action), String(id)));
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
    screen.on('display-metrics-changed', fitOverlay);
    screen.on('display-added', fitOverlay);
    screen.on('display-removed', fitOverlay);
    if (!store.local.welcomed) { store.local.welcomed = true; persist(); openSettings(); }
    if (process.env.DESKBUDDY_SMOKE) require('./smoke.js')({ overlay: () => overlay, settingsWin: () => settingsWin, fire, update, openSettings, app });
  });
  app.on('window-all-closed', () => { /* keep running in the tray */ });
}
