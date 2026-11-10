/* DeskBuddy background: schedules reminders with alarms and hands them to the active tab. */
if (typeof importScripts === 'function') importScripts('defaults.js');

const api = globalThis.browser || globalThis.chrome;

async function getSettings() {
  const { settings } = await api.storage.sync.get('settings');
  return DB.merge(settings);
}

async function schedule() {
  const s = await getSettings();
  const existing = await api.alarms.getAll();
  for (const id of Object.keys(DB.REMINDERS)) {
    const name = 'rem:' + id;
    const r = s.reminders[id];
    const cur = existing.find(a => a.name === name);
    if (!r.on) { if (cur) await api.alarms.clear(name); continue; }
    if (!cur || cur.periodInMinutes !== r.every) {
      await api.alarms.create(name, { delayInMinutes: r.every, periodInMinutes: r.every });
    }
  }
}

async function bumpStat(id) {
  const { stats } = await api.storage.local.get('stats');
  const day = DB.today();
  const st = stats && stats.day === day ? stats : { day, counts: {} };
  st.counts[id] = (st.counts[id] || 0) + 1;
  await api.storage.local.set({ stats: st });
}

async function fire(id, force) {
  const s = await getSettings();
  if (!force && (s.pausedUntil > Date.now() || !s.reminders[id] || !s.reminders[id].on)) return;
  const payload = DB.reminderPayload(id, s);
  if (!payload) return;
  try {
    const [tab] = await api.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || tab.id === undefined) throw new Error('no tab');
    const res = await api.tabs.sendMessage(tab.id, { type: 'db:remind', reminder: payload });
    if (!res || !res.ok) throw new Error('no buddy on page');
  } catch (e) {
    // Pages where the buddy cannot appear (new tab, store pages, PDFs): use a system notification.
    try {
      await api.notifications.create('db:' + id + ':' + Date.now(), {
        type: 'basic',
        iconUrl: api.runtime.getURL('icons/icon128.png'),
        title: 'DeskBuddy: ' + DB.REMINDERS[id].title,
        message: payload.text
      });
    } catch (err) { /* notifications unavailable */ }
  }
}

api.alarms.onAlarm.addListener(alarm => {
  if (alarm.name.startsWith('rem:')) fire(alarm.name.slice(4), false);
  else if (alarm.name.startsWith('snooze:')) fire(alarm.name.slice(7), false);
});

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string') return;
  (async () => {
    if (msg.type === 'db:action' && DB.REMINDERS[msg.id]) {
      if (msg.action === 'done') await bumpStat(msg.id);
      if (msg.action === 'later') {
        const s = await getSettings();
        await api.alarms.create('snooze:' + msg.id, { delayInMinutes: Math.max(1, s.snooze) });
      }
    } else if (msg.type === 'db:test' && DB.REMINDERS[msg.id]) {
      await fire(msg.id, true);
    }
    sendResponse({ ok: true });
  })();
  return true;
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) schedule();
});
api.runtime.onInstalled.addListener(schedule);
api.runtime.onStartup.addListener(schedule);
if (api.notifications && api.notifications.onClicked) {
  api.notifications.onClicked.addListener(id => { if (id.startsWith('db:')) api.notifications.clear(id); });
}
