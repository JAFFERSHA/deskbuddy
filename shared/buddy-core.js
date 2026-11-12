/* DeskBuddy core: original 2D SVG characters + a small stage that walks them around.
   Shared by the browser extension, the VS Code webview and the demo page. */
(function (root) {
  'use strict';
  if (root.DeskBuddy) return;

  var CHARACTERS = {
    mika:  { name: 'Mika',  pro: false, kind: 'human', skin: '#f2c9a5', hair: '#3b2a20', hairStyle: 'short', top: '#2bb3a3', pants: '#2d3550', shoe: '#f4f4f6', acc: 'beanie', accColor: '#f2b632' },
    arjun: { name: 'Arjun', pro: false, kind: 'human', skin: '#c98e62', hair: '#1d1d22', hairStyle: 'short', top: '#f2793a', pants: '#3a3f4a', shoe: '#ffffff', acc: 'glasses', accColor: '#1d1d22' },
    zoe:   { name: 'Zoe',   pro: false, kind: 'human', skin: '#f6d3b8', hair: '#7a3b2e', hairStyle: 'long',  top: '#8a63f0', pants: '#22263a', shoe: '#ffd166', acc: 'none', accColor: '#000' },
    bolt:  { name: 'Bolt',  pro: true,  kind: 'robot', skin: '#c9d3e0', hair: '#5ee6ff', hairStyle: 'none',  top: '#9fb0c6', pants: '#6f7f96', shoe: '#44506a', acc: 'none', accColor: '#5ee6ff' },
    mochi: { name: 'Mochi', pro: true,  kind: 'cat',   skin: '#f7b267', hair: '#e8894a', hairStyle: 'none',  top: '#f7b267', pants: '#f7b267', shoe: '#fff3e0', acc: 'none', accColor: '#ff7aa2' },
    nova:  { name: 'Nova',  pro: true,  kind: 'astro', skin: '#ffffff', hair: '#1c2a52', hairStyle: 'none',  top: '#f1f4fa', pants: '#dfe5f0', shoe: '#ff6b4a', acc: 'none', accColor: '#ff6b4a' },
    kage:  { name: 'Kage',  pro: true,  kind: 'ninja', skin: '#e8b98f', hair: '#16181f', hairStyle: 'none',  top: '#23262f', pants: '#16181f', shoe: '#3a3f4a', acc: 'none', accColor: '#e5484d' }
  };

  function head(c) {
    var s = '';
    if (c.kind === 'robot') {
      s += '<line x1="60" y1="20" x2="60" y2="8" stroke="' + c.pants + '" stroke-width="3"/>';
      s += '<circle cx="60" cy="7" r="4.5" fill="' + c.accColor + '"/>';
      s += '<rect x="33" y="19" width="54" height="50" rx="12" fill="' + c.skin + '"/>';
      s += '<rect x="27" y="38" width="7" height="14" rx="3" fill="' + c.pants + '"/><rect x="86" y="38" width="7" height="14" rx="3" fill="' + c.pants + '"/>';
      s += '<rect x="40" y="30" width="40" height="22" rx="9" fill="#1b2233"/>';
      s += '<circle class="db-eye" cx="50" cy="41" r="4.5" fill="' + c.accColor + '"/><circle class="db-eye" cx="70" cy="41" r="4.5" fill="' + c.accColor + '"/>';
      s += '<rect x="50" y="58" width="20" height="4" rx="2" fill="#6f7f96"/>';
      return s;
    }
    if (c.kind === 'astro') {
      s += '<circle cx="60" cy="44" r="31" fill="' + c.skin + '"/>';
      s += '<rect x="37" y="28" width="46" height="32" rx="15" fill="' + c.hair + '"/>';
      s += '<path d="M44 36 Q50 31 58 32" stroke="#8fb4ff" stroke-width="3" fill="none" stroke-linecap="round"/>';
      s += '<circle class="db-eye" cx="52" cy="46" r="3" fill="#fff"/><circle class="db-eye" cx="68" cy="46" r="3" fill="#fff"/>';
      s += '<rect x="27" y="40" width="6" height="12" rx="3" fill="' + c.accColor + '"/><rect x="87" y="40" width="6" height="12" rx="3" fill="' + c.accColor + '"/>';
      return s;
    }
    if (c.kind === 'cat') {
      s += '<path d="M36 30 L34 6 L54 22 Z" fill="' + c.skin + '"/><path d="M84 30 L86 6 L66 22 Z" fill="' + c.skin + '"/>';
      s += '<path d="M39 24 L38 13 L48 21 Z" fill="' + c.accColor + '"/><path d="M81 24 L82 13 L72 21 Z" fill="' + c.accColor + '"/>';
      s += '<ellipse cx="60" cy="46" rx="30" ry="27" fill="' + c.skin + '"/>';
      s += '<ellipse cx="60" cy="56" rx="14" ry="10" fill="' + c.shoe + '"/>';
      s += '<ellipse class="db-eye" cx="49" cy="44" rx="3.4" ry="4.6" fill="#22252e"/><ellipse class="db-eye" cx="71" cy="44" rx="3.4" ry="4.6" fill="#22252e"/>';
      s += '<path d="M57 52 L63 52 L60 56 Z" fill="' + c.accColor + '"/>';
      s += '<path d="M60 56 Q56 62 52 59 M60 56 Q64 62 68 59" stroke="#22252e" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
      s += '<path d="M40 54 L26 51 M40 58 L26 60 M80 54 L94 51 M80 58 L94 60" stroke="#22252e" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>';
      return s;
    }
    // human + ninja share a base
    if (c.hairStyle === 'long') s += '<rect x="29" y="24" width="62" height="66" rx="24" fill="' + c.hair + '"/>';
    s += '<circle cx="33" cy="49" r="5" fill="' + c.skin + '"/><circle cx="87" cy="49" r="5" fill="' + c.skin + '"/>';
    s += '<circle cx="60" cy="46" r="28" fill="' + c.skin + '"/>';
    if (c.kind === 'ninja') {
      s += '<path d="M32 46 A28 28 0 0 1 88 46 L88 38 L32 38 Z" fill="' + c.hair + '"/>';
      s += '<path d="M32.5 52 A28 28 0 0 0 87.5 52 Z" fill="' + c.hair + '"/>';
      s += '<rect x="31" y="32" width="58" height="8" rx="4" fill="' + c.accColor + '"/>';
      s += '<path d="M88 34 L104 28 L100 38 L106 44 L88 40 Z" fill="' + c.accColor + '"/>';
      s += '<ellipse class="db-eye" cx="50" cy="46" rx="3.2" ry="3.6" fill="#16181f"/><ellipse class="db-eye" cx="70" cy="46" rx="3.2" ry="3.6" fill="#16181f"/>';
      return s;
    }
    if (c.hairStyle === 'short') s += '<path d="M32 46 Q30 16 60 17 Q90 16 88 46 Q84 31 60 31 Q36 31 32 46 Z" fill="' + c.hair + '"/>';
    if (c.hairStyle === 'long') s += '<path d="M32 50 Q28 16 60 17 Q92 16 88 50 Q82 30 62 30 Q50 40 32 50 Z" fill="' + c.hair + '"/>';
    s += '<ellipse class="db-eye" cx="50" cy="48" rx="3.2" ry="4.2" fill="#22252e"/><ellipse class="db-eye" cx="70" cy="48" rx="3.2" ry="4.2" fill="#22252e"/>';
    s += '<circle cx="43" cy="57" r="4" fill="#ff8f8f" opacity=".45"/><circle cx="77" cy="57" r="4" fill="#ff8f8f" opacity=".45"/>';
    s += '<path d="M53 60 Q60 67 67 60" stroke="#22252e" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    if (c.acc === 'beanie') {
      s += '<path d="M31 38 Q30 11 60 11 Q90 11 89 38 Z" fill="' + c.accColor + '"/>';
      s += '<rect x="28" y="31" width="64" height="11" rx="5.5" fill="' + c.accColor + '"/><rect x="28" y="31" width="64" height="11" rx="5.5" fill="#000" opacity=".12"/>';
      s += '<circle cx="60" cy="9" r="6" fill="#fff"/>';
    }
    if (c.acc === 'glasses') {
      s += '<rect x="41" y="41" width="17" height="14" rx="5" fill="rgba(255,255,255,.25)" stroke="' + c.accColor + '" stroke-width="2.4"/>';
      s += '<rect x="62" y="41" width="17" height="14" rx="5" fill="rgba(255,255,255,.25)" stroke="' + c.accColor + '" stroke-width="2.4"/>';
      s += '<path d="M58 47 L62 47" stroke="' + c.accColor + '" stroke-width="2.4"/>';
    }
    return s;
  }

  function svg(id) {
    var c = CHARACTERS[id] || CHARACTERS.mika;
    var hand = c.kind === 'human' || c.kind === 'ninja' ? c.skin : (c.kind === 'cat' ? c.shoe : c.pants);
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200" role="img" aria-label="' + c.name + '">';
    s += '<ellipse class="db-shadow" cx="60" cy="184" rx="30" ry="5" fill="#000" opacity=".22"/>';
    s += '<g class="db-all">';
    if (c.kind === 'cat') s += '<path class="db-tail" d="M80 126 Q108 124 104 96" stroke="' + c.hair + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
    if (c.kind === 'astro') s += '<rect x="30" y="80" width="60" height="46" rx="12" fill="#c7cfdd"/>';
    s += '<g class="db-leg db-leg-l"><rect x="45" y="124" width="13" height="50" rx="6.5" fill="' + c.pants + '"/><rect x="40" y="170" width="22" height="13" rx="6.5" fill="' + c.shoe + '"/></g>';
    s += '<g class="db-leg db-leg-r"><rect x="62" y="124" width="13" height="50" rx="6.5" fill="' + c.pants + '"/><rect x="58" y="170" width="22" height="13" rx="6.5" fill="' + c.shoe + '"/></g>';
    s += '<g class="db-arm db-arm-l"><rect x="27" y="82" width="12" height="42" rx="6" fill="' + c.top + '"/><circle cx="33" cy="126" r="6.5" fill="' + hand + '"/></g>';
    s += '<rect x="37" y="76" width="46" height="60" rx="15" fill="' + c.top + '"/>';
    if (c.kind === 'human') s += '<path d="M48 112 h24 v10 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 Z" fill="#000" opacity=".12"/><path d="M60 78 v22" stroke="#000" stroke-width="2" opacity=".15"/>';
    if (c.kind === 'robot') s += '<rect x="46" y="88" width="28" height="18" rx="5" fill="#1b2233"/><circle cx="53" cy="97" r="3" fill="' + c.accColor + '"/><circle cx="67" cy="97" r="3" fill="#ffd166"/>';
    if (c.kind === 'astro') s += '<rect x="48" y="90" width="24" height="14" rx="4" fill="' + c.hair + '"/><circle cx="54" cy="97" r="2.5" fill="' + c.accColor + '"/><circle cx="62" cy="97" r="2.5" fill="#5ee6ff"/>';
    if (c.kind === 'cat') s += '<ellipse cx="60" cy="110" rx="14" ry="18" fill="' + c.shoe + '"/>';
    if (c.kind === 'ninja') s += '<rect x="37" y="116" width="46" height="7" fill="' + c.accColor + '"/>';
    s += '<g class="db-head">' + head(c) + '</g>';
    s += '<g class="db-arm db-arm-r"><rect x="81" y="82" width="12" height="42" rx="6" fill="' + c.top + '"/>';
    s += '<g class="db-bottle"><rect x="60" y="119" width="26" height="13" rx="4" fill="#7fd3ff"/><rect x="66" y="119" width="14" height="13" fill="#fff" opacity=".35"/><rect x="55" y="121.5" width="6" height="8" rx="2" fill="#2a7fd6"/></g>';
    s += '<circle cx="87" cy="126" r="6.5" fill="' + hand + '"/></g>';
    s += '</g></svg>';
    return s;
  }

  /* Builds the character as real SVG nodes and puts it in el. */
  function render(el, id) {
    var doc = el.ownerDocument;
    var parsed = new doc.defaultView.DOMParser().parseFromString(svg(id), 'image/svg+xml');
    var node = doc.importNode(parsed.documentElement, true);
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(node);
    return node;
  }

  var CSS = [
    '.db-stage{left:0;right:0;bottom:0;height:0;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.35}',
    '.db-stage.db-fixed{position:fixed;z-index:2147483646}',
    '.db-stage.db-abs{position:absolute}',
    '.db-actor{position:absolute;left:0;bottom:0;pointer-events:auto;cursor:pointer;user-select:none;-webkit-user-select:none;will-change:transform;-webkit-tap-highlight-color:transparent}',
    '.db-actor[hidden],.db-bubble[hidden]{display:none}',
    '.db-sprite svg{display:block;width:100%;height:auto;overflow:visible}',
    '.db-sprite.db-flip{transform:scaleX(-1)}',
    '.db-close{position:absolute;top:-4px;right:-4px;width:22px;height:22px;border-radius:50%;border:0;background:#22252e;color:#fff;font-size:14px;line-height:22px;padding:0;cursor:pointer;opacity:0;transition:opacity .15s}',
    '.db-actor:hover .db-close,.db-close:focus-visible{opacity:.9}',
    '.db-leg-l{transform-origin:51.5px 128px}.db-leg-r{transform-origin:68.5px 128px}',
    '.db-arm-l{transform-origin:33px 87px}.db-arm-r{transform-origin:87px 87px}',
    '.db-head{transform-origin:60px 74px}.db-all{transform-origin:60px 184px}',
    '.db-tail{transform-origin:80px 126px;animation:db-tail 1.6s ease-in-out infinite alternate}',
    '.db-eye{transform-box:fill-box;transform-origin:center;animation:db-blink 4.2s infinite}',
    '.db-bottle{opacity:0;transition:opacity .2s}',
    '.db-arm,.db-leg,.db-head{transition:transform .25s ease}',
    '.is-idle .db-all{animation:db-breathe 2.6s ease-in-out infinite}',
    '.is-walk .db-all{animation:db-bob .28s ease-in-out infinite alternate}',
    '.is-walk .db-leg-l,.is-walk .db-arm-r{animation:db-swing-a .28s ease-in-out infinite alternate}',
    '.is-walk .db-leg-r,.is-walk .db-arm-l{animation:db-swing-b .28s ease-in-out infinite alternate}',
    '.is-wave .db-all{animation:db-breathe 2.6s ease-in-out infinite}',
    '.is-wave .db-arm-r{animation:db-wave .38s ease-in-out infinite alternate}',
    '.is-wave .db-head{transform:rotate(4deg)}',
    '.is-drink .db-arm-r{transform:rotate(104deg)}',
    '.is-drink .db-bottle{opacity:1}',
    '.is-drink .db-head{animation:db-sip 1s ease-in-out infinite alternate}',
    '.is-cheer .db-all{animation:db-jump .42s ease-out infinite alternate}',
    '.is-cheer .db-arm-r{transform:rotate(-150deg)}.is-cheer .db-arm-l{transform:rotate(150deg)}',
    '.is-cheer .db-shadow{animation:db-shadow .42s ease-out infinite alternate}',
    '.db-shadow{transform-box:fill-box;transform-origin:center}',
    '@keyframes db-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.018)}}',
    '@keyframes db-bob{from{transform:translateY(0)}to{transform:translateY(-3px)}}',
    '@keyframes db-swing-a{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}',
    '@keyframes db-swing-b{from{transform:rotate(24deg)}to{transform:rotate(-24deg)}}',
    '@keyframes db-wave{from{transform:rotate(-128deg)}to{transform:rotate(-162deg)}}',
    '@keyframes db-sip{from{transform:rotate(0)}to{transform:rotate(-9deg)}}',
    '@keyframes db-jump{from{transform:translateY(0)}to{transform:translateY(-20px)}}',
    '@keyframes db-shadow{from{transform:scale(1)}to{transform:scale(.7)}}',
    '@keyframes db-tail{from{transform:rotate(-8deg)}to{transform:rotate(14deg)}}',
    '@keyframes db-blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}',
    '.db-bubble{position:absolute;left:0;box-sizing:border-box;width:max-content;max-width:min(270px,calc(100vw - 16px));max-height:calc(100vh - 12px);overflow:auto;padding:12px 14px;border-radius:16px;background:#fff;color:#1c1e26;font-size:14px;box-shadow:0 8px 28px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.06);pointer-events:auto;animation:db-pop .22s cubic-bezier(.2,1.4,.4,1)}',
    '.db-bubble-text{font-weight:600;margin:0}',
    '.db-bubble-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
    '.db-btn{font:inherit;font-size:13px;font-weight:600;border-radius:999px;padding:7px 14px;border:1px solid #d5d8e0;background:#fff;color:#1c1e26;cursor:pointer}',
    '.db-btn:hover{background:#f1f3f7}',
    '.db-btn.db-primary{background:#2f6bff;border-color:#2f6bff;color:#fff}.db-btn.db-primary:hover{background:#1f56e0}',
    '.db-btn:focus-visible,.db-close:focus-visible{outline:2px solid #2f6bff;outline-offset:2px}',
    '@keyframes db-pop{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.db-sprite *{animation-duration:0s!important;animation-iteration-count:1!important}.db-bubble{animation:none}}'
  ].join('\n');

  var CHATTER = ['Hi there!', 'You are doing great.', 'Small sips add up.', 'Shoulders down, breathe.', 'Nice work today.', 'Need anything? Just kidding, I only walk.'];

  /* opts: mount (Element|ShadowRoot), fixed (bool), size (px), character (id),
           onAction(actionId, reminder), onHide(), closable (bool) */
  function createStage(opts) {
    var doc = (opts.mount.ownerDocument || document);
    var size = opts.size || 96;
    var H = Math.round(size * 200 / 120);
    var stage = doc.createElement('div');
    stage.className = 'db-stage ' + (opts.fixed ? 'db-fixed' : 'db-abs');
    var actor = doc.createElement('div');
    actor.className = 'db-actor';
    actor.style.width = size + 'px';
    actor.hidden = true;
    var sprite = doc.createElement('div');
    sprite.className = 'db-sprite is-idle';
    actor.appendChild(sprite);
    if (opts.closable) {
      var close = doc.createElement('button');
      close.className = 'db-close';
      close.type = 'button';
      close.setAttribute('aria-label', 'Hide buddy on this page');
      close.textContent = '×';
      close.addEventListener('click', function (e) { e.stopPropagation(); if (opts.onHide) opts.onHide(); });
      actor.appendChild(close);
    }
    var bubble = doc.createElement('div');
    bubble.className = 'db-bubble';
    bubble.hidden = true;
    bubble.setAttribute('role', 'status');
    stage.appendChild(actor);
    stage.appendChild(bubble);
    opts.mount.appendChild(stage);

    var x = -size, facing = 1, anim = 'idle', moveId = 0, flow = 0;
    var pet = false, current = null, timers = [], dead = false;
    var charId = opts.character || 'mika';
    render(sprite, charId);

    function width() { return stage.clientWidth || (doc.defaultView ? doc.defaultView.innerWidth : 800); }
    function place() {
      actor.style.transform = 'translateX(' + Math.round(x) + 'px)';
      if (!bubble.hidden) {
        var bw = bubble.offsetWidth, W = width();
        var avail = opts.fixed ? (doc.defaultView ? doc.defaultView.innerHeight : 600) : (stage.parentNode.clientHeight || 600);
        var left, bottom;
        if (H + 10 + bubble.offsetHeight <= avail) {
          left = Math.max(8, Math.min(W - bw - 8, x + size / 2 - bw / 2));
          bottom = H + 6;
        } else {
          // Not enough room above the character (short panel): put the bubble beside it.
          left = x + size + 4 + bw <= W - 4 ? x + size + 4 : Math.max(4, x - bw - 4);
          bottom = 6;
        }
        bubble.style.left = Math.round(left) + 'px';
        bubble.style.bottom = bottom + 'px';
      }
    }
    function setAnim(name) {
      anim = name;
      sprite.className = 'db-sprite is-' + name + (facing < 0 ? ' db-flip' : '');
    }
    function wait(ms) {
      return new Promise(function (res) { timers.push(setTimeout(res, ms)); });
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function walkTo(tx, speed) {
      var my = ++moveId;
      speed = speed || 150;
      return new Promise(function (res) {
        if (Math.abs(tx - x) < 2) { setAnim('idle'); return res(true); }
        facing = tx >= x ? 1 : -1;
        setAnim('walk');
        var last = null;
        function step(now) {
          if (dead || my !== moveId) return res(false);
          if (last === null) last = now;
          var dt = Math.min(0.05, (now - last) / 1000); last = now;
          var d = tx - x, s = speed * dt;
          if (Math.abs(d) <= s) { x = tx; place(); setAnim('idle'); return res(true); }
          x += (d > 0 ? 1 : -1) * s; place();
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    function show() { if (actor.hidden) { actor.hidden = false; x = -size; place(); } }
    function say(text, actions) {
      bubble.textContent = '';
      var p = doc.createElement('p');
      p.className = 'db-bubble-text';
      p.textContent = text;
      bubble.appendChild(p);
      if (actions && actions.length) {
        var row = doc.createElement('div');
        row.className = 'db-bubble-actions';
        actions.forEach(function (a) {
          var b = doc.createElement('button');
          b.type = 'button';
          b.className = 'db-btn' + (a.primary ? ' db-primary' : '');
          b.textContent = a.label;
          b.addEventListener('click', function (e) { e.stopPropagation(); answer(a.id); });
          row.appendChild(b);
        });
        bubble.appendChild(row);
      }
      bubble.hidden = false;
      bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = '';
      place();
    }
    function hush() { bubble.hidden = true; }

    function begin() { flow++; moveId++; clearTimers(); return flow; }

    async function settle(my) {
      if (my !== flow || dead) return;
      hush();
      if (pet) return wander(my);
      await walkTo(-size - 10);
      if (my === flow) actor.hidden = true;
    }
    async function wander(my) {
      while (my === flow && pet && !dead) {
        var W = width();
        var tx = 8 + Math.random() * Math.max(0, W - size - 16);
        var ok = await walkTo(tx, 90);
        if (!ok || my !== flow) return;
        facing = 1; setAnim(Math.random() < 0.2 ? 'wave' : 'idle');
        await wait(2500 + Math.random() * 5000);
        if (my === flow) setAnim('idle');
      }
    }
    async function answer(actionId) {
      var r = current; if (!r) return;
      current = null;
      var my = begin();
      if (opts.onAction) opts.onAction(actionId, r);
      if (actionId === 'done') {
        facing = 1;
        if (r.kind === 'water') { say('Cheers!'); setAnim('drink'); await wait(1800); if (my !== flow) return; }
        say(r.cheer || 'Nice one!'); setAnim('cheer');
        await wait(1500);
      } else if (actionId === 'later') {
        say('Okay, I will ask again soon.'); setAnim('idle');
        await wait(1300);
      }
      settle(my);
    }

    var api = {
      el: stage,
      setCharacter: function (id) { if (CHARACTERS[id]) { charId = id; render(sprite, id); } },
      /* r: { id, kind, text, cheer, actions:[{id,label,primary}], timeout } */
      remind: async function (r) {
        if (current && opts.onAction) opts.onAction('timeout', current);
        var my = begin();
        current = r;
        hush(); show();
        var W = width();
        var tx = Math.max(12, Math.min(W - size - 12, W * 0.08));
        await walkTo(tx, 190);
        if (my !== flow) return;
        facing = 1; setAnim('wave');
        say(r.text, r.actions || [{ id: 'done', label: 'Done', primary: true }, { id: 'later', label: 'Remind me later' }]);
        await wait(r.timeout || 60000);
        if (my !== flow) return;
        current = null;
        if (opts.onAction) opts.onAction('timeout', r);
        settle(begin());
      },
      setPet: function (on) {
        on = !!on;
        if (on === pet) return;
        pet = on;
        if (current) return;
        var my = begin();
        if (pet) { show(); wander(my); } else { settle(my); }
      },
      poke: async function () {
        if (current || actor.hidden) return;
        var my = begin();
        facing = 1; setAnim('wave');
        say(CHATTER[Math.floor(Math.random() * CHATTER.length)]);
        await wait(2400);
        settle(my);
      },
      isBusy: function () { return !!current; },
      destroy: function () { dead = true; begin(); stage.remove(); }
    };
    actor.addEventListener('click', function () { api.poke(); });
    if (doc.defaultView) doc.defaultView.addEventListener('resize', function () {
      if (dead || actor.hidden) return;
      var W = width();
      if (x > W - size - 8 && !current) { x = Math.max(8, W - size - 8); }
      place();
    });
    return api;
  }

  root.DeskBuddy = { CHARACTERS: CHARACTERS, svg: svg, render: render, CSS: CSS, createStage: createStage };
})(typeof globalThis !== 'undefined' ? globalThis : this);
