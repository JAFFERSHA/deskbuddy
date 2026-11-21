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
    capy:  { name: 'Capy',  pro: false, kind: 'capy',  skin: '#b98a5e', hair: '#8a5c3a', hairStyle: 'none', top: '#b98a5e', pants: '#a9754c', shoe: '#7a4f30', acc: 'none', accColor: '#ffa62b', belly: '#e3c39d', hand: '#b98a5e' },
    axo:   { name: 'Axo',   pro: false, kind: 'axo',   skin: '#ffb3c7', hair: '#ff7aa2', hairStyle: 'none', top: '#ffb3c7', pants: '#ff9fb8', shoe: '#ff7aa2', acc: 'none', accColor: '#ff5d8f', belly: '#ffd9e4', hand: '#ffb3c7' },
    boo:   { name: 'Boo',   pro: false, kind: 'ghost', skin: '#f1f3ff', hair: '#b8c0e8', hairStyle: 'none', top: '#dfe4fb', pants: '#dfe4fb', shoe: '#dfe4fb', acc: 'none', accColor: '#ff8fb0', hand: '#dfe4fb' },
    boba:  { name: 'Boba',  pro: false, kind: 'boba',  skin: '#f1d9bf', hair: '#3b2a20', hairStyle: 'none', top: '#ff8fb0', pants: '#3a3f5a', shoe: '#ffffff', acc: 'none', accColor: '#ff6b9a', hand: '#f1d9bf' },
    ducky: { name: 'Ducky', pro: false, kind: 'duck',  skin: '#ffd23f', hair: '#ffb100', hairStyle: 'none', top: '#4f8df7', pants: '#ff9a1f', shoe: '#ff9a1f', acc: 'none', accColor: '#ff7a00', hand: '#ffd23f' },
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
    if (c.kind === 'capy') {
      s += '<ellipse cx="36" cy="27" rx="7" ry="6" fill="' + c.skin + '"/><ellipse cx="84" cy="27" rx="7" ry="6" fill="' + c.skin + '"/>';
      s += '<rect x="30" y="22" width="60" height="52" rx="24" fill="' + c.skin + '"/>';
      s += '<rect x="38" y="46" width="44" height="28" rx="14" fill="#a2724a"/><ellipse cx="60" cy="53" rx="10" ry="5.5" fill="#5b3a24"/><circle cx="56" cy="53" r="1.4" fill="#2a1a10"/><circle cx="64" cy="53" r="1.4" fill="#2a1a10"/>';
      s += '<path d="M43 40 Q49 35 55 40 M65 40 Q71 35 77 40" stroke="#2a1a10" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
      s += '<path class="db-smile" d="M54 65 Q60 69 66 65" stroke="#2a1a10" stroke-width="2" fill="none" stroke-linecap="round"/>';
      s += '<circle cx="38" cy="50" r="4" fill="#ff8f8f" opacity=".4"/><circle cx="82" cy="50" r="4" fill="#ff8f8f" opacity=".4"/>';
      s += '<circle cx="60" cy="19" r="9" fill="' + c.accColor + '"/><path d="M60 11 Q65 5 71 8" stroke="#3c9b3c" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="56" cy="16" rx="3.4" ry="2.2" fill="#fff" opacity=".4"/>';
      return s;
    }
    if (c.kind === 'axo') {
      [[34, 40, 12, 26], [32, 46, 8, 40], [34, 52, 12, 56]].forEach(function (g) {
        s += '<path d="M' + g[0] + ' ' + g[1] + ' L' + g[2] + ' ' + g[3] + '" stroke="' + c.accColor + '" stroke-width="5" stroke-linecap="round"/><circle cx="' + g[2] + '" cy="' + g[3] + '" r="5" fill="' + c.accColor + '"/>';
        s += '<path d="M' + (120 - g[0]) + ' ' + g[1] + ' L' + (120 - g[2]) + ' ' + g[3] + '" stroke="' + c.accColor + '" stroke-width="5" stroke-linecap="round"/><circle cx="' + (120 - g[2]) + '" cy="' + g[3] + '" r="5" fill="' + c.accColor + '"/>';
      });
      s += '<ellipse cx="60" cy="46" rx="30" ry="27" fill="' + c.skin + '"/>';
      s += '<ellipse class="db-eye" cx="49" cy="44" rx="3" ry="3.8" fill="#2a1f2d"/><ellipse class="db-eye" cx="71" cy="44" rx="3" ry="3.8" fill="#2a1f2d"/>';
      s += '<circle cx="42" cy="55" r="4.2" fill="' + c.accColor + '" opacity=".4"/><circle cx="78" cy="55" r="4.2" fill="' + c.accColor + '" opacity=".4"/>';
      s += '<path class="db-smile" d="M50 55 Q60 66 70 55" stroke="#2a1f2d" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
      s += '<g class="db-mouth-open"><path d="M52 56 Q60 72 68 56 Z" fill="#5b1f2a"/></g>';
      return s;
    }
    if (c.kind === 'ghost') {
      s += '<path d="M30 62 Q30 14 60 14 Q90 14 90 62 L90 76 L30 76 Z" fill="' + c.skin + '" stroke="' + c.hair + '" stroke-width="2"/>';
      s += '<ellipse class="db-eye" cx="49" cy="46" rx="4" ry="5.6" fill="#1c2030"/><ellipse class="db-eye" cx="71" cy="46" rx="4" ry="5.6" fill="#1c2030"/>';
      s += '<circle cx="41" cy="57" r="4.4" fill="' + c.accColor + '" opacity=".5"/><circle cx="79" cy="57" r="4.4" fill="' + c.accColor + '" opacity=".5"/>';
      s += '<path class="db-smile" d="M54 58 Q60 64 66 58" stroke="#1c2030" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
      s += '<g class="db-mouth-open"><ellipse cx="60" cy="62" rx="5" ry="6.5" fill="#1c2030"/></g>';
      return s;
    }
    if (c.kind === 'boba') {
      s += '<rect x="58" y="-4" width="8" height="34" rx="4" fill="' + c.accColor + '" transform="rotate(10 62 13)"/>';
      s += '<path d="M33 28 H87 L81 74 Q80 79 75 79 H45 Q40 79 39 74 Z" fill="' + c.skin + '"/>';
      s += '<path d="M33 28 H87 L85 44 H35 Z" fill="#e8c9a6"/>';
      s += '<rect x="29" y="19" width="62" height="11" rx="5.5" fill="#fff" stroke="#d3d6e0"/>';
      [[45, 74], [54, 75], [63, 74], [72, 74], [50, 69.5], [59, 70], [68, 69.5]].forEach(function (b) { s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="4.2" fill="' + c.hair + '"/>'; });
      s += '<path d="M40 34 L44 68" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>';
      s += '<ellipse class="db-eye" cx="51" cy="47" rx="2.8" ry="3.6" fill="' + c.hair + '"/><ellipse class="db-eye" cx="69" cy="47" rx="2.8" ry="3.6" fill="' + c.hair + '"/>';
      s += '<circle cx="44" cy="55" r="3.6" fill="#ff8f8f" opacity=".5"/><circle cx="76" cy="55" r="3.6" fill="#ff8f8f" opacity=".5"/>';
      s += '<path class="db-smile" d="M54 54 Q60 60 66 54" stroke="' + c.hair + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
      s += '<g class="db-mouth-open"><path d="M54 53 Q60 63 66 53 Z" fill="#5b1f2a"/></g>';
      return s;
    }
    if (c.kind === 'duck') {
      s += '<path d="M56 18 Q60 6 68 12 Q63 14 63 22 Z" fill="' + c.skin + '"/>';
      s += '<path d="M25 60 Q22 18 60 17 Q98 18 95 60 Q95 74 80 78 L40 78 Q25 74 25 60 Z" fill="' + c.top + '"/>';
      s += '<circle cx="60" cy="47" r="25" fill="' + c.skin + '"/>';
      s += '<ellipse cx="60" cy="57" rx="13" ry="7" fill="' + c.accColor + '"/><path class="db-smile" d="M52 58 Q60 63 68 58" stroke="#b34a00" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
      s += '<g class="db-mouth-open"><ellipse cx="60" cy="61" rx="8" ry="4.5" fill="#5b1f2a"/></g>';
      s += '<circle cx="56" cy="54" r="1.3" fill="#b34a00"/><circle cx="64" cy="54" r="1.3" fill="#b34a00"/>';
      s += '<ellipse class="db-eye" cx="49" cy="42" rx="3" ry="4" fill="#1f2230"/><ellipse class="db-eye" cx="71" cy="42" rx="3" ry="4" fill="#1f2230"/>';
      s += '<circle cx="42" cy="52" r="4" fill="#ff9f7a" opacity=".45"/><circle cx="78" cy="52" r="4" fill="#ff9f7a" opacity=".45"/>';
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
    s += '<path class="db-smile" d="M53 60 Q60 67 67 60" stroke="#22252e" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    s += '<g class="db-mouth-open"><path d="M52 59 Q60 74 68 59 Z" fill="#5b1f2a"/><path d="M55 66 Q60 70 65 66 Q60 63 55 66 Z" fill="#ff7a8a"/></g>';
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
    var hand = c.hand || (c.kind === 'human' || c.kind === 'ninja' ? c.skin : (c.kind === 'cat' ? c.shoe : c.pants));
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200" role="img" aria-label="' + c.name + '">';
    s += '<ellipse class="db-shadow" cx="60" cy="184" rx="30" ry="5" fill="#000" opacity=".22"/>';
    s += '<g class="db-all">';
    if (c.kind === 'cat') s += '<path class="db-tail" d="M80 126 Q108 124 104 96" stroke="' + c.hair + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
    if (c.kind === 'astro') s += '<rect x="30" y="80" width="60" height="46" rx="12" fill="#c7cfdd"/>';
    if (c.kind === 'ghost') {
      s += '<g class="db-leg db-leg-l"></g><g class="db-leg db-leg-r"></g>';
    } else {
      s += '<g class="db-leg db-leg-l"><rect x="45" y="124" width="13" height="50" rx="6.5" fill="' + c.pants + '"/><rect x="40" y="170" width="22" height="13" rx="6.5" fill="' + c.shoe + '"/></g>';
      s += '<g class="db-leg db-leg-r"><rect x="62" y="124" width="13" height="50" rx="6.5" fill="' + c.pants + '"/><rect x="58" y="170" width="22" height="13" rx="6.5" fill="' + c.shoe + '"/></g>';
    }
    s += '<g class="db-arm db-arm-l"><rect x="27" y="82" width="12" height="42" rx="6" fill="' + c.top + '"/><circle cx="33" cy="126" r="6.5" fill="' + hand + '"/></g>';
    if (c.kind === 'ghost') s += '<path d="M37 90 Q37 76 52 76 H68 Q83 76 83 90 V172 Q76 182 68.5 172 Q61 182 53.5 172 Q46 182 40 172 Q37 176 37 172 Z" fill="' + c.top + '" stroke="' + c.hair + '" stroke-width="2"/>';
    else s += '<rect x="37" y="76" width="46" height="60" rx="15" fill="' + c.top + '"/>';
    if (c.belly) s += '<ellipse cx="60" cy="110" rx="14" ry="18" fill="' + c.belly + '"/>';
    if (c.kind === 'duck') s += '<path d="M48 112 h24 v10 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 Z" fill="#000" opacity=".12"/><path d="M54 80 v16 M66 80 v16" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>';
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
    webby:   { name: 'Webby', string: '#c9ccd6', ratio: 86 / 100 },
    luckycat:   { name: 'Lucky cat',  string: '#b08d3c', ratio: 130 / 100 },
    duck:       { name: 'Rubber duck', string: '#b08d3c', ratio: 110 / 100 },
    boba:       { name: 'Boba tea',   string: '#b08d3c', ratio: 135 / 100 },
    pixelheart: { name: 'Pixel heart', string: '#b08d3c', ratio: 106 / 100 },
    moon:       { name: 'Moon & stars', string: '#b08d3c', ratio: 130 / 100 },
    cactus:     { name: 'Cactus',     string: '#b08d3c', ratio: 130 / 100 },
    clover:     { name: 'Clover',     string: '#b08d3c', ratio: 118 / 100 },
    disco:      { name: 'Disco ball', string: '#c9ccd6', ratio: 116 / 100 }
  };

  function star(cx, cy, r, fill) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      pts.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"/>';
  }
  var HEART = ['0110000110', '1111001111', '1111111111', '1111111111', '0111111110', '0011111100', '0001111000', '0000110000'];

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
    } else if (id === 'luckycat') {
      o += '130" role="img" aria-label="Lucky cat charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/>';
      o += '<path d="M24 34 L26 12 L42 26Z" fill="#fff" stroke="#e3e6ee"/><path d="M76 34 L74 12 L58 26Z" fill="#fff" stroke="#e3e6ee"/><path d="M28 28 L28 18 L36 25Z" fill="#ffb3c7"/><path d="M72 28 L72 18 L64 25Z" fill="#ffb3c7"/>';
      o += '<g class="db-paw"><rect x="78" y="34" width="15" height="48" rx="7.5" fill="#fff" stroke="#e3e6ee" stroke-width="1.5"/><circle cx="85.5" cy="43" r="3.2" fill="#ffb3c7"/></g>';
      o += '<ellipse cx="50" cy="98" rx="30" ry="26" fill="#fff" stroke="#e3e6ee" stroke-width="1.5"/><ellipse cx="50" cy="48" rx="33" ry="28" fill="#fff" stroke="#e3e6ee" stroke-width="1.5"/>';
      o += '<path d="M33 47 Q39 41 45 47 M55 47 Q61 41 67 47" stroke="#2d3550" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M47 54 h6 l-3 3z" fill="#ff7aa2"/><path d="M50 57 Q44 63 40 59 M50 57 Q56 63 60 59" stroke="#2d3550" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
      o += '<path d="M24 52 L12 50 M24 57 L12 60 M76 52 L88 50 M76 57 L88 60" stroke="#b9bfcf" stroke-width="1.2" stroke-linecap="round"/><circle cx="30" cy="57" r="5" fill="#ffb3c7" opacity=".6"/><circle cx="70" cy="57" r="5" fill="#ffb3c7" opacity=".6"/>';
      o += '<path d="M25 76 Q50 88 75 76 L73 84 Q50 96 27 84Z" fill="#d62f26"/><circle cx="50" cy="92" r="6" fill="#f2b632" stroke="#c9961a"/><path d="M47 92 h6" stroke="#c9961a"/>';
      o += '<ellipse cx="50" cy="111" rx="11" ry="13" fill="#f2b632" stroke="#c9961a" stroke-width="1.5"/><path d="M44 111 h12 M50 103 v16" stroke="#c9961a" stroke-width="2"/>';
    } else if (id === 'duck') {
      o += '110" role="img" aria-label="Rubber duck charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/><path d="M50 9 V24" stroke="#b08d3c" stroke-width="1.5"/>';
      o += '<path d="M80 74 Q99 62 96 82 Q92 90 80 90Z" fill="#ffd23f"/><ellipse cx="56" cy="86" rx="38" ry="24" fill="#ffd23f"/><path d="M40 82 Q54 70 66 86 Q52 98 40 82Z" fill="#ffb100"/>';
      o += '<circle cx="50" cy="46" r="24" fill="#ffd23f"/><path d="M28 50 Q8 48 10 58 Q18 64 28 58Z" fill="#ff7a00"/><path d="M26 56 Q16 58 12 57" stroke="#b34a00" stroke-width="1.2" fill="none"/>';
      o += '<circle cx="46" cy="42" r="3.4" fill="#1f2230"/><circle cx="47" cy="41" r="1" fill="#fff"/><circle cx="55" cy="54" r="4.2" fill="#ff9f7a" opacity=".5"/>';
      o += '<ellipse cx="66" cy="94" rx="10" ry="3" fill="#fff" opacity=".35"/>';
    } else if (id === 'boba') {
      o += '135" role="img" aria-label="Boba tea charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/><path d="M50 9 V40" stroke="#b08d3c" stroke-width="1.5"/>';
      o += '<rect x="54" y="14" width="8" height="36" rx="4" fill="#ff7aa2" transform="rotate(10 58 30)"/>';
      o += '<path d="M26 54 H74 L68 122 Q67 128 61 128 H39 Q33 128 32 122Z" fill="#f1d9bf"/><path d="M26 54 H74 L72 74 H28Z" fill="#e8c9a6"/>';
      o += '<rect x="22" y="42" width="56" height="13" rx="6.5" fill="#fff" stroke="#d3d6e0"/>';
      [[40, 118], [50, 121], [60, 118], [45, 110], [56, 110], [66, 111], [38, 108]].forEach(function (b) { o += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5.4" fill="#3b2a20"/>'; });
      o += '<path d="M32 60 L36 108" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>';
      o += '<circle cx="42" cy="86" r="3" fill="#3b2a20"/><circle cx="58" cy="86" r="3" fill="#3b2a20"/><circle cx="35" cy="93" r="4" fill="#ff8f8f" opacity=".5"/><circle cx="65" cy="93" r="4" fill="#ff8f8f" opacity=".5"/><path d="M45 92 Q50 98 55 92" stroke="#3b2a20" stroke-width="2" fill="none" stroke-linecap="round"/>';
    } else if (id === 'pixelheart') {
      o += '106" role="img" aria-label="Pixel heart charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/><path d="M50 9 V30" stroke="#b08d3c" stroke-width="1.5"/>';
      HEART.forEach(function (row, r) {
        row.split('').forEach(function (v, c) {
          if (v === '1') o += '<rect x="' + (10 + c * 8) + '" y="' + (30 + r * 9) + '" width="8.4" height="9.4" fill="' + (r >= 5 ? '#c9363d' : '#e5484d') + '" shape-rendering="crispEdges"/>';
        });
      });
      [[1, 1], [2, 1], [1, 2]].forEach(function (c) { o += '<rect x="' + (10 + c[0] * 8) + '" y="' + (30 + c[1] * 9) + '" width="8.4" height="9.4" fill="#ff9aa2" shape-rendering="crispEdges"/>'; });
    } else if (id === 'moon') {
      o += '130" role="img" aria-label="Moon and stars charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/><path d="M50 9 V28" stroke="#b08d3c" stroke-width="1.5"/>';
      o += '<path d="M62 28 A38 38 0 1 0 62 100 A36 36 0 1 1 62 28 Z" fill="#ffd166" stroke="#e0a93a" stroke-width="2"/>';
      o += '<path d="M28 62 Q33 68 38 62" stroke="#a8741a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M38 78 Q42 82 46 78" stroke="#a8741a" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="26" cy="74" r="4" fill="#ff9f7a" opacity=".5"/>';
      o += star(82, 50, 10, '#fff3b0') + star(76, 88, 7, '#fff3b0') + star(90, 74, 5, '#ffe58a');
      o += '<path d="M82 38 V42 M76 80 V82" stroke="#b08d3c" stroke-width="1" opacity=".6"/>';
    } else if (id === 'cactus') {
      o += '130" role="img" aria-label="Cactus charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/><path d="M50 9 V30" stroke="#b08d3c" stroke-width="1.5"/>';
      o += '<rect x="25" y="62" width="12" height="26" rx="6" fill="#3fa34d"/><rect x="25" y="76" width="24" height="12" rx="6" fill="#3fa34d"/><rect x="63" y="52" width="12" height="28" rx="6" fill="#3fa34d"/><rect x="51" y="68" width="24" height="12" rx="6" fill="#3fa34d"/>';
      o += '<rect x="38" y="32" width="24" height="76" rx="12" fill="#4cbb5a"/><path d="M45 40 V100 M55 40 V100" stroke="#3a9a48" stroke-width="1.4" opacity=".6"/>';
      o += '<circle cx="50" cy="28" r="4" fill="#ff7aa2"/><circle cx="45" cy="32" r="3.5" fill="#ff9fb8"/><circle cx="55" cy="32" r="3.5" fill="#ff9fb8"/>';
      o += '<circle cx="45" cy="60" r="2.2" fill="#1c2a1c"/><circle cx="55" cy="60" r="2.2" fill="#1c2a1c"/><path d="M47 66 Q50 70 53 66" stroke="#1c2a1c" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="42" cy="66" r="2.6" fill="#ff9fb8" opacity=".7"/><circle cx="58" cy="66" r="2.6" fill="#ff9fb8" opacity=".7"/>';
      o += '<path d="M28 104 H72 L66 126 Q65 130 61 130 H39 Q35 130 34 126Z" fill="#d9774a"/><rect x="26" y="100" width="48" height="9" rx="3" fill="#e8895a"/>';
    } else if (id === 'clover') {
      o += '118" role="img" aria-label="Clover charm">';
      o += '<circle cx="50" cy="5" r="4" fill="#f2b632"/><path d="M50 9 V30" stroke="#b08d3c" stroke-width="1.5"/>';
      o += '<path d="M50 62 Q56 88 46 112" stroke="#2f7d2b" stroke-width="4" fill="none" stroke-linecap="round"/>';
      [0, 90, 180, 270].forEach(function (a) {
        o += '<g transform="translate(50 62) rotate(' + a + ') scale(1.35)"><g transform="translate(0 -14)"><path d="M0 0 C-4 -10 -16 -12 -16 -2 C-16 6 -6 10 0 14 C6 10 16 6 16 -2 C16 -12 4 -10 0 0Z" fill="#2fa84a" stroke="#1f7d36" stroke-width="1.2"/><path d="M0 14 V2" stroke="#1f7d36" stroke-width="1" opacity=".6"/></g></g>';
      });
      o += '<ellipse cx="36" cy="46" rx="4" ry="2.4" fill="#fff" opacity=".4" transform="rotate(-30 36 46)"/>';
    } else if (id === 'disco') {
      o += '116" role="img" aria-label="Disco ball charm">';
      o += '<rect x="44" y="0" width="12" height="9" rx="2" fill="#9aa3b5"/><path d="M50 9 V26" stroke="#c9ccd6" stroke-width="1.5"/>';
      var tones = ['#e9eef7', '#c9d3e0', '#aab6c9', '#f4f6fb', '#9fb4d9', '#d9c9ef', '#bfe6f2'];
      for (var gy = 0; gy < 8; gy++) for (var gx = 0; gx < 8; gx++) {
        var dx = (gx + 0.5) * 10 + 10 - 50, dy = (gy + 0.5) * 10 + 26 - 66;
        if (Math.sqrt(dx * dx + dy * dy) < 38) o += '<rect x="' + (10 + gx * 10 + 0.6) + '" y="' + (26 + gy * 10 + 0.6) + '" width="8.8" height="8.8" rx="1.4" fill="' + tones[(gx * 3 + gy * 5) % tones.length] + '"/>';
      }
      o += '<circle cx="50" cy="66" r="40" fill="none" stroke="#7d8aa3" stroke-width="2"/>';
      o += '<g class="db-twinkle" style="animation-delay:.2s">' + star(30, 46, 7, '#fff') + '</g><g class="db-twinkle" style="animation-delay:.7s">' + star(70, 80, 6, '#fff') + '</g><g class="db-twinkle" style="animation-delay:1.1s">' + star(62, 38, 4.5, '#fff') + '</g>';
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
  var FX = { drop: 'Water drop', rocket: 'Slow-mo rocket', car: 'Car drive-by', balloon: 'Balloon', peek: 'Peek', swing: 'Spider swing', confetti: 'Confetti' };
  var FX_SVG = {
    rocket: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 112"><g class="db-flame"><path d="M21 76 Q30 112 39 76 Z" fill="#f2b632"/><path d="M26 76 Q30 98 34 76 Z" fill="#fff3c4"/></g><path d="M16 50 L3 78 L17 70 Z" fill="#e5484d"/><path d="M44 50 L57 78 L43 70 Z" fill="#e5484d"/><path d="M30 4 C45 20 47 46 44 72 H16 C13 46 15 20 30 4 Z" fill="#f4f6fb"/><path d="M30 4 C37 11 40 18 42 26 H18 C20 18 23 11 30 4 Z" fill="#e5484d"/><circle cx="30" cy="42" r="8" fill="#4fc3f0" stroke="#2d3550" stroke-width="3"/><rect x="21" y="71" width="18" height="6" rx="2" fill="#9aa3b5"/></svg>',
    drop: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 58"><path d="M20 2 C30 21 38 29 38 39 A18 18 0 0 1 2 39 C2 29 10 21 20 2 Z" fill="#4fc3f0"/><path d="M11 38 a9 9 0 0 0 7 9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>',
    balloon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 124"><path d="M30 70 Q24 88 31 100 Q37 110 30 122" stroke="#c9ccd6" stroke-width="1.6" fill="none"/><ellipse cx="30" cy="34" rx="26" ry="32" fill="#e5484d"/><path d="M25 64 L35 64 L30 71 Z" fill="#c2363a"/><ellipse cx="20" cy="22" rx="6" ry="9" fill="#fff" opacity=".35" transform="rotate(-20 20 22)"/></svg>',
    scooter: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><ellipse cx="60" cy="87" rx="52" ry="3" fill="#000" opacity=".2"/><g class="db-car-body"><rect x="20" y="62" width="82" height="9" rx="4.5" fill="#2bb3a3"/><path d="M98 66 L88 16" stroke="#2d3550" stroke-width="5" stroke-linecap="round"/><rect x="76" y="9" width="24" height="6" rx="3" fill="#2d3550"/><circle cx="77" cy="12" r="4" fill="#f2793a"/><circle cx="99" cy="12" r="4" fill="#f2793a"/><circle cx="88" cy="26" r="3.2" fill="#f2b632"/></g><path d="M14 71 Q26 58 38 71Z" fill="#1f8f82"/><g class="db-wheel"><circle cx="27" cy="77" r="10" fill="#22252e"/><circle cx="27" cy="77" r="4.5" fill="#c9d3e0"/><path d="M27 68V86M18 77H36" stroke="#8794a8" stroke-width="2"/></g><g class="db-wheel"><circle cx="100" cy="77" r="10" fill="#22252e"/><circle cx="100" cy="77" r="4.5" fill="#c9d3e0"/><path d="M100 68V86M91 77H109" stroke="#8794a8" stroke-width="2"/></g></svg>',
    skate: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50"><ellipse cx="60" cy="48" rx="50" ry="2.5" fill="#000" opacity=".2"/><g class="db-car-body"><path d="M6 20 Q6 14 14 14 H106 Q114 14 114 20 Q114 26 106 26 H14 Q6 26 6 20Z" fill="#f2793a"/><path d="M18 20 H102" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/><circle cx="60" cy="20" r="5" fill="#ffd166"/><rect x="24" y="26" width="14" height="5" rx="2" fill="#9aa3b5"/><rect x="82" y="26" width="14" height="5" rx="2" fill="#9aa3b5"/></g><g class="db-wheel"><circle cx="31" cy="39" r="8" fill="#22252e"/><circle cx="31" cy="39" r="3.2" fill="#ffd166"/><path d="M31 32V46M24 39H38" stroke="#8794a8" stroke-width="1.6"/></g><g class="db-wheel"><circle cx="89" cy="39" r="8" fill="#22252e"/><circle cx="89" cy="39" r="3.2" fill="#ffd166"/><path d="M89 32V46M82 39H96" stroke="#8794a8" stroke-width="1.6"/></g></svg>',
    plane: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70"><path d="M0 52 q10 8 20 0 t20 0" stroke="#4f8df7" stroke-width="2" fill="none" stroke-dasharray="3 5" stroke-linecap="round"/><path d="M40 36 L116 6 L78 64 L60 46 Z" fill="#f4f6fb" stroke="#c9d3e0" stroke-width="1.5" stroke-linejoin="round"/><path d="M60 46 L116 6 L52 40 Z" fill="#dfe6f3"/><path d="M60 46 L68 66 L78 64 Z" fill="#c9d3e0"/></svg>',
    balloonride: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 110"><path d="M40 4 C70 4 76 34 62 54 L18 54 C4 34 10 4 40 4Z" fill="#e5484d"/><path d="M40 4 C26 14 24 40 30 54 H50 C56 40 54 14 40 4Z" fill="#f2b632"/><path d="M40 4 C33 18 33 40 36 54 H44 C47 40 47 18 40 4Z" fill="#fff" opacity=".85"/><path d="M24 54 L32 80 M56 54 L48 80 M40 54 V80" stroke="#8a6a3c" stroke-width="1.6"/><rect x="28" y="80" width="24" height="16" rx="3" fill="#b07a3c"/><path d="M28 86 H52" stroke="#8a5c2a" stroke-width="1.4"/><path class="db-burner" d="M40 58 Q45 68 40 76 Q35 68 40 58Z" fill="#f2b632"/></svg>',
    ufo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 66"><path d="M46 40 L26 66 H94 L74 40Z" fill="#9ff5c0" opacity=".35"/><path d="M40 28 Q60 -6 80 28Z" fill="#bfeeff" stroke="#8fcbe0" stroke-width="1.5"/><circle cx="60" cy="21" r="7" fill="#8fe3a0"/><circle cx="57.5" cy="20" r="1.4" fill="#1c2a40"/><circle cx="62.5" cy="20" r="1.4" fill="#1c2a40"/><ellipse cx="60" cy="33" rx="50" ry="13" fill="#8a93a8"/><ellipse cx="60" cy="31" rx="50" ry="11" fill="#c9d3e0"/><circle class="db-light" cx="24" cy="34" r="3.2" fill="#ffd166"/><circle class="db-light" cx="42" cy="39" r="3.2" fill="#ff7aa2"/><circle class="db-light" cx="60" cy="41" r="3.2" fill="#ffd166"/><circle class="db-light" cx="78" cy="39" r="3.2" fill="#ff7aa2"/><circle class="db-light" cx="96" cy="34" r="3.2" fill="#ffd166"/></svg>',
    cloud: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><g fill="#d9e6fb"><circle cx="38" cy="36" r="18"/><circle cx="62" cy="28" r="22"/><circle cx="86" cy="38" r="16"/><rect x="30" y="36" width="64" height="18" rx="9"/></g><circle cx="52" cy="38" r="2.8" fill="#2d3550"/><circle cx="72" cy="38" r="2.8" fill="#2d3550"/><path d="M57 45 Q62 51 67 45" stroke="#2d3550" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="46" cy="45" r="3.4" fill="#ff9fb8" opacity=".6"/><circle cx="78" cy="45" r="3.4" fill="#ff9fb8" opacity=".6"/><g class="db-rain" fill="#4fc3f0"><path d="M44 58 q-3.5 6 0 9 q3.5 -3 0 -9z"/><path d="M62 60 q-3.5 6 0 9 q3.5 -3 0 -9z"/><path d="M80 58 q-3.5 6 0 9 q3.5 -3 0 -9z"/></g></svg>',
    car: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70"><ellipse cx="70" cy="67" rx="62" ry="3" fill="#000" opacity=".2"/><g class="db-car-body"><path d="M8 46 Q8 34 22 32 L40 30 Q48 12 66 12 L90 12 Q106 14 112 30 L124 34 Q134 38 134 48 L134 54 H8 Z" fill="#f2793a"/><path d="M48 30 Q53 19 66 19 H78 V30 Z" fill="#cfeeff"/><path d="M84 19 H92 Q102 21 106 30 H84 Z" fill="#cfeeff"/><rect x="8" y="42" width="126" height="4" fill="#fff" opacity=".35"/><rect x="8" y="39" width="5" height="8" rx="2" fill="#e5484d"/><ellipse class="db-light" cx="128" cy="42" rx="5" ry="4" fill="#ffe27a"/><rect x="6" y="52" width="130" height="6" rx="3" fill="#2d3550"/></g><circle cx="36" cy="56" r="13" fill="#b9501b"/><circle cx="106" cy="56" r="13" fill="#b9501b"/><g class="db-wheel"><circle cx="36" cy="56" r="11" fill="#22252e"/><circle cx="36" cy="56" r="5" fill="#c9d3e0"/><path d="M36 47V65M27 56H45" stroke="#8794a8" stroke-width="2"/></g><g class="db-wheel"><circle cx="106" cy="56" r="11" fill="#22252e"/><circle cx="106" cy="56" r="5" fill="#c9d3e0"/><path d="M106 47V65M97 56H115" stroke="#8794a8" stroke-width="2"/></g></svg>'
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
        /* Cinematic slow-mo launch: rolls onto the pad, 3-2-1, lifts off slowly, then whooshes away. Click it to hit turbo. */
        var d = dims(), u = unit(), x = d.W * o.x, w = u * 1.3, h = w * 112 / 60;
        var el = add(FX_SVG.rocket, w, 'db-fx-click db-rocket-idle');
        el.style.left = (x - w / 2) + 'px'; el.style.top = d.H + 'px';
        var pad = -h * 0.85, fly = null, puffs = null;
        function startPuffs() {
          if (calm) return;
          puffs = win.setInterval(function () {
            var r = el.getBoundingClientRect(), l = layer.getBoundingClientRect();
            var pf = add('', u * 0.62, 'db-fx-puff');
            pf.style.height = u * 0.62 + 'px';
            pf.style.left = (r.left - l.left + r.width / 2 - u * 0.31 + (Math.random() - 0.5) * u * 0.35) + 'px';
            pf.style.top = (r.bottom - l.top - u * 0.3) + 'px';
            done(pf.animate([{ transform: 'scale(.5)', opacity: .85 }, { transform: 'scale(2.8) translateY(' + u * 0.5 + 'px)', opacity: 0 }], { duration: 1300, easing: 'ease-out' })).then(function () { pf.remove(); });
          }, 70);
        }
        el.addEventListener('click', function () { if (fly && fly.updatePlaybackRate) fly.updatePlaybackRate(3); });
        function count(list) {
          return list.reduce(function (p, t) { return p.then(function () { return say(t, x, -pad + 10, 430); }); }, Promise.resolve());
        }
        var roll = done(el.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(0,' + pad + 'px)' }], { duration: calm ? 1 : 450, easing: 'cubic-bezier(.2,1.2,.4,1)', fill: 'forwards' }));
        return roll.then(function () { return calm ? null : count(['3', '2', '1']); }).then(function () {
          el.classList.remove('db-rocket-idle');
          startPuffs();
          var top = -(d.H + h * 1.4);
          fly = el.animate([
            { transform: 'translate(0,' + pad + 'px)', offset: 0, easing: 'linear' },
            { transform: 'translate(-2px,' + pad + 'px)', offset: 0.04, easing: 'linear' },
            { transform: 'translate(2px,' + pad + 'px)', offset: 0.08, easing: 'linear' },
            { transform: 'translate(-1px,' + (pad - 4) + 'px)', offset: 0.12, easing: 'ease-in' },
            { transform: 'translate(0,' + (pad - h * 0.9) + 'px)', offset: 0.55, easing: 'cubic-bezier(.5,0,.9,.5)' },
            { transform: 'translate(0,' + top + 'px)', offset: 1 }
          ], { duration: calm ? 1 : 3200, fill: 'forwards' });
          var said = pause(calm ? 0 : 1000).then(function () { return say(o.text, x + u * 2.2, d.H * 0.42); });
          return Promise.all([done(fly), said]);
        }).then(function () { if (puffs) win.clearInterval(puffs); el.remove(); });
      },
      car: function (o) {
        /* A little orange car drives in, stops mid-screen with a beep, then drives off. */
        var d = dims(), u = unit(), w = Math.max(100, u * 3.4), h = w * 70 / 140;
        var el = add(FX_SVG.car, w, 'db-fx-click db-car');
        el.style.left = '0px'; el.style.top = (d.H - h - 2) + 'px';
        var stopX = Math.max(0, d.W * 0.5 - w / 2), puffs = null;
        function startPuffs() {
          if (calm) return;
          puffs = win.setInterval(function () {
            var r = el.getBoundingClientRect(), l = layer.getBoundingClientRect();
            var pf = add('', u * 0.3, 'db-fx-puff');
            pf.style.height = u * 0.3 + 'px';
            pf.style.left = (r.left - l.left + w * 0.02) + 'px';
            pf.style.top = (r.bottom - l.top - h * 0.3) + 'px';
            done(pf.animate([{ transform: 'scale(.5)', opacity: .7 }, { transform: 'scale(2) translate(-' + u * 0.4 + 'px,-' + u * 0.2 + 'px)', opacity: 0 }], { duration: 700, easing: 'ease-out' })).then(function () { pf.remove(); });
          }, 90);
        }
        function stopPuffs() { if (puffs) { win.clearInterval(puffs); puffs = null; } }
        el.addEventListener('click', function () {
          var s = el.firstChild;
          if (s && s.animate && !calm) s.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-9px)' }, { transform: 'translateY(0)' }], { duration: 260, easing: 'ease-out' });
        });
        startPuffs();
        return done(el.animate([{ transform: 'translateX(' + (-w - 10) + 'px)' }, { transform: 'translateX(' + stopX + 'px)' }], { duration: calm ? 1 : 1400, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'forwards' }))
          .then(function () { stopPuffs(); el.classList.add('db-car-stop'); return say(o.text ? 'Beep beep! ' + o.text : 'Beep beep!', stopX + w / 2, h + 12, 2600); })
          .then(function () { el.classList.remove('db-car-stop'); startPuffs(); return done(el.animate([{ transform: 'translateX(' + stopX + 'px)' }, { transform: 'translateX(' + (d.W + 10) + 'px)' }], { duration: calm ? 1 : 1100, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'forwards' })); })
          .then(function () { stopPuffs(); el.remove(); });
      },
      swing: function (o) {
        /* Webby (an original spider) lowers itself on a silk thread, swings and says hello, then climbs back up. Click to spin it. */
        var d = dims(), u = unit(), w = u * 1.5, h = w * 0.86, x = d.W * o.x;
        var T = Math.max(h + 20, Math.min(d.H * 0.4, 300));
        var wrap = add('', w, 'db-swing');
        wrap.style.left = (x - w / 2) + 'px'; wrap.style.top = '0px'; wrap.style.height = (T + h) + 'px';
        var thread = doc.createElement('div'); thread.className = 'db-thread'; thread.style.height = T + 'px'; wrap.appendChild(thread);
        var sp = doc.createElement('div'); sp.className = 'db-swing-spider db-fx-click'; sp.style.width = w + 'px';
        setMarkup(sp, charmSvg('webby')); wrap.appendChild(sp);
        sp.style.transform = 'translateY(' + (-h) + 'px)';
        sp.addEventListener('click', function () {
          var s = sp.firstChild;
          if (s && s.animate && !calm) s.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 520, easing: 'ease-in-out' });
        });
        function ext(a, b, ms, easing) {
          var k = h * 0.3, ts = Math.max(0, a + k) / T, te = Math.max(0, b + k) / T;
          return Promise.all([
            done(thread.animate([{ transform: 'scaleY(' + ts + ')' }, { transform: 'scaleY(' + te + ')' }], { duration: ms, easing: easing, fill: 'forwards' })),
            done(sp.animate([{ transform: 'translateY(' + a + 'px)' }, { transform: 'translateY(' + b + 'px)' }], { duration: ms, easing: easing, fill: 'forwards' }))
          ]);
        }
        return ext(-h, T, calm ? 1 : 700, 'cubic-bezier(.3,1.4,.5,1)').then(function () {
          var sway = calm ? null : wrap.animate([{ transform: 'rotate(-13deg)' }, { transform: 'rotate(13deg)' }], { duration: 650, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
          return say(o.text, x, d.H - T - h - 70, 2800).then(function () {
            if (sway) sway.cancel();
          });
        }).then(function () { return ext(T, -h, calm ? 1 : 650, 'ease-in'); }).then(function () { wrap.remove(); });
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


  /* ---- Sound: tiny synthesised blips, no audio files ---- */
  var audio = null;
  function sound(mode, ride) {
    if (!mode || mode === 'off') return;
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime;
      var tone = function (f, start, dur, type, vol, to) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f, t + start);
        if (to) o.frequency.exponentialRampToValueAtTime(to, t + start + dur);
        g.gain.setValueAtTime(0.0001, t + start);
        g.gain.exponentialRampToValueAtTime(vol || 0.12, t + start + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
        o.connect(g); g.connect(audio.destination); o.start(t + start); o.stop(t + start + dur + 0.05);
      };
      var whoosh = function (dur) {
        var n = Math.floor(audio.sampleRate * dur), buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        var src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
        src.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2600, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(audio.destination); src.start(t);
      };
      var kind = mode === 'themed' ? ({ car: 'honk', scooter: 'honk', skate: 'honk', rocket: 'whoosh', plane: 'whoosh', balloon: 'chime', ufo: 'ufo', cloud: 'chime', webby: 'pop' }[ride] || 'chime') : mode;
      if (kind === 'pop') tone(620, 0, 0.09, 'sine', 0.16, 220);
      else if (kind === 'honk') { tone(420, 0, 0.13, 'square', 0.05); tone(420, 0.2, 0.13, 'square', 0.05); }
      else if (kind === 'whoosh') whoosh(1.3);
      else if (kind === 'ufo') { tone(500, 0, 0.5, 'sine', 0.1, 1300); tone(900, 0.12, 0.4, 'sine', 0.05, 300); }
      else { tone(880, 0, 0.22, 'sine', 0.12); tone(1320, 0.16, 0.3, 'sine', 0.1); }
    } catch (e) { /* audio blocked by the page: stay silent */ }
  }

  /* ---- Rides: a car, rocket or spider can carry the reminder instead of the buddy ---- */
  var RIDES = {
    car:     { name: 'Car',        w: 2.2,  ratio: 0.5,   exit: 'drive',  speed: 270, svg: function () { return FX_SVG.car; } },
    scooter: { name: 'Scooter',    w: 1.8,  ratio: 0.75,  exit: 'drive',  speed: 230, svg: function () { return FX_SVG.scooter; } },
    skate:   { name: 'Skateboard', w: 1.7,  ratio: 0.42,  exit: 'drive',  speed: 250, svg: function () { return FX_SVG.skate; } },
    plane:   { name: 'Paper plane', w: 1.5, ratio: 0.58,  exit: 'glide',  speed: 300, base: 60, svg: function () { return FX_SVG.plane; } },
    balloon: { name: 'Balloon ride', w: 1.0, ratio: 1.375, exit: 'float', arrive: 'rise', base: 24, svg: function () { return FX_SVG.balloonride; } },
    ufo:     { name: 'UFO',        w: 1.6,  ratio: 0.55,  exit: 'drive',  speed: 340, base: 34, svg: function () { return FX_SVG.ufo; } },
    cloud:   { name: 'Rain cloud', w: 1.7,  ratio: 0.667, exit: 'drive',  speed: 110, base: 70, svg: function () { return FX_SVG.cloud; } },
    rocket:  { name: 'Rocket',     w: 0.8,  ratio: 112 / 60, exit: 'launch', arrive: 'rise', svg: function () { return FX_SVG.rocket; } },
    webby:   { name: 'Webby',      w: 1.05, ratio: 0.86,  exit: 'drive',  speed: 140, svg: function () { return charmSvg('webby'); } }
  };
  function pickRide(pref) {
    if (pref === 'mix') { var l = [null].concat(Object.keys(RIDES)); return l[Math.floor(Math.random() * l.length)]; }
    return RIDES[pref] ? pref : null;
  }
  /* Copy of a reminder with the ride chosen from the user's setting; decorative one-shot effects that
     would double up with the ride are dropped. */
  function plan(r, pref) {
    var o = {}, k;
    for (k in r) o[k] = r[k];
    o.ride = pickRide(pref);
    if (o.ride && ['rocket', 'car', 'swing', 'peek'].indexOf(o.effect) >= 0) o.effect = null;
    return o;
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
    '.db-rocket-idle .db-flame{opacity:0}',
    '.db-ride .db-wheel,.db-ride .db-car-body{animation-play-state:paused}',
    '.db-ride.is-walk .db-wheel,.db-ride.is-walk .db-car-body{animation-play-state:running}',
    '.db-ride-car.is-wave .db-light,.db-ride-car.is-cheer .db-light{animation:db-flash .35s ease-in-out infinite alternate}',
    '.db-ride-rocket .db-flame{opacity:0}.db-ride-rocket.is-walk .db-flame{opacity:1}',
    '.db-ride-rocket.is-wave svg,.db-ride-rocket.is-idle svg{animation:db-hover 1.6s ease-in-out infinite alternate}',
    '.db-ride-webby.is-walk svg{animation:db-hop .22s ease-out infinite alternate}',
    '.db-ride-webby.is-wave svg,.db-ride-car.is-wave svg{animation:db-wiggle .5s ease-in-out infinite alternate}',
    '.db-ride-ufo svg,.db-ride-cloud svg,.db-ride-plane svg,.db-ride-balloon svg{animation:db-hover 1.8s ease-in-out infinite alternate}',
    '.db-ride.is-cheer svg{animation:db-jump .42s ease-out infinite alternate}',
    '.db-ride-cloud svg{filter:drop-shadow(0 2px 3px rgba(40,70,120,.4))}',
    '.db-ride-ufo .db-light{animation:db-flash .5s ease-in-out infinite alternate}',
    '.db-burner{transform-box:fill-box;transform-origin:50% 100%;animation:db-flame .15s ease-in-out infinite alternate}',
    '.db-rain path{animation:db-rain .9s linear infinite}.db-rain path:nth-child(2){animation-delay:.3s}.db-rain path:nth-child(3){animation-delay:.6s}',
    '@keyframes db-rain{from{transform:translateY(-4px);opacity:1}to{transform:translateY(14px);opacity:0}}',
    '.db-paw{transform-origin:85px 86px;animation:db-beckon .8s ease-in-out infinite alternate}',
    '@keyframes db-beckon{from{transform:rotate(0)}to{transform:rotate(-16deg)}}',
    '.db-twinkle{transform-box:fill-box;transform-origin:center;animation:db-twinkle 1.4s ease-in-out infinite alternate}',
    '@keyframes db-twinkle{from{transform:scale(.4);opacity:.3}to{transform:scale(1.1);opacity:1}}',
    '@keyframes db-hover{from{transform:translateY(0)}to{transform:translateY(-4px)}}',
    '@keyframes db-hop{from{transform:translateY(0)}to{transform:translateY(-7px)}}',
    '@keyframes db-wiggle{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}',
    '.db-wheel{transform-box:fill-box;transform-origin:center;animation:db-spin .28s linear infinite}',
    '.db-car-body{animation:db-bounce .22s ease-in-out infinite alternate}',
    '.db-car-stop .db-wheel,.db-car-stop .db-car-body{animation-play-state:paused}',
    '.db-car-stop .db-light{animation:db-flash .25s ease-in-out 6 alternate}',
    '@keyframes db-spin{to{transform:rotate(360deg)}}',
    '@keyframes db-bounce{from{transform:translateY(0)}to{transform:translateY(-1.5px)}}',
    '@keyframes db-flash{from{opacity:1}to{opacity:.2}}',
    '.db-swing{transform-origin:50% 0}',
    '.db-thread{position:absolute;left:50%;top:0;width:2px;margin-left:-1px;background:#c9ccd6;transform-origin:50% 0;transform:scaleY(0)}',
    '.db-swing-spider{position:absolute;left:0;top:0;filter:drop-shadow(0 4px 5px rgba(0,0,0,.25))}',
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
    '.db-mouth-open{display:none}',
    '.is-cheer .db-smile,.is-wave .db-smile,.is-drink .db-smile{display:none}',
    '.is-cheer .db-mouth-open,.is-wave .db-mouth-open{display:block}',
    '.is-idle .db-head{animation:db-look 9s ease-in-out infinite}',
    '@keyframes db-look{0%,55%,100%{transform:rotate(0)}65%{transform:rotate(-6deg) translateX(-2px)}80%{transform:rotate(6deg) translateX(2px)}90%{transform:rotate(0)}}',
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
    '@keyframes db-jump{from{transform:translateY(0) scale(1.06,.93)}to{transform:translateY(-22px) scale(.95,1.07)}}',
    '@keyframes db-shadow{from{transform:scale(1)}to{transform:scale(.7)}}',
    '@keyframes db-tail{from{transform:rotate(-8deg)}to{transform:rotate(14deg)}}',
    '@keyframes db-blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}',
    '.db-bubble{position:absolute;left:0;box-sizing:border-box;width:max-content;max-width:min(270px,calc(100vw - 16px));max-height:calc(100vh - 12px);overflow:auto;padding:12px 14px;border-radius:16px;background:#fff;color:#1c1e26;font-size:14px;box-shadow:0 8px 28px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.06);pointer-events:auto;animation:db-pop .22s cubic-bezier(.2,1.4,.4,1)}',
    '.db-bubble-title{margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2f6bff}',
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

    var x = -size, facing = 1, anim = 'idle', moveId = 0, flow = 0, curW = size, curH = H, look = null, lift = 0;
    var pet = false, current = null, timers = [], dead = false;
    var charId = opts.character || 'mika';
    render(sprite, charId);

    function setLook(id) {
      var rd = id && RIDES[id] ? id : null;
      if (rd === look) return;
      look = rd; lift = rd ? (RIDES[rd].base || 0) : 0;
      if (rd) { curW = Math.round(size * RIDES[rd].w); curH = Math.round(curW * RIDES[rd].ratio); actor.style.width = curW + 'px'; setMarkup(sprite, RIDES[rd].svg()); }
      else { curW = size; curH = H; actor.style.width = size + 'px'; render(sprite, charId); }
      setAnim(anim);
    }
    function tween(my, ms, fn) {
      return new Promise(function (res) {
        var t0 = null;
        function step(now) {
          if (dead || my !== flow) return res(false);
          if (t0 === null) t0 = now;
          var p = Math.min(1, (now - t0) / ms);
          fn(p); place();
          if (p < 1) requestAnimationFrame(step); else res(true);
        }
        requestAnimationFrame(step);
      });
    }

    function width() { return stage.clientWidth || (doc.defaultView ? doc.defaultView.innerWidth : 800); }
    function place() {
      actor.style.transform = 'translate(' + Math.round(x) + 'px,' + (-Math.round(lift)) + 'px)';
      if (!bubble.hidden) {
        var bw = bubble.offsetWidth, W = width();
        var avail = opts.fixed ? (doc.defaultView ? doc.defaultView.innerHeight : 600) : (stage.parentNode.clientHeight || 600);
        var left, bottom;
        if (curH + 10 + bubble.offsetHeight <= avail) {
          left = Math.max(8, Math.min(W - bw - 8, x + curW / 2 - bw / 2));
          bottom = curH + 6 + lift;
        } else {
          // Not enough room above the character (short panel): put the bubble beside it.
          left = x + curW + 4 + bw <= W - 4 ? x + curW + 4 : Math.max(4, x - bw - 4);
          bottom = 6;
        }
        bubble.style.left = Math.round(left) + 'px';
        bubble.style.bottom = bottom + 'px';
      }
    }
    function setAnim(name) {
      anim = name;
      sprite.className = 'db-sprite is-' + name + (look ? ' db-ride db-ride-' + look : '') + (facing < 0 ? ' db-flip' : '');
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
    function show() { if (actor.hidden) { actor.hidden = false; x = -curW; place(); } }
    function say(text, actions, title) {
      bubble.textContent = '';
      if (title) {
        var t = doc.createElement('p');
        t.className = 'db-bubble-title';
        t.textContent = title;
        bubble.appendChild(t);
      }
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

    /* A ride leaves carrying the last message: cars drive off, rockets launch in slow motion. */
    async function leaveRide(my) {
      var rd = RIDES[look], base = rd.base || 0, x0 = x;
      var W0 = width(), H0 = doc.defaultView ? doc.defaultView.innerHeight : 800;
      if (rd.exit === 'launch') {
        setAnim('walk');
        var slow = curH * 0.9, end = H0 + curH * 1.6;
        await tween(my, 2600, function (p) { lift = p < 0.45 ? slow * Math.pow(p / 0.45, 2) : slow + (end - slow) * Math.pow((p - 0.45) / 0.55, 2.2); });
      } else if (rd.exit === 'float') {
        setAnim('walk');
        await tween(my, 3800, function (p) { lift = base + (H0 + curH * 1.4) * Math.pow(p, 1.8); x = x0 + Math.sin(p * 10) * 14; });
      } else if (rd.exit === 'glide') {
        setAnim('walk');
        await tween(my, 1900, function (p) { lift = base + H0 * 0.55 * p * p; x = x0 + (W0 + curW - x0) * Math.pow(p, 1.5); });
      } else { facing = 1; await walkTo(W0 + 20, rd.speed || 200); }
      if (my !== flow || dead) return;
      hush(); actor.hidden = true; setLook(null); place();
      if (pet) { show(); wander(my); }
    }
    async function settle(my) {
      if (my !== flow || dead) return;
      if (look) return leaveRide(my);
      hush();
      if (pet) return wander(my);
      await walkTo(-curW - 10);
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
        if (r.id === 'water') { say('Cheers!'); setAnim('drink'); await wait(look ? 900 : 1800); if (my !== flow) return; }
        say(r.cheer || 'Nice one!'); setAnim('cheer');
        await wait(look ? 1100 : 1500);
      } else if (actionId === 'later' || actionId === 'skip') {
        say(actionId === 'skip' ? 'Okay, not again today.' : (r.snoozeText || 'Okay, I will ask again soon.')); setAnim('idle');
        await wait(look ? 1000 : 1300);
      }
      settle(my);
    }

    var api = {
      el: stage,
      setCharacter: function (id) { if (CHARACTERS[id]) { charId = id; if (!look) render(sprite, id); } },
      /* r: { id, kind, text, cheer, actions:[{id,label,primary}], timeout } */
      remind: async function (r) {
        if (current && opts.onAction) opts.onAction('timeout', current);
        var my = begin();
        current = r;
        hush();
        var want = r.ride && RIDES[r.ride] ? r.ride : null;
        if (want || look) actor.hidden = true; // a ride (or the buddy after a ride) always arrives from off-screen
        setLook(want);
        var W = width();
        var tx = Math.max(12, Math.min(W - curW - 12, W * 0.08));
        if (look && RIDES[look].arrive === 'rise') {
          var bs = RIDES[look].base || 0, from = -(curH + 20);
          x = tx; lift = from; actor.hidden = false; facing = 1; setAnim('walk'); place();
          await tween(my, 900, function (p) { lift = bs + (from - bs) * Math.pow(1 - p, 2); });
        } else {
          show();
          await walkTo(tx, look ? (RIDES[look].speed || 190) : 190);
        }
        if (my !== flow) return;
        facing = 1; setAnim('wave');
        say(r.text, r.actions || [{ id: 'done', label: 'Done', primary: true }, { id: 'later', label: 'Remind me later' }], r.title);
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
    actor.addEventListener('click', function () {
      if (look && current) {
        var sv = sprite.firstChild;
        if (sv && sv.animate) sv.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], { duration: 280, easing: 'ease-out' });
        return;
      }
      api.poke();
    });
    if (doc.defaultView) doc.defaultView.addEventListener('resize', function () {
      if (dead || actor.hidden) return;
      var W = width();
      if (x > W - curW - 8 && !current) { x = Math.max(8, W - curW - 8); }
      place();
    });
    return api;
  }

  root.DeskBuddy = { CHARACTERS: CHARACTERS, CHARMS: CHARMS, svg: svg, charmSvg: charmSvg, render: render, renderCharm: function (el, id) { return setMarkup(el, charmSvg(id)); }, CSS: CSS, createStage: createStage, createCharm: createCharm, FX: FX, createFx: createFx, RIDES: RIDES, pickRide: pickRide, plan: plan, sound: sound, renderRide: function (el, id) { return setMarkup(el, RIDES[id].svg()); } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
