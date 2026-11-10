#!/usr/bin/env node
/* Builds dist/: Chrome+Edge zip, Firefox zip, VS Code folder, and the demo page. No dependencies. */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = path.join(__dirname, '..'), dist = path.join(root, 'dist');
const core = path.join(root, 'shared', 'buddy-core.js');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const target of ['chrome', 'firefox']) {
  const out = path.join(dist, target);
  fs.cpSync(path.join(root, 'browser'), out, { recursive: true, filter: s => !/manifest\.\w+\.json$/.test(s) });
  fs.copyFileSync(core, path.join(out, 'buddy-core.js'));
  fs.copyFileSync(path.join(root, 'browser', `manifest.${target}.json`), path.join(out, 'manifest.json'));
  const name = target === 'chrome' ? 'deskbuddy-chrome-edge.zip' : 'deskbuddy-firefox.zip';
  execSync(`zip -qr ../${name} .`, { cwd: out });
}

fs.copyFileSync(core, path.join(root, 'vscode', 'media', 'buddy-core.js'));

const demo = fs.readFileSync(path.join(root, 'demo', 'demo.src.html'), 'utf8')
  .replace('/*__CORE__*/', () => fs.readFileSync(core, 'utf8'));
fs.writeFileSync(path.join(dist, 'demo.html'), demo);
console.log('Built:', fs.readdirSync(dist).join(', '));
