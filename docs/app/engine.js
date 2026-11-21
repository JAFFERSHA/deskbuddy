/* DeskBuddy reminder engine: decides what is due. Pure logic shared by the browser extension,
   the VS Code extension and the desktop app. Call tick() about once a minute. */
(function (root) {
  'use strict';

  var MIN = 60000;
  var EFFECT = { water: 'drop', rest: ['rocket', 'car'], stretch: 'balloon', eyes: ['peek', 'swing'] };
  function pickFx(e) { return Array.isArray(e) ? e[Math.floor(Math.random() * e.length)] : e; }

  function dayKey(now) { var d = new Date(now); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function parseTime(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ''));
    if (!m || +m[1] > 23 || +m[2] > 59) return null;
    return +m[1] * 60 + +m[2];
  }
  function at(now, minutes) { var d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime() + minutes * MIN; }
  function clock(minutes) { var h = Math.floor(minutes / 60), m = minutes % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }

  function freshState(now) { return { last: {}, snooze: {}, skip: {}, fired: {}, warned: {}, focus: { on: false, phase: 'work', until: 0 }, summaryDay: '', start: now }; }
  function fixState(s, now) {
    s = s && typeof s === 'object' ? s : freshState(now);
    ['last', 'snooze', 'skip', 'fired', 'warned'].forEach(function (k) { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
    if (!s.focus || typeof s.focus !== 'object') s.focus = { on: false, phase: 'work', until: 0 };
    return s;
  }

  function inQuiet(settings, now) {
    var q = settings.quiet;
    if (!q || !q.on) return false;
    var a = parseTime(q.from), b = parseTime(q.to);
    if (a === null || b === null || a === b) return false;
    var d = new Date(now), m = d.getHours() * 60 + d.getMinutes();
    return a < b ? (m >= a && m < b) : (m >= a || m < b);
  }

  function name(settings, text) { return String(text).replace(/\{name\}/g, settings.name || 'friend'); }
  function snoozeLabel(settings) { return 'Snooze ' + (settings.snooze || 10) + ' min'; }

  function intervalPayload(id, settings, meta) {
    var m = meta[id], r = settings.reminders[id];
    return {
      key: id, id: id, kind: 'interval', title: m.title, text: name(settings, r.text || m.text), cheer: m.cheer,
      snoozeText: 'Okay, snoozed.', effect: pickFx(EFFECT[id]) || null,
      actions: [{ id: 'done', label: m.done, primary: true }, { id: 'later', label: snoozeLabel(settings) }, { id: 'skip', label: 'Skip today' }]
    };
  }
  function schedPayload(sc, settings, minutesLeft, target) {
    var warn = minutesLeft > 0;
    return {
      key: 's:' + sc.id, id: sc.id, kind: 'sched', title: (warn ? 'In ' + minutesLeft + ' min' : 'Now') + ' · ' + clock(target),
      text: name(settings, sc.text), cheer: 'Got it!', snoozeText: 'Okay, snoozed.', effect: warn ? null : pickFx(['rocket', 'car']),
      actions: [{ id: 'done', label: 'Got it', primary: true }, { id: 'later', label: snoozeLabel(settings) }]
    };
  }
  function summaryText(stats, meta, today) {
    var c = stats && stats.day === today ? stats.counts || {} : {};
    var parts = [];
    Object.keys(meta).forEach(function (id) { if (c[id]) parts.push(c[id] + ' ' + meta[id].title.toLowerCase()); });
    if (c.sched) parts.push(c.sched + ' timed reminder' + (c.sched === 1 ? '' : 's'));
    if (c.focus) parts.push(c.focus + ' focus session' + (c.focus === 1 ? '' : 's'));
    return parts.length ? 'Today: ' + parts.join(', ') + '. Nice work!' : 'Day is done. Nothing logged today, and that is okay. Fresh start tomorrow!';
  }

  /* Returns { payload|null, state, settingsChanged }. At most one payload per call. */
  function tick(settings, state, now, stats, meta) {
    state = fixState(state, now);
    var today = dayKey(now), out = { payload: null, state: state, settingsChanged: false };
    var paused = settings.pausedUntil > now, quiet = inQuiet(settings, now);
    var i, sc, t, target, key;

    // 1. Timed reminders always get through: the user asked for that exact time.
    var list = settings.schedules || [];
    var dow = new Date(now).getDay();
    for (i = 0; i < list.length; i++) {
      sc = list[i];
      if (!sc || !sc.on) continue;
      t = parseTime(sc.time);
      if (t === null) continue;
      if (sc.repeat === 'weekdays' && (dow === 0 || dow === 6)) continue;
      target = at(now, t); key = 's:' + sc.id;
      if (state.snooze[key]) {
        if (now >= state.snooze[key]) { delete state.snooze[key]; out.payload = schedPayload(sc, settings, 0, t); return out; }
        continue;
      }
      if (state.fired[sc.id] === today) continue;
      if (now >= target && now < target + 15 * MIN) {
        state.fired[sc.id] = today;
        if (sc.repeat === 'once') { sc.on = false; out.settingsChanged = true; }
        out.payload = schedPayload(sc, settings, 0, t); return out;
      }
      if (sc.warn > 0 && now >= target - sc.warn * MIN && now < target && state.warned[sc.id] !== today) {
        state.warned[sc.id] = today;
        out.payload = schedPayload(sc, settings, Math.max(1, Math.ceil((target - now) / MIN)), t); return out;
      }
    }

    // 2. Focus timer: alternates work and break.
    var f = state.focus, fs = settings.focus || { work: 50, rest: 10 };
    if (f.on && now >= f.until) {
      if (f.phase === 'work') {
        f.phase = 'break'; f.until = now + Math.max(1, fs.rest) * MIN;
        out.payload = { key: 'focus', id: 'focus', kind: 'focus', counts: true, title: 'Focus timer', text: name(settings, 'Focus session done, {name}. Take a ' + fs.rest + '-minute break.'), cheer: 'Enjoy the break!', effect: 'confetti', actions: [{ id: 'done', label: 'Taking a break', primary: true }] };
      } else {
        f.phase = 'work'; f.until = now + Math.max(1, fs.work) * MIN;
        out.payload = { key: 'focus', id: 'focus', kind: 'focus', title: 'Focus timer', text: 'Break is over. Back to it for ' + fs.work + ' minutes.', cheer: 'You have got this!', effect: 'rocket', actions: [{ id: 'done', label: 'Let’s go', primary: true }] };
      }
      return out;
    }

    if (paused || quiet) return out;

    // 3. Repeating reminders (water, break, stretch, eye rest, custom).
    var ids = Object.keys(meta);
    for (i = 0; i < ids.length; i++) {
      var id = ids[i], r = settings.reminders[id];
      if (!r || !r.on) { delete state.last[id]; delete state.snooze[id]; continue; }
      if (state.skip[id] === today) continue;
      if (id === 'rest' && f.on) continue; // the focus timer handles breaks
      if (!state.last[id]) { state.last[id] = now; continue; }
      var due = state.snooze[id] ? now >= state.snooze[id] : now - state.last[id] >= r.every * MIN;
      if (due) {
        state.last[id] = now; delete state.snooze[id];
        out.payload = intervalPayload(id, settings, meta); return out;
      }
    }

    // 4. Daily summary.
    var sm = settings.summary;
    if (sm && sm.on && state.summaryDay !== today) {
      t = parseTime(sm.time);
      if (t !== null && now >= at(now, t) && now < at(now, t) + 60 * MIN) {
        state.summaryDay = today;
        out.payload = { key: 'summary', id: 'summary', kind: 'summary', title: 'Daily summary', text: summaryText(stats, meta, today), cheer: 'See you tomorrow!', effect: 'confetti', actions: [{ id: 'done', label: 'Thanks', primary: true }] };
      }
    }
    return out;
  }

  /* Applies the user's answer. p needs { key, id, kind, counts }. Returns { state, stats }. */
  function act(settings, state, stats, p, action, now) {
    state = fixState(state, now);
    var today = dayKey(now);
    if (!stats || stats.day !== today) {
      var prev = stats, hist = (prev && prev.history && typeof prev.history === 'object') ? prev.history : {};
      if (prev && prev.day && prev.counts) {
        var sum = 0; Object.keys(prev.counts).forEach(function (k) { sum += prev.counts[k] || 0; });
        if (sum) hist[prev.day] = sum;
      }
      var keys = Object.keys(hist);
      if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(function (k) { delete hist[k]; });
      stats = { day: today, counts: {}, history: hist };
    }
    if (action === 'done') {
      var bucket = p.kind === 'interval' ? p.id : (p.kind === 'sched' ? 'sched' : (p.kind === 'focus' && p.counts ? 'focus' : null));
      if (bucket) stats.counts[bucket] = (stats.counts[bucket] || 0) + 1;
    } else if (action === 'skip' && p.kind === 'interval') {
      state.skip[p.id] = today;
    } else if ((action === 'later' || action === 'timeout') && (p.kind === 'interval' || p.kind === 'sched')) {
      state.snooze[p.key] = now + Math.max(1, settings.snooze || 10) * MIN;
    }
    return { state: state, stats: stats };
  }

  /* Last 7 days of finished reminders plus the current streak (days in a row with at least one). */
  function weekSummary(stats, now) {
    var hist = (stats && stats.history) || {}, today = dayKey(now), days = [], total = 0;
    function dayTotal(key) {
      if (stats && stats.day === key) { var n = 0; Object.keys(stats.counts || {}).forEach(function (k) { n += stats.counts[k] || 0; }); return n; }
      return hist[key] || 0;
    }
    for (var i = 6; i >= 0; i--) {
      var t = now - i * 86400000, d = new Date(t), n = dayTotal(dayKey(t));
      total += n;
      days.push({ label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], total: n, today: i === 0 });
    }
    var streak = 0, start = dayTotal(today) > 0 ? 0 : 1;
    for (var j = start; j < 60; j++) { if (dayTotal(dayKey(now - j * 86400000)) > 0) streak++; else break; }
    return { days: days, total: total, streak: streak };
  }

  function setFocus(settings, state, on, now) {
    state = fixState(state, now);
    var fs = settings.focus || { work: 50, rest: 10 };
    state.focus = on ? { on: true, phase: 'work', until: now + Math.max(1, fs.work) * MIN } : { on: false, phase: 'work', until: 0 };
    return state;
  }

  var api = { weekSummary: weekSummary, tick: tick, act: act, setFocus: setFocus, intervalPayload: intervalPayload, inQuiet: inQuiet, parseTime: parseTime, dayKey: dayKey, freshState: freshState };
  root.DBEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
