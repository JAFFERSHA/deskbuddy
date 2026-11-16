/* DeskBuddy background: runs the shared reminder engine once a minute and hands what is due to the active tab. */
if (typeof importScripts === 'function') importScripts('defaults.js', 'engine.js');

const api = globalThis.browser || globalThis.chrome;

async function getSettings() {
  const { settings } = await api.storage.sync.get('settings');
  return DB.merge(settings);
}

async function deliver(payload) {
  try {
    const [tab] = await api.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || tab.id === undefined) throw new Error('no tab');
    const res = await api.tabs.sendMessage(tab.id, { type: 'db:remind', reminder: payload });
    if (!res || !res.ok) throw new Error('no buddy on page');
  } catch (e) {
    // Pages where the buddy cannot appear (new tab, store pages, PDFs): use a system notification.
    try {
      await api.notifications.create('db:' + payload.key + ':' + Date.now(), {
        type: 'basic',
        iconUrl: api.runtime.getURL('icons/icon128.png'),
        title: 'DeskBuddy: ' + (payload.title || 'Reminder'),
        message: payload.text
      });
    } catch (err) { /* notifications unavailable */ }
  }
}

let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    const s = await getSettings();
    const { engine, stats } = await api.storage.local.get(['engine', 'stats']);
    const res = DBEngine.tick(s, engine, Date.now(), stats, DB.REMINDERS);
    await api.storage.local.set({ engine: res.state });
    if (res.settingsChanged) await api.storage.sync.set({ settings: s });
    if (res.payload) await deliver(res.payload);
  } finally { busy = false; }
}

async function ensureAlarm() {
  const a = await api.alarms.get('tick');
  if (!a) await api.alarms.create('tick', { delayInMinutes: 1, periodInMinutes: 1 });
}

api.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'tick') tick(); });

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string') return;
  (async () => {
    const s = await getSettings();
    if (msg.type === 'db:action' && msg.p && typeof msg.p.key === 'string') {
      const { engine, stats } = await api.storage.local.get(['engine', 'stats']);
      const res = DBEngine.act(s, engine, stats, msg.p, String(msg.action), Date.now());
      await api.storage.local.set({ engine: res.state, stats: res.stats });
    } else if (msg.type === 'db:test' && DB.REMINDERS[msg.id]) {
      await deliver(DBEngine.intervalPayload(msg.id, s, DB.REMINDERS));
    } else if (msg.type === 'db:focus') {
      const { engine } = await api.storage.local.get('engine');
      await api.storage.local.set({ engine: DBEngine.setFocus(s, engine, !!msg.on, Date.now()) });
    } else if (msg.type === 'db:tick') {
      await tick();
    }
    sendResponse({ ok: true });
  })();
  return true;
});

api.runtime.onInstalled.addListener(() => { api.alarms.clearAll().then(ensureAlarm); });
api.runtime.onStartup.addListener(ensureAlarm);
ensureAlarm();
if (api.notifications && api.notifications.onClicked) {
  api.notifications.onClicked.addListener(id => { if (id.startsWith('db:')) api.notifications.clear(id); });
}
