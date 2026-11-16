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


  /* ---- Hanging charms: original drawings of traditional good-luck motifs ---- */
  var CHARMS = {
    evileye: { name: 'Evil eye', string: '#b08d3c', ratio: 118 / 100 },
    lemon:   { name: 'Lemon & chilli', string: '#b08d3c', ratio: 150 / 100 },
    mask:    { name: 'Drishti mask', string: '#b08d3c', ratio: 132 / 100 },
    hamsa:   { name: 'Hamsa hand', string: '#b08d3c', ratio: 124 / 100 },
    webby:   { name: 'Webby', string: '#c9ccd6', ratio: 86 / 100 }
  };

  function charmSvg(id) {
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ';
    if (id === 'lemon') {
      var ch = [['M50 60 Q30 66 16 84'], ['M50 64 Q70 70 84 88'], ['M50 70 Q32 80 22 104'], ['M50 74 Q68 84 78 108'], ['M50 82 Q40 100 34 126'], ['M50 86 Q60 104 66 130'], ['M50 94 Q50 118 50 144']];
      o += '150" role="img" aria-label="Lemon and chilli charm"><path d="M50 0 V62" stroke="#b08d3c" stroke-width="1.5"/>';
      o += '<circle cx="42" cy="12" r="9" fill="#2b2b2e"/><circle cx="39" cy="9" r="2.5" fill="#5a5a60"/>';
      ch.forEach(function (c) { o += '<path d="' + c[0] + '" stroke="#2f7d2b" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="' + c[0] + '" stroke="#49ad41" stroke-width="4" fill="none" stroke-linecap="round"/>'; });
      o += '<ellipse cx="54" cy="38" rx="27" ry="25" fill="#f5cf1c"/><ellipse cx="54" cy="38" rx="27" ry="25" fill="none" stroke="#dcae0c" stroke-width="2"/>';
      o += '<ellipse cx="45" cy="28" rx="9" ry="6" fill="#fff" opacity=".4"/><circle cx="79" cy="44" r="3" fill="#dcae0c"/>';
    } else if (id === 'mask') {
      o += '132" role="img" aria-label="Drishti mask charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/><ellipse cx="50" cy="15" rx="7" ry="6.5" fill="#d8342b"/><path d="M43.5 15h13" stroke="#f2b632" stroke-width="1.5"/><circle cx="50" cy="25" r="4" fill="#f2b632"/>';
      o += '<path d="M24 60 Q5 48 11 26 Q20 41 34 47 Z" fill="#f4ead2"/><path d="M76 60 Q95 48 89 26 Q80 41 66 47 Z" fill="#f4ead2"/>';
      o += '<circle cx="15" cy="84" r="5.5" fill="#c32820"/><circle cx="85" cy="84" r="5.5" fill="#c32820"/><circle cx="14" cy="93" r="3.6" fill="#f2b632"/><circle cx="86" cy="93" r="3.6" fill="#f2b632"/>';
      o += '<ellipse cx="50" cy="82" rx="34" ry="36" fill="#d62f26"/>';
      [[26, 54], [35, 47], [45, 43], [55, 43], [65, 47], [74, 54], [50, 51], [40, 53], [60, 53]].forEach(function (c) { o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="9" fill="#1b1b1f"/>'; });
      o += '<path d="M18 68 Q50 53 82 68 L81 75 Q50 61 19 75 Z" fill="#f2b632"/>';
      o += '<path d="M42 72h16M43 76.5h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="50" cy="74.2" r="2.3" fill="#8c1410"/>';
      o += '<path d="M23 84 Q34 77 45 86" stroke="#1b1b1f" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M77 84 Q66 77 55 86" stroke="#1b1b1f" stroke-width="5.5" fill="none" stroke-linecap="round"/>';
      o += '<circle cx="35" cy="94" r="9" fill="#fff"/><circle cx="35" cy="94" r="5" fill="#7a1d10"/><circle cx="35" cy="94" r="2.4" fill="#111"/><circle cx="65" cy="94" r="9" fill="#fff"/><circle cx="65" cy="94" r="5" fill="#7a1d10"/><circle cx="65" cy="94" r="2.4" fill="#111"/>';
      o += '<path d="M46 101 Q50 106 54 101" stroke="#8c1410" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      o += '<path d="M38 110 Q50 127 62 110 Z" fill="#5b0f0c"/><path d="M45 113 Q50 131 55 113 Z" fill="#ff6b6b"/>';
      o += '<path d="M38.5 109 l3.5 10 l3.5 -10 Z" fill="#fff"/><path d="M54.5 109 l3.5 10 l3.5 -10 Z" fill="#fff"/>';
      o += '<path d="M50 105 Q38 100 25 109 Q38 113 50 109 Q62 113 75 109 Q62 100 50 105 Z" fill="#1b1b1f"/>';
    } else if (id === 'hamsa') {
      o += '124" role="img" aria-label="Hamsa hand charm"><circle cx="50" cy="5" r="4" fill="#f2b632"/>';
      o += '<path d="M27 38 Q3 42 7 66 Q10 76 19 71 Q16 56 31 54 Z" fill="#2c3193"/><path d="M73 38 Q97 42 93 66 Q90 76 81 71 Q84 56 69 54 Z" fill="#2c3193"/>';
      o += '<rect x="24" y="9" width="52" height="58" rx="22" fill="#2c3193"/><rect x="25" y="48" width="15" height="58" rx="7.5" fill="#2c3193"/><rect x="60" y="48" width="15" height="58" rx="7.5" fill="#2c3193"/><rect x="42" y="48" width="16" height="70" rx="8" fill="#2c3193"/>';
      o += '<path d="M30 30 Q50 12 70 30" stroke="#f29a2e" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      o += '<ellipse cx="50" cy="42" rx="17" ry="10.5" fill="#fff"/><circle cx="50" cy="42" r="7.5" fill="#4fc3f0"/><circle cx="50" cy="42" r="3.4" fill="#10131c"/>';
      [[32.5, 76], [32.5, 88], [32.5, 99], [67.5, 76], [67.5, 88], [67.5, 99], [50, 76], [50, 89], [50, 102], [50, 111]].forEach(function (c) { o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="2.4" fill="#f29a2e"/>'; });
      o += '<circle cx="13" cy="64" r="2.2" fill="#f29a2e"/><circle cx="87" cy="64" r="2.2" fill="#f29a2e"/>';
    } else if (id === 'webby') {
      o += '86" role="img" aria-label="Webby the spider">';
      [['M32 44 Q14 34 8 46'], ['M30 50 Q10 48 6 62'], ['M32 56 Q14 62 12 76'], ['M37 62 Q25 72 27 83'], ['M68 44 Q86 34 92 46'], ['M70 50 Q90 48 94 62'], ['M68 56 Q86 62 88 76'], ['M63 62 Q75 72 73 83']].forEach(function (c) { o += '<path d="' + c[0] + '" stroke="#3a2a66" stroke-width="4.5" fill="none" stroke-linecap="round"/>'; });
      o += '<ellipse cx="50" cy="50" rx="25" ry="23" fill="#6a49b8"/><ellipse cx="50" cy="60" rx="13" ry="8" fill="#8466cf"/>';
      o += '<circle cx="40.5" cy="45" r="8.5" fill="#fff"/><circle cx="59.5" cy="45" r="8.5" fill="#fff"/><circle cx="42" cy="46.5" r="3.8" fill="#16181f"/><circle cx="58" cy="46.5" r="3.8" fill="#16181f"/><circle cx="43.2" cy="45" r="1.2" fill="#fff"/><circle cx="59.2" cy="45" r="1.2" fill="#fff"/>';
      o += '<path d="M44 58 Q50 63 56 58" stroke="#16181f" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="33" cy="55" r="3" fill="#ff8fb0" opacity=".6"/><circle cx="67" cy="55" r="3" fill="#ff8fb0" opacity=".6"/>';
    } else {
      o += '118" role="img" aria-label="Evil eye charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#fff" stroke="#d3d6e0"/><circle cx="50" cy="16" r="8" fill="#1740d6"/><circle cx="50" cy="16" r="4.8" fill="#fff"/><circle cx="50" cy="16" r="2.8" fill="#59c8f2"/><circle cx="50" cy="16" r="1.3" fill="#111"/><circle cx="50" cy="28" r="3.6" fill="#fff" stroke="#d3d6e0"/>';
      o += '<circle cx="50" cy="74" r="42" fill="#1436cc"/><circle cx="50" cy="74" r="40.5" fill="none" stroke="#0b1f85" stroke-width="3"/>';
      o += '<path d="M17 60 A36 36 0 0 1 56 38" stroke="#5b80ff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>';
      o += '<circle cx="50" cy="76" r="25" fill="#fff"/><circle cx="50" cy="77" r="15" fill="#4fc3f0"/><circle cx="50" cy="77" r="7.5" fill="#10131c"/><circle cx="46" cy="73" r="2.3" fill="#fff" opacity=".85"/>';
    }
    return o + '</svg>';
  }

  function setMarkup(el, markup) {
    var doc = el.ownerDocument;
    var parsed = new doc.defaultView.DOMParser().parseFromString(markup, 'image/svg+xml');
    var node = doc.importNode(parsed.documentElement, true);
    var old = el.querySelector('svg');
    if (old) el.replaceChild(node, old); else el.insertBefore(node, el.firstChild);
    return node;
  }

  /* A charm hanging from the top edge on a string. It swings like a pendulum and reacts to the pointer.
     opts: mount, fixed, charm (id), size (px), length (px), left (css), closable, onHide */
  function createCharm(opts) {
    var doc = (opts.mount.ownerDocument || document), win = doc.defaultView;
    var size = opts.size || 64, length = opts.length === undefined ? 90 : opts.length;
    var top = doc.createElement('div');
    top.className = 'db-top ' + (opts.fixed ? 'db-fixed' : 'db-abs');
    var arm = doc.createElement('div');
    arm.className = 'db-charm';
    arm.style.width = size + 'px';
    var frac = typeof opts.x === 'number' ? opts.x : (opts.left ? parseFloat(opts.left) / 100 : 0.82);
    arm.style.left = (frac * 100).toFixed(2) + '%';
    arm.style.marginLeft = (-size / 2) + 'px';
    var string = doc.createElement('div');
    string.className = 'db-string';
    string.style.height = length + 'px';
    var body = doc.createElement('div');
    body.className = 'db-charm-body';
    arm.appendChild(string); arm.appendChild(body);
    if (opts.closable) {
      var close = doc.createElement('button');
      close.className = 'db-close'; close.type = 'button';
      close.setAttribute('aria-label', 'Hide charm on this page');
      close.textContent = '×';
      close.addEventListener('click', function (e) { e.stopPropagation(); if (opts.onHide) opts.onHide(); });
      body.appendChild(close);
    }
    top.appendChild(arm);
    opts.mount.appendChild(top);

    var calm = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var theta = calm ? 0 : 0.55, omega = 0, running = false, dead = false, last = null, lastX = null;
    var K = 26, DAMP = 0.85;
    function draw() { arm.style.transform = 'rotate(' + (theta * 57.2958).toFixed(2) + 'deg)'; }
    function step(now) {
      if (dead) return;
      if (last === null) last = now;
      var dt = Math.min(0.033, (now - last) / 1000); last = now;
      omega += (-K * Math.sin(theta) - DAMP * omega) * dt;
      theta += omega * dt;
      if (theta > 1.2) { theta = 1.2; omega *= -0.4; } else if (theta < -1.2) { theta = -1.2; omega *= -0.4; }
      draw();
      if (Math.abs(theta) < 0.003 && Math.abs(omega) < 0.01) { theta = 0; omega = 0; draw(); running = false; last = null; return; }
      win.requestAnimationFrame(step);
    }
    function start() { if (!running && !dead) { running = true; last = null; win.requestAnimationFrame(step); } }
    function kick(v) { if (calm) return; omega += v; start(); }
    function setCharm(id) {
      if (!CHARMS[id]) id = 'evileye';
      setMarkup(body, charmSvg(id));
      string.style.background = CHARMS[id].string;
    }
    setCharm(opts.charm);
    draw(); start();
    /* Drag with the pointer: left/right moves where it hangs, up/down changes the string length. */
    var drag = null, dragged = false;
    function limits() {
      var W = top.clientWidth || win.innerWidth;
      var H = opts.fixed ? win.innerHeight : (top.parentNode.clientHeight || 300);
      return { W: W, maxLen: Math.max(0, H - body.offsetHeight - 8) };
    }
    function setPosition(x, len) {
      var lim = limits();
      if (typeof x === 'number') { frac = Math.max(0.03, Math.min(0.97, x)); arm.style.left = (frac * 100).toFixed(2) + '%'; }
      if (typeof len === 'number') { length = Math.max(0, Math.min(lim.maxLen, len)); string.style.height = Math.round(length) + 'px'; }
    }
    body.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest('.db-close')) return;
      drag = { x: e.clientX, y: e.clientY, frac: frac, len: length, lastX: e.clientX, lastT: e.timeStamp, vx: 0, moved: false };
      try { body.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    });
    body.addEventListener('pointermove', function (e) {
      if (drag) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        drag.moved = true;
        body.classList.add('is-drag');
        var lim = limits();
        setPosition(drag.frac + dx / lim.W, drag.len + dy);
        var dt = Math.max(1, e.timeStamp - drag.lastT);
        drag.vx = (e.clientX - drag.lastX) / dt;
        drag.lastX = e.clientX; drag.lastT = e.timeStamp;
        if (!calm) { theta = Math.max(-0.6, Math.min(0.6, -drag.vx * 0.5)); omega = 0; draw(); }
        e.preventDefault();
        return;
      }
      if (lastX !== null) { var mx = e.clientX - lastX; if (Math.abs(mx) > 1) kick(Math.max(-0.5, Math.min(0.5, -mx * 0.04))); }
      lastX = e.clientX;
    });
    function endDrag(e) {
      if (!drag) return;
      var d = drag; drag = null;
      body.classList.remove('is-drag');
      try { body.releasePointerCapture(e.pointerId); } catch (err) { /* not captured */ }
      if (!d.moved) return;
      dragged = true;
      kick(Math.max(-3, Math.min(3, -d.vx * 2)) || 0.4);
      if (opts.onMove) opts.onMove({ x: frac, length: Math.round(length) });
    }
    body.addEventListener('pointerup', endDrag);
    body.addEventListener('pointercancel', endDrag);
    body.addEventListener('pointerleave', function () { lastX = null; });
    body.addEventListener('click', function () {
      if (dragged) { dragged = false; return; }
      kick((Math.random() < 0.5 ? -1 : 1) * 3.2);
    });
    var breeze = win.setInterval(function () { if (!running && !doc.hidden) kick((Math.random() < 0.5 ? -1 : 1) * 0.6); }, 9000);
    return {
      el: top, setCharm: setCharm, kick: kick, setPosition: setPosition,
      destroy: function () { dead = true; win.clearInterval(breeze); top.remove(); }
    };
  }


  /* ---- Reminder effects: short one-off animations (water drop, rocket, balloon, peek, confetti) ---- */
  var FX = { drop: 'Water drop', rocket: 'Rocket', balloon: 'Balloon', peek: 'Peek', confetti: 'Confetti' };
  var FX_SVG = {
    rocket: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 112"><g class="db-flame"><path d="M21 76 Q30 112 39 76 Z" fill="#f2b632"/><path d="M26 76 Q30 98 34 76 Z" fill="#fff3c4"/></g><path d="M16 50 L3 78 L17 70 Z" fill="#e5484d"/><path d="M44 50 L57 78 L43 70 Z" fill="#e5484d"/><path d="M30 4 C45 20 47 46 44 72 H16 C13 46 15 20 30 4 Z" fill="#f4f6fb"/><path d="M30 4 C37 11 40 18 42 26 H18 C20 18 23 11 30 4 Z" fill="#e5484d"/><circle cx="30" cy="42" r="8" fill="#4fc3f0" stroke="#2d3550" stroke-width="3"/><rect x="21" y="71" width="18" height="6" rx="2" fill="#9aa3b5"/></svg>',
    drop: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 58"><path d="M20 2 C30 21 38 29 38 39 A18 18 0 0 1 2 39 C2 29 10 21 20 2 Z" fill="#4fc3f0"/><path d="M11 38 a9 9 0 0 0 7 9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>',
    balloon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 124"><path d="M30 70 Q24 88 31 100 Q37 110 30 122" stroke="#c9ccd6" stroke-width="1.6" fill="none"/><ellipse cx="30" cy="34" rx="26" ry="32" fill="#e5484d"/><path d="M25 64 L35 64 L30 71 Z" fill="#c2363a"/><ellipse cx="20" cy="22" rx="6" ry="9" fill="#fff" opacity=".35" transform="rotate(-20 20 22)"/></svg>'
  };

  /* opts: mount, fixed. play(kind, {text, x (0..1), character}) returns a promise that resolves when it ends. */
  function createFx(opts) {
    var doc = (opts.mount.ownerDocument || document), win = doc.defaultView;
    var layer = doc.createElement('div');
    layer.className = 'db-fx ' + (opts.fixed ? 'db-fixed' : 'db-abs');
    opts.mount.appendChild(layer);
    var calm = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function dims() { return { W: layer.clientWidth || win.innerWidth, H: layer.clientHeight || win.innerHeight }; }
    function unit() { var d = dims(); return Math.max(26, Math.min(64, d.W * 0.07)); }
    function add(markup, w, cls) {
      var el = doc.createElement('div');
      el.className = 'db-fx-item' + (cls ? ' ' + cls : '');
      el.style.width = w + 'px';
      if (markup) setMarkup(el, markup);
      layer.appendChild(el);
      return el;
    }
    function done(anim) { return new Promise(function (res) { anim.onfinish = res; anim.oncancel = res; }); }
    function pause(ms) { return new Promise(function (res) { win.setTimeout(res, ms); }); }
    function say(text, cx, bottom, ms) {
      if (!text) return Promise.resolve();
      var d = dims();
      var b = doc.createElement('div');
      b.className = 'db-bubble db-fx-say';
      var p = doc.createElement('p'); p.className = 'db-bubble-text'; p.textContent = text;
      b.appendChild(p); layer.appendChild(b);
      var bw = b.offsetWidth;
      b.style.left = Math.round(Math.max(6, Math.min(d.W - bw - 6, cx - bw / 2))) + 'px';
      b.style.bottom = Math.round(Math.max(6, Math.min(d.H - b.offsetHeight - 6, bottom))) + 'px';
      return pause(ms || 2600).then(function () { b.remove(); });
    }
    function burst(cx, cy, n, colors, spread, life) {
      var all = [];
      for (var i = 0; i < n; i++) {
        var s = 4 + Math.random() * 6;
        var el = doc.createElement('div');
        el.className = 'db-fx-item db-fx-bit';
        el.style.width = s + 'px'; el.style.height = (colors.length > 1 ? s * (0.5 + Math.random()) : s) + 'px';
        el.style.background = colors[i % colors.length];
        if (colors.length === 1 || Math.random() < 0.4) el.style.borderRadius = '50%';
        el.style.left = cx + 'px'; el.style.top = cy + 'px';
        layer.appendChild(el);
        var a = Math.random() * Math.PI * 2, v = spread * (0.35 + Math.random() * 0.65);
        var dx = Math.cos(a) * v, up = -Math.abs(Math.sin(a)) * v - spread * 0.3, rot = (Math.random() * 720 - 360);
        var an = el.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + dx * 0.6 + 'px,' + up + 'px) rotate(' + rot * 0.5 + 'deg)', opacity: 1, offset: 0.35 },
          { transform: 'translate(' + dx + 'px,' + (up + spread * 1.9) + 'px) rotate(' + rot + 'deg)', opacity: 0 }
        ], { duration: life * (0.75 + Math.random() * 0.5), easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
        all.push(done(an).then((function (e) { return function () { e.remove(); }; })(el)));
      }
      return Promise.all(all);
    }
    var CONFETTI = ['#f2b632', '#e5484d', '#4f8df7', '#2bb3a3', '#8a63f0', '#ff8fb0'];

    var effects = {
      drop: function (o) {
        var d = dims(), u = unit(), x = d.W * o.x, w = u * 0.55, h = w * 58 / 40;
        var el = add(FX_SVG.drop, w);
        el.style.left = (x - w / 2) + 'px'; el.style.top = (-h) + 'px';
        return done(el.animate([{ transform: 'translateY(0) scaleY(1.15)' }, { transform: 'translateY(' + (d.H + h * 0.4) + 'px) scaleY(1.3)' }], { duration: calm ? 1 : 750, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' })).then(function () {
          el.remove();
          var ring = add('', u * 2.4, 'db-fx-ring');
          ring.style.left = (x - u * 1.2) + 'px'; ring.style.top = (d.H - u * 0.25) + 'px'; ring.style.height = u * 0.5 + 'px';
          done(ring.animate([{ transform: 'scale(.2)', opacity: .9 }, { transform: 'scale(1)', opacity: 0 }], { duration: 650, easing: 'ease-out' })).then(function () { ring.remove(); });
          burst(x, d.H - 4, calm ? 0 : 12, ['#4fc3f0'], u * 1.3, 800);
          return say(o.text, x, u * 1.2);
        });
      },
      rocket: function (o) {
        var d = dims(), u = unit(), x = d.W * o.x, w = u * 0.9, h = w * 112 / 60;
        var el = add(FX_SVG.rocket, w);
        el.style.left = (x - w / 2) + 'px'; el.style.top = d.H + 'px';
        var puffs = calm ? null : win.setInterval(function () {
          var r = el.getBoundingClientRect(), l = layer.getBoundingClientRect();
          var pf = add('', u * 0.5, 'db-fx-puff');
          pf.style.height = u * 0.5 + 'px';
          pf.style.left = (r.left - l.left + r.width / 2 - u * 0.25 + (Math.random() - 0.5) * u * 0.3) + 'px';
          pf.style.top = (r.bottom - l.top - u * 0.3) + 'px';
          done(pf.animate([{ transform: 'scale(.5)', opacity: .8 }, { transform: 'scale(2.4) translateY(' + u * 0.4 + 'px)', opacity: 0 }], { duration: 900, easing: 'ease-out' })).then(function () { pf.remove(); });
        }, 55);
        var said = pause(calm ? 0 : 500).then(function () { return say(o.text, x + u * 2.2, d.H * 0.42); });
        var fly = done(el.animate([
          { transform: 'translate(0,0)' }, { transform: 'translate(-2px,' + (-h * 0.3) + 'px)', offset: 0.12 }, { transform: 'translate(2px,' + (-h * 0.7) + 'px)', offset: 0.22 },
          { transform: 'translate(0,' + (-(d.H + h * 1.4)) + 'px)' }
        ], { duration: calm ? 1 : 1500, easing: 'cubic-bezier(.6,0,.9,.5)', fill: 'forwards' })).then(function () { if (puffs) win.clearInterval(puffs); el.remove(); });
        return Promise.all([fly, said]);
      },
      balloon: function (o) {
        var d = dims(), u = unit(), x = d.W * o.x, w = u * 0.95, h = w * 124 / 60;
        var el = add(FX_SVG.balloon, w, 'db-fx-click');
        el.style.left = (x - w / 2) + 'px'; el.style.top = d.H + 'px';
        var rise = Math.min(d.H * 0.62, d.H - h * 0.2) + h;
        var popped = false, finish;
        var whenDone = new Promise(function (res) { finish = res; });
        function pop() {
          if (popped) return; popped = true;
          var r = el.getBoundingClientRect(), l = layer.getBoundingClientRect();
          el.remove();
          burst(r.left - l.left + r.width / 2, r.top - l.top + r.width * 0.55, calm ? 0 : 26, CONFETTI, u * 1.6, 1100).then(finish);
          if (calm) finish();
        }
        el.addEventListener('click', pop);
        done(el.animate([{ transform: 'translate(0,0) rotate(-4deg)' }, { transform: 'translate(' + u * 0.3 + 'px,' + (-rise * 0.5) + 'px) rotate(4deg)' }, { transform: 'translate(0,' + (-rise) + 'px) rotate(-3deg)' }], { duration: calm ? 1 : 2200, easing: 'ease-out', fill: 'forwards' })).then(function () {
          if (popped) return;
          el.animate([{ transform: 'translate(0,' + (-rise) + 'px) rotate(-3deg)' }, { transform: 'translate(0,' + (-rise - u * 0.25) + 'px) rotate(3deg)' }], { duration: 1300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
          say(o.text ? o.text + ' (click the balloon)' : '', x, d.H - rise + h + 6 > d.H * 0.5 ? u * 0.4 : d.H - rise - 4, 4200).then(function () {
            if (popped) return;
            popped = true;
            done(el.animate([{ transform: 'translate(0,' + (-rise) + 'px)' }, { transform: 'translate(0,' + (-(d.H + h * 2)) + 'px)' }], { duration: 1400, easing: 'ease-in', fill: 'forwards' })).then(function () { el.remove(); finish(); });
          });
        });
        return whenDone;
      },
      peek: function (o) {
        var d = dims(), u = unit(), w = u * 1.5, h = w * 200 / 120, x = d.W * o.x;
        var el = add(svg(o.character || 'mika'), w, 'db-sprite is-wave');
        el.style.left = (x - w / 2) + 'px'; el.style.top = d.H + 'px';
        var up = h * 0.58;
        return done(el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-up) + 'px)' }], { duration: calm ? 1 : 420, easing: 'cubic-bezier(.2,1.3,.4,1)', fill: 'forwards' }))
          .then(function () { return say(o.text, x, up + 8, 2400); })
          .then(function () { return done(el.animate([{ transform: 'translateY(' + (-up) + 'px)' }, { transform: 'translateY(0)' }], { duration: calm ? 1 : 300, easing: 'ease-in', fill: 'forwards' })); })
          .then(function () { el.remove(); });
      },
      confetti: function (o) {
        var d = dims(), u = unit();
        var said = say(o.text, d.W * o.x, d.H * 0.45, 1800);
        return Promise.all([burst(d.W * o.x, d.H * 0.6, calm ? 0 : 46, CONFETTI, u * 3.2, 1500), said]);
      }
    };
    return {
      el: layer,
      play: function (kind, o) {
        o = o || {};
        if (typeof o.x !== 'number') o.x = 0.5;
        return effects[kind] ? effects[kind](o) : Promise.resolve();
      },
      destroy: function () { layer.remove(); }
    };
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
    '.db-top{left:0;right:0;top:0;height:0;pointer-events:none}',
    '.db-top.db-fixed{position:fixed;z-index:2147483645}.db-top.db-abs{position:absolute}',
    '.db-charm{position:absolute;top:0;transform-origin:50% 0;will-change:transform;pointer-events:none}',
    '.db-string{width:2px;margin:0 auto;border-radius:1px}',
    '.db-charm-body{position:relative;margin-top:-3px;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;filter:drop-shadow(0 6px 7px rgba(0,0,0,.28));-webkit-tap-highlight-color:transparent}',
    '.db-charm-body.is-drag{cursor:grabbing}',
    '.db-charm-body svg{pointer-events:none;display:block;width:100%;height:auto;overflow:visible}',
    '.db-charm-body:hover .db-close{opacity:.9}.db-charm-body .db-close{top:-8px;right:-12px}',
    '.db-fx{left:0;top:0;right:0;bottom:0;pointer-events:none;overflow:hidden}',
    '.db-fx.db-fixed{position:fixed;z-index:2147483644}.db-fx.db-abs{position:absolute}',
    '.db-fx-item{position:absolute;will-change:transform}.db-fx-item svg{display:block;width:100%;height:auto;overflow:visible}',
    '.db-fx-click{pointer-events:auto;cursor:pointer}',
    '.db-fx-bit{border-radius:2px}',
    '.db-fx-puff{border-radius:50%;background:#e9edf5}',
    '.db-fx-ring{border-radius:50%;border:2px solid #4fc3f0}',
    '.db-fx-say{pointer-events:none}',
    '.db-flame{transform-origin:30px 76px;animation:db-flame .12s ease-in-out infinite alternate}',
    '@keyframes db-flame{from{transform:scaleY(.75)}to{transform:scaleY(1.15)}}',
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

  root.DeskBuddy = { CHARACTERS: CHARACTERS, CHARMS: CHARMS, svg: svg, charmSvg: charmSvg, render: render, renderCharm: function (el, id) { return setMarkup(el, charmSvg(id)); }, CSS: CSS, createStage: createStage, createCharm: createCharm, FX: FX, createFx: createFx };
})(typeof globalThis !== 'undefined' ? globalThis : this);
