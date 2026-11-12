/* Shared settings model for background, content script and popup. */
(function (root) {
  'use strict';

  /* Where "I'm interested" sign-ups are sent. Leave '' to keep them only on the
     user's device. Set it to a form endpoint that accepts a JSON POST
     ({ email, source, ts }) once you have one. */
  var WAITLIST_ENDPOINT = '';

  var REMINDERS = {
    water:   { title: 'Water',    every: 45, on: true,  text: 'Hey {name}, did you drink water?', done: 'Yes!',  cheer: 'Hydrated. Nice one!' },
    rest:    { title: 'Break',    every: 60, on: true,  text: 'Time for a short break, {name}. Step away for five minutes.', done: 'Taking it', cheer: 'Enjoy the break!' },
    stretch: { title: 'Stretch',  every: 90, on: false, text: 'Stretch time, {name}. Roll your shoulders and stand up.', done: 'Stretched', cheer: 'Feels better, right?' },
    eyes:    { title: 'Eye rest', every: 20, on: false, text: 'Eye rest: look at something far away for 20 seconds.', done: 'Done', cheer: 'Your eyes say thanks!' },
    custom:  { title: 'Custom',   every: 30, on: false, text: 'Your own reminder goes here.', done: 'Done', cheer: 'Great!' }
  };

  var DEFAULTS = {
    name: 'friend',
    character: 'mika',
    pet: true,
    charm: 'none',
    charmX: 0.82,
    charmLen: -1,
    snooze: 10,
    pausedUntil: 0,
    reminders: {}
  };
  Object.keys(REMINDERS).forEach(function (k) {
    DEFAULTS.reminders[k] = { on: REMINDERS[k].on, every: REMINDERS[k].every, text: REMINDERS[k].text };
  });

  function merge(saved) {
    var s = JSON.parse(JSON.stringify(DEFAULTS));
    saved = saved || {};
    ['name', 'character', 'pet', 'charm', 'charmX', 'charmLen', 'snooze', 'pausedUntil'].forEach(function (k) {
      if (saved[k] !== undefined) s[k] = saved[k];
    });
    Object.keys(REMINDERS).forEach(function (k) {
      var r = (saved.reminders || {})[k];
      if (r) {
        if (typeof r.on === 'boolean') s.reminders[k].on = r.on;
        if (r.every >= 1) s.reminders[k].every = Math.min(600, Math.round(r.every));
        if (typeof r.text === 'string' && r.text.trim()) s.reminders[k].text = r.text.slice(0, 160);
      }
    });
    if (!(s.charmX >= 0 && s.charmX <= 1)) s.charmX = 0.82;
    if (typeof s.charmLen !== 'number') s.charmLen = -1;
    if (root.DeskBuddy && s.charm !== 'none' && !root.DeskBuddy.CHARMS[s.charm]) s.charm = 'none';
    if (!root.DeskBuddy || !root.DeskBuddy.CHARACTERS[s.character] || root.DeskBuddy.CHARACTERS[s.character].pro) {
      if (root.DeskBuddy) s.character = 'mika';
    }
    return s;
  }

  function reminderPayload(id, settings) {
    var meta = REMINDERS[id], r = settings.reminders[id];
    if (!meta || !r) return null;
    return {
      id: id,
      kind: id,
      text: r.text.replace(/\{name\}/g, settings.name || 'friend'),
      cheer: meta.cheer,
      actions: [{ id: 'done', label: meta.done, primary: true }, { id: 'later', label: 'Remind me later' }]
    };
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  root.DB = { WAITLIST_ENDPOINT: WAITLIST_ENDPOINT, REMINDERS: REMINDERS, DEFAULTS: DEFAULTS, merge: merge, reminderPayload: reminderPayload, today: today };
})(typeof globalThis !== 'undefined' ? globalThis : this);
