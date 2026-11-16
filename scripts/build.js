#!/usr/bin/env node
/* Builds dist/: Chrome+Edge zip, Firefox zip, VS Code folder, and the demo page. No dependencies. */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = path.join(__dirname, '..'), dist = path.join(root, 'dist');
const core = path.join(root, 'shared', 'buddy-core.js');
const engine = path.join(root, 'shared', 'engine.js');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const target of ['chrome', 'firefox']) {
  const out = path.join(dist, target);
  fs.cpSync(path.join(root, 'browser'), out, { recursive: true, filter: s => !/manifest\.\w+\.json$/.test(s) });
  fs.copyFileSync(core, path.join(out, 'buddy-core.js'));
  fs.copyFileSync(engine, path.join(out, 'engine.js'));
  fs.copyFileSync(path.join(root, 'browser', `manifest.${target}.json`), path.join(out, 'manifest.json'));
  const name = target === 'chrome' ? 'deskbuddy-chrome-edge.zip' : 'deskbuddy-firefox.zip';
  execSync(`zip -qr ../${name} .`, { cwd: out });
}

fs.copyFileSync(core, path.join(root, 'vscode', 'media', 'buddy-core.js'));
fs.copyFileSync(engine, path.join(root, 'vscode', 'engine.js'));

// Desktop app: reuses the core, the settings model and the popup as its settings window.
const ui = path.join(root, 'desktop', 'ui');
fs.rmSync(ui, { recursive: true, force: true });
fs.mkdirSync(path.join(ui, 'popup'), { recursive: true });
fs.copyFileSync(core, path.join(ui, 'buddy-core.js'));
fs.copyFileSync(engine, path.join(ui, 'engine.js'));
fs.copyFileSync(path.join(root, 'browser', 'defaults.js'), path.join(ui, 'defaults.js'));
for (const f of ['popup.html', 'popup.css', 'popup.js']) fs.copyFileSync(path.join(root, 'browser', 'popup', f), path.join(ui, 'popup', f));
fs.mkdirSync(path.join(root, 'desktop', 'build'), { recursive: true });
fs.copyFileSync(path.join(root, 'desktop', 'icon-source.png'), path.join(root, 'desktop', 'build', 'icon.png'));

const demo = fs.readFileSync(path.join(root, 'demo', 'demo.src.html'), 'utf8')
  .replace('/*__CORE__*/', () => fs.readFileSync(core, 'utf8'));
fs.writeFileSync(path.join(dist, 'demo.html'), demo);
console.log('Built:', fs.readdirSync(dist).join(', '));
