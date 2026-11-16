/* Development check only (DESKBUDDY_SMOKE=1): captures the windows to PNG files and quits. */
const fs = require('fs');
module.exports = async function (ctx) {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const out = process.env.DESKBUDDY_SMOKE;
  const errors = [];
  ctx.overlay().webContents.on('console-message', (e, level, msg) => { if (level >= 2) errors.push('overlay: ' + msg); });
  ctx.openSettings();
  await wait(1500);
  ctx.settingsWin().webContents.on('console-message', (e, level, msg) => { if (level >= 2) errors.push('settings: ' + msg); });
  ctx.update(s => { s.charm = 'evileye'; s.name = 'Jaffer'; });
  await wait(4500);
  // A timed reminder due right now must come through the engine tick.
  const d = new Date(), hhmm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  ctx.update(s => { s.schedules = [{ id: 'm1', text: 'Team meeting', time: hhmm, repeat: 'once', warn: 0, on: true }]; });
  await wait(600);
  ctx.tick();
  await wait(2600);
  const sched = await ctx.overlay().webContents.executeJavaScript("(document.querySelector('.db-bubble')||{}).innerText");
  console.log('SCHED', JSON.stringify(sched), 'once now off:', ctx.store().sync.settings.schedules[0].on === false);
  ctx.fire('water');
  await wait(2600);
  fs.writeFileSync(out + '/overlay.png', (await ctx.overlay().webContents.capturePage()).toPNG());
  fs.writeFileSync(out + '/settings.png', (await ctx.settingsWin().webContents.capturePage()).toPNG());
  const state = await ctx.overlay().webContents.executeJavaScript("({actor: !!document.querySelector('.db-actor:not([hidden])'), bubble: (document.querySelector('.db-bubble')||{}).textContent, charm: !!document.querySelector('.db-charm-body svg')})");
  const names = await ctx.settingsWin().webContents.executeJavaScript("({name: document.getElementById('name').value, charms: document.querySelectorAll('#charms .char').length, pressed: (document.querySelector('#charms [aria-pressed=true]')||{}).textContent})");
  console.log('SMOKE', JSON.stringify({ state, names, errors }));
  ctx.app.exit(0);
};
