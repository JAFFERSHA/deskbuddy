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
  ctx.fire('water', true);
  await wait(2600);
  fs.writeFileSync(out + '/overlay.png', (await ctx.overlay().webContents.capturePage()).toPNG());
  fs.writeFileSync(out + '/settings.png', (await ctx.settingsWin().webContents.capturePage()).toPNG());
  const state = await ctx.overlay().webContents.executeJavaScript("({actor: !!document.querySelector('.db-actor:not([hidden])'), bubble: (document.querySelector('.db-bubble')||{}).textContent, charm: !!document.querySelector('.db-charm-body svg')})");
  const names = await ctx.settingsWin().webContents.executeJavaScript("({name: document.getElementById('name').value, charms: document.querySelectorAll('#charms .char').length, pressed: (document.querySelector('#charms [aria-pressed=true]')||{}).textContent})");
  console.log('SMOKE', JSON.stringify({ state, names, errors }));
  ctx.app.exit(0);
};
