// The pictures of the problems (realproblems.js), as in a physics textbook, drawn with the shared
// figure kit (figkit.js): the situation with its heights and lengths as dimension lines, the
// velocities the text gives as arrows, and paths as dashed lines. Lengths are labelled with
// letters; the values are in the text. EnergyFigures[id](p) gives the SVG.
(function (root) {
  'use strict';

  const F = () => root.Fig;
  const L = (en, de) => root.EC.L(en, de);
  const rad = (deg) => (deg * Math.PI) / 180;
  const f = (x) => Math.round(x * 10) / 10;
  // a velocity arrow (blue): from a along dir, len px
  const vel = (a, dir, len, label, off = [8, 0]) => F().force(a, dir, len, label, off, 'v');
  // a dashed level line with its height dimension from y0 up to y1 at x
  const level = (x0, x1, y) => F().line(x0, y, x1, y, 'tb-eq');

  // ---------------------------------------------------------------- 1 a crash test
  function crash() {
    const { svg, car, ground, rect, dim, sym, text, path } = F();
    return svg(430, 250,
      ground(0, 430, 222) + car(30, 222, 150) + rect(190, 150, 26, 72, 'tb-concrete') + vel([150, 170], [1, 0], 34, sym('v'), [6, -10]) +
      path('M262 222 V52', 'tb-ghost') + car(270, 74, 120, { dy: 0 }) + vel([330, 92], [0, 1], 60, sym('v'), [10, 10]) +
      path('M270 222 H400', 'tb-line') + dim([410, 222], [410, 74], sym('h'), 0) +
      text(110, 244, L('crash into a wall', 'Aufprall auf eine Wand'), 'tb-cap') + text(330, 244, L('falling from a height', 'Fall aus einer Höhe'), 'tb-cap'),
      L('A car hitting a wall, and the same car falling from a height', 'Ein Auto prallt auf eine Wand, und dasselbe Auto fällt aus einer Höhe'));
  }

  // ---------------------------------------------------------------- 2 a fountain
  function fountain() {
    const { svg, path, rect, dim, sym, ground, text } = F();
    const x = 210, y0 = 200, top = 40;
    return svg(420, 250,
      ground(0, 420, 222) + path(`M130 222 L140 ${y0} H280 L290 222`, 'tb-concrete') + path(`M140 ${y0 + 6} H280`, 'tb-surface') +
      rect(x - 6, y0 - 12, 12, 14, 'tb-metal', 2) +
      path(`M${x - 3} ${y0 - 12} C${x - 4} 120 ${x - 8} 70 ${x - 2} ${top + 6} Q${x} ${top - 2} ${x + 2} ${top + 6} C${x + 8} 70 ${x + 4} 120 ${x + 3} ${y0 - 12} Z`, 'tb-jet') +
      [[x - 16, top + 30], [x + 14, top + 22], [x - 22, top + 60], [x + 20, top + 58]].map(([a, b]) => `<circle class="tb-drop" cx="${a}" cy="${b}" r="2.4"/>`).join('') +
      level(x + 30, 360, top) + level(x + 30, 360, y0 - 12) + dim([350, y0 - 12], [350, top], sym('H'), 0) +
      level(x + 30, 290, (top + y0 - 12) / 2) + text(296, (top + y0 - 12) / 2 + 5, '?', 'tb-label', 'start') +
      text(x - 40, y0 - 2, L('nozzle', 'Düse'), 'tb-label', 'end'),
      L('A fountain shooting water straight up from its nozzle', 'Ein Springbrunnen spritzt Wasser aus seiner Düse senkrecht nach oben'));
  }

  // ---------------------------------------------------------------- 3 a roller coaster
  function coaster(p) {
    const { svg, path, dim, sym, ground } = F();
    const yb = 210, s = 150 / p.H, y1 = yb - p.H * s, y2 = yb - p.h2 * s;
    const track = `M20 ${y1 + 30} Q60 ${y1} 100 ${y1} Q150 ${y1} 180 ${yb - 40} Q205 ${yb} 240 ${yb} Q290 ${yb} 320 ${y2 + 10} Q340 ${y2} 360 ${y2} Q385 ${y2} 410 ${y2 + 40}`;
    return svg(430, 250,
      ground(0, 430, 222) + path(track, 'tb-track') +
      `<rect class="tb-red" x="84" y="${f(y1 - 18)}" width="34" height="16" rx="4"/>` + F().circle(92, y1 - 2, 4, 'tb-dark') + F().circle(110, y1 - 2, 4, 'tb-dark') +
      level(60, 400, yb) + level(100, 260, y1) + level(260, 400, y2) +
      dim([150, yb], [150, y1], sym('H'), 0) + dim([395, yb], [395, y2], sym('h', '2'), 0),
      L('A roller coaster car on the top of the first hill, the valley and the next hill', 'Ein Achterbahnwagen auf dem ersten Hügel, das Tal und der nächste Hügel'));
  }

  // ---------------------------------------------------------------- 4 pole vault
  function vault(p) {
    const { svg, path, person, ground, dim, sym, rect, line } = F();
    const yg = 214, s = 26, yc = yg - p.h0 * s, yt = yg - p.H * s;
    return svg(430, 250,
      ground(0, 430, yg) + person(70, yg, 1.15, { shirt: 'red', lean: 8, hands: [[84, 140], [100, 146]] }) + line(60, 132, 200, 196, 'tb-pole') +
      F().circle(74, yc, 4, 'tb-com') + path(`M74 ${yc} Q170 ${yc} 220 ${yt + 30} Q260 ${yt - 6} 310 ${yt + 20}`, 'tb-ghost') + F().circle(262, yt + 2, 4, 'tb-com') +
      path(`M240 ${yg} V${yt - 4} M300 ${yg} V${yt - 4}`, 'tb-line') + line(240, yt + 4, 300, yt + 4, 'tb-bar') + rect(312, yg - 22, 100, 22, 'tb-blue', 3) +
      vel([90, yc - 14], [1, 0], 40, sym('v'), [6, -8]) +
      dim([20, yg], [20, yc], sym('h', '0'), 0) + dim([226, yg], [226, yt + 2], sym('H'), 0),
      L('A pole vaulter: her centre of mass rises from its height while running to the height over the bar', 'Eine Stabhochspringerin: Ihr Schwerpunkt steigt von seiner Höhe beim Anlauf bis zur Höhe über der Latte'));
  }

  // ---------------------------------------------------------------- 5 rolling through a valley
  function cyclist(p) {
    const { svg, path, dim, sym, circle, line } = F();
    const ytop = 60, yv = 200, hill = `M10 ${ytop + 4} Q60 ${ytop} 100 ${ytop + 20} Q170 ${yv} 220 ${yv} Q270 ${yv} 330 ${yv - 90} Q370 ${yv - 140} 420 ${yv - 146}`;
    const bike = (x, y) => circle(x - 13, y - 9, 9, 'tb-wheel') + circle(x + 13, y - 9, 9, 'tb-wheel') + path(`M${x - 13} ${y - 9} L${x - 3} ${y - 24} L${x + 9} ${y - 24} L${x + 13} ${y - 9} M${x - 3} ${y - 24} L${x} ${y - 9}`, 'tb-frame') +
      F().person(x - 2, y - 9, 0.6, { shirt: 'green', hands: [[x + 8, y - 30], [x + 10, y - 30]], lean: 10, knee: 8 });
    return svg(430, 240,
      path(`${hill} L420 240 L10 240 Z`, 'tb-hill') + bike(60, ytop + 2) + vel([76, ytop - 30], [1, 0], 34, sym('v', '0'), [6, -6]) +
      line(40, ytop, 300, ytop, 'tb-eq') + line(150, yv, 400, yv, 'tb-eq') + dim([170, yv], [170, ytop], sym('h', '1'), 0) +
      line(300, 120, 410, 120, 'tb-eq') + dim([380, yv], [380, 120], '?', 0),
      L('A cyclist on a hilltop above a valley, and the hill on the other side', 'Eine Velofahrerin auf einer Kuppe über einem Tal, und der Hügel auf der anderen Seite'));
  }

  // ---------------------------------------------------------------- 6 ski jumping
  function skijump(p) {
    const { svg, path, dim, sym, circle, line } = F();
    const top = [30, 30], take = [180, 120], land = [370, 205];
    return svg(430, 240,
      path(`M10 20 L${top[0]} ${top[1]} Q120 70 ${take[0]} ${take[1]} L${take[0]} 240 L10 240 Z`, 'tb-snow') +
      path(`M${take[0] + 4} ${take[1] + 24} Q300 140 ${land[0]} ${land[1]} L430 220 L430 240 L${take[0] + 4} 240 Z`, 'tb-snow') +
      path(`M${take[0]} ${take[1]} Q280 100 ${land[0]} ${land[1]}`, 'tb-ghost') +
      circle(top[0] + 6, top[1] - 4, 4, 'tb-com') + circle(take[0], take[1] - 4, 4, 'tb-com') + circle(land[0], land[1] - 4, 4, 'tb-com') +
      line(10, top[1], 140, top[1], 'tb-eq') + line(100, take[1], 420, take[1], 'tb-eq') + line(250, land[1], 420, land[1], 'tb-eq') +
      dim([80, take[1]], [80, top[1]], sym('h', '1'), 0) + dim([410, land[1]], [410, take[1]], sym('h', '2'), 0),
      L('A ski jump: start, take-off and landing, the flight dashed', 'Eine Skisprungschanze: Start, Absprung und Landung, der Flug gestrichelt'));
  }

  // ---------------------------------------------------------------- 7 a rope swing over a lake
  function swing() {
    const { svg, path, dim, sym, circle, line, text, rect } = F();
    const P = [250, 30], l = 150, a = rad(60), start = [P[0] - l * Math.sin(a), P[1] + l * Math.cos(a)], low = [P[0], P[1] + l];
    return svg(430, 250,
      rect(250, 22, 170, 12, 'tb-wood', 4) + rect(400, 22, 20, 228, 'tb-wood') + path(`M0 120 Q60 116 90 130 L110 ${P[1] + l + 50} H0 Z`, 'tb-hill') +
      rect(110, P[1] + l + 50, 290, 30, 'tb-water') + path(`M110 ${P[1] + l + 50} H400`, 'tb-surface') +
      path(`M${start[0]} ${start[1]} A${l} ${l} 0 0 0 ${low[0] + 60} ${low[1] - 12}`, 'tb-ghost') +
      line(P[0], P[1], start[0], start[1], 'tb-ghost') + line(P[0], P[1], low[0], low[1], 'tb-rope') + circle(P[0], P[1], 3, 'tb-line-fill') +
      circle(start[0], start[1], 8, 'tb-ghost') + circle(low[0], low[1] + 6, 8, 'tb-skin') + path(`M${low[0]} ${low[1] + 14} v26`, 'tb-limbline') +
      path(`M${P[0]} ${P[1] + 40} A40 40 0 0 1 ${P[0] - 40 * Math.sin(a)} ${P[1] + 40 * Math.cos(a)}`, 'tb-line') + text(P[0] - 16, P[1] + 58, '60°', 'tb-label', 'end') +
      dim([P[0], P[1]], [low[0], low[1]], sym('ℓ'), -14) + dim([300, P[1] + l + 50], [300, low[1] + 20], sym('d'), 0),
      L('A rope swing: the start at 60° and the lowest point above the lake', 'Eine Seilschaukel: der Start bei 60° und der tiefste Punkt über dem See'));
  }

  // ---------------------------------------------------------------- 8 a slingshot
  function sling() {
    const { svg, path, dim, sym, circle, line, text } = F();
    const fork = [210, 150], pull = 70;
    return svg(420, 250,
      path(`M${fork[0]} 240 V${fork[1] + 20} M${fork[0]} ${fork[1] + 20} L${fork[0] - 26} ${fork[1] - 20} M${fork[0]} ${fork[1] + 20} L${fork[0] + 26} ${fork[1] - 20}`, 'tb-sling') +
      path(`M${fork[0] - 26} ${fork[1] - 20} L${fork[0]} ${fork[1] - 20 + pull} L${fork[0] + 26} ${fork[1] - 20}`, 'tb-band') +
      path(`M${fork[0] - 26} ${fork[1] - 20} L${fork[0] + 26} ${fork[1] - 20}`, 'tb-ghost') +
      circle(fork[0], fork[1] - 20 + pull + 4, 7, 'tb-stone') + path(`M${fork[0]} ${fork[1] - 30} V20`, 'tb-ghost') + vel([fork[0], fork[1] - 34], [0, -1], 46, sym('v'), [10, 10]) +
      dim([fork[0] + 50, fork[1] - 20], [fork[0] + 50, fork[1] - 20 + pull], sym('s'), -1) + line(fork[0] + 20, 20, fork[0] + 80, 20, 'tb-eq') + text(fork[0] + 86, 24, '?', 'tb-label', 'start'),
      L('A slingshot with its rubber band pulled back, the stone shot straight up', 'Eine Steinschleuder mit gespanntem Gummi, der Stein senkrecht nach oben geschossen'));
  }

  // ---------------------------------------------------------------- 9 a pinball machine
  function pinball() {
    const { svg, path, dim, sym, circle, poly, line } = F();
    const a = rad(14), o = [40, 210], len = 340, u = [Math.cos(a), -Math.sin(a)], n = [Math.sin(a), Math.cos(a)];
    const P = (s, t) => [o[0] + s * u[0] - t * n[0], o[1] + s * u[1] - t * n[1]];
    const top = P(len, 0);
    return svg(430, 250,
      poly([o, top, [top[0], o[1]]], 'tb-concrete') + poly([P(0, 0), P(len, 0), P(len, 60), P(0, 60)], 'tb-blue') +
      
      `<g transform="translate(${f(P(30, 30)[0])} ${f(P(30, 30)[1])}) rotate(${f(-14)})">${F().path('M-24 0 h6 l3 -6 l6 12 l6 -12 l6 12 l6 -12 l3 6 h8', 'tb-spring')}<rect class="tb-metal" x="20" y="-5" width="8" height="10"/></g>` +
      circle(...P(64, 30), 7, 'tb-ball') + circle(...P(len - 30, 30), 7, 'tb-ghost') +
      line(...P(64, 30), o[0] + 380, P(64, 30)[1], 'tb-eq') + line(...P(len - 30, 30), o[0] + 380, P(len - 30, 30)[1], 'tb-eq') +
      dim([o[0] + 372, P(64, 30)[1]], [o[0] + 372, P(len - 30, 30)[1]], sym('h'), 0),
      L('A sloping pinball table: the plunger spring at the bottom, the ball at the top', 'Ein geneigter Flippertisch: die Feder des Abschussstabs unten, die Kugel oben'));
  }

  // ---------------------------------------------------------------- 10 a trampoline
  function trampoline() {
    const { svg, path, dim, sym, person, line, ground } = F();
    const ym = 180, xl = 110, xr = 310;
    return svg(430, 250,
      ground(0, 430, 230) + path(`M${xl} ${ym} L${xl - 10} 230 M${xr} ${ym} L${xr + 10} 230 M${xl + 20} ${ym} L${xl + 14} 230 M${xr - 20} ${ym} L${xr - 14} 230`, 'tb-line') +
      path(`M${xl} ${ym} H${xr}`, 'tb-mat') + path(`M${xl} ${ym} Q210 ${ym + 46} ${xr} ${ym}`, 'tb-ghost') +
      person(210, ym, 0.75, { shirt: 'orange', hands: [[196, ym - 60], [224, ym - 60]] }).replace(/class="/g, 'class="tb-faint ') +
      person(210, 80, 0.75, { shirt: 'orange', hands: [[192, 30], [228, 30]] }) +
      line(240, 80, 360, 80, 'tb-eq') + line(xr, ym, 360, ym, 'tb-eq') + line(250, ym + 23, 360, ym + 23, 'tb-eq') +
      dim([350, ym], [350, 80], sym('h'), 0) + dim([350, ym + 23], [350, ym], '?', 0),
      L('A girl at the highest point above a trampoline; dashed, the mat pressed down', 'Ein Mädchen im höchsten Punkt über einem Trampolin; gestrichelt die eingedrückte Matte'));
  }

  root.EnergyFigures = { crash, fountain, coaster, vault, cyclist, skijump, swing, sling, pinball, trampoline };
})(typeof window !== 'undefined' ? window : globalThis);
