// Pictures for the real problems (realproblems.js): a picture of the situation for the task, and
// force diagrams for the solution, drawn with the scenes of draw.js. RealPictures[id] =
// { pic(p, v), fbd(p, v) }, both HTML (fbd may be several diagrams side by side). In the force
// diagrams the arrows are proportional to the forces within each diagram.
(function (root) {
  'use strict';

  const FS = root.FS, { Scene } = root.Draw;
  const { L, G } = FS;
  const f = (x) => (Math.round(x * 10) / 10).toString();

  // ---------------------------------------------------------------- helpers
  // a picture: only the parts and the marks meant for the task (acceleration with its value)
  const picture = (sc) => sc.render({ task: true, tight: true });
  // a force diagram: every force and acceleration of the scene
  const diagram = (sc) => sc.render({ show: new Set([...sc.forces.map((x) => x.id), ...sc.marks.map((x) => x.id)]) });
  const raw = (sc, svg, pts) => { pts.forEach((p) => sc.see(...p)); return sc.add(svg); };
  const rect = (sc, x0, y0, x1, y1, cls, rx = 2) => raw(sc, `<rect class="${cls}" x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" rx="${rx}"/>`, [[x0, y0], [x1, y1]]);
  const circle = (sc, x, y, r, cls) => raw(sc, `<circle class="${cls}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`, [[x - r, y - r], [x + r, y + r]]);
  const poly = (sc, pts, cls) => raw(sc, `<polygon class="${cls}" points="${pts.map((p) => p.map(f).join(',')).join(' ')}"/>`, pts);
  const path = (sc, d, cls, pts) => raw(sc, `<path class="${cls}" d="${d}"/>`, pts);
  // a person standing with the feet at (x, y): head, body, arms and legs; s scales it
  function person(sc, x, y, s = 1, armsUp = false) {
    const k = (v) => v * s;
    circle(sc, x, y - k(56), k(7), 'pic-head');
    path(sc, `M${f(x)} ${f(y - k(48))}V${f(y - k(24))}M${f(x)} ${f(y - k(24))}L${f(x - k(8))} ${f(y)}M${f(x)} ${f(y - k(24))}L${f(x + k(8))} ${f(y)}` +
      (armsUp ? `M${f(x - k(14))} ${f(y - k(62))}L${f(x)} ${f(y - k(44))}L${f(x + k(14))} ${f(y - k(62))}` : `M${f(x - k(12))} ${f(y - k(28))}L${f(x)} ${f(y - k(44))}L${f(x + k(12))} ${f(y - k(28))}`),
    'pic-limbs', [[x - k(14), y - k(64)], [x + k(14), y]]);
  }
  const wheel = (sc, x, y, r) => { circle(sc, x, y, r, 'pic-wheel'); circle(sc, x, y, r * 0.35, 'pic-hub'); };
  // a car facing right, its wheels on the road at y
  function car(sc, x0, y, w = 120, cls = 'pic-car') {
    const p = (a, b) => [x0 + a * w, y - b * w];
    poly(sc, [p(0, 0.1), p(0, 0.27), p(0.22, 0.29), p(0.36, 0.43), p(0.72, 0.43), p(0.86, 0.29), p(1, 0.26), p(1, 0.1)], cls);
    poly(sc, [p(0.4, 0.29), p(0.42, 0.39), p(0.54, 0.39), p(0.54, 0.29)], 'pic-glass');
    poly(sc, [p(0.58, 0.29), p(0.58, 0.39), p(0.69, 0.39), p(0.79, 0.29)], 'pic-glass');
    wheel(sc, x0 + 0.2 * w, y - 0.09 * w, 0.09 * w); wheel(sc, x0 + 0.8 * w, y - 0.09 * w, 0.09 * w);
  }
  const road = (sc, x0, x1, y) => sc.surface([x0, y], [x1, y]);
  // an acceleration (or velocity) arrow in a picture, with its value
  const accel = (sc, id, at, dir, value, lab = [8, 0], sym = ['a']) => sc.accel({ id, at, dir, sym, value, task: 'value', lab });
  const aSym = '<tspan font-style="italic">a</tspan>';
  const velo = (sc, at, dir, lab = [8, 0]) => sc.accel({ id: 'v', at, dir, sym: ['v'], value: '<tspan font-style="italic">v</tspan>', task: 'value', lab, len: 34 });
  // a box for a force diagram, centre c, w × h, and the usual points
  function block(sc, c, w, h, label) {
    rect(sc, c[0] - w / 2, c[1] - h / 2, c[0] + w / 2, c[1] + h / 2, 'body', 3);
    if (label) sc.text(c[0] - w / 2 + 5, c[1] - h / 2 + 14, label, 'lbl mass', 'start');
    return { top: [c[0], c[1] - h / 2], bottom: [c[0], c[1] + h / 2], left: [c[0] - w / 2, c[1]], right: [c[0] + w / 2, c[1]] };
  }
  const force = (sc, id, kind, at, dir, mag, sym, lab = [8, 0]) => sc.force({ id, kind, at, dir, mag, sym, lab });
  const acc = (sc, id, at, dir) => sc.accel({ id, at, dir, sym: ['a'], lab: dir[0] < -0.5 ? [-8, 0] : [8, 0] });
  const two = (...html) => html.join('');

  // a slope rising to the right with angle α (sin s, cos c): its foot at o, length len (px)
  function slope(sc, o, len, s, c) {
    const top = [o[0] + len * c, o[1] - len * s];
    poly(sc, [o, [top[0], o[1]], top], 'slope');
    sc.surface([o[0] - 20, o[1]], [top[0] + 30, o[1]]);
    const u = [c, -s], n = [-s, -c]; // up the slope; away from it
    return { u, n, at: (d, h) => [o[0] + d * u[0] + h * n[0], o[1] + d * u[1] + h * n[1]] };
  }

  // ---------------------------------------------------------------- the problems
  const P = {};
  const up = (p) => ({ upStart: true, upStop: false, downStart: false, downStop: true }[p.ph]);
  const movesUp = (p) => p.ph === 'upStart' || p.ph === 'upStop';

  P.scale = {
    pic(p) {
      const sc = new Scene(300, 300, L('A person on a scale in a lift', 'Eine Person auf einer Waage im Lift'));
      rect(sc, 40, 40, 200, 260, 'pic-cabin', 4);
      sc.line(120, 0, 120, 40, 'w rope');
      rect(sc, 92, 248, 148, 260, 'pic-device', 2);
      person(sc, 120, 248, 1.6);
      velo(sc, [232, 130], [0, movesUp(p) ? -1 : 1]);
      accel(sc, 'a', [262, 130], [0, up(p) ? -1 : 1], FS.q(p.a, 'a'));
      return picture(sc);
    },
    fbd(p, v) {
      const sc = new Scene(200, 260, L('Forces on the person', 'Kräfte auf die Person'));
      const b = block(sc, [100, 130], 50, 90, '');
      force(sc, 'G', 'g', [94, 130], [0, 1], p.m * G, ['G'], [6, 6]);
      force(sc, 'N', 'n', [106, b.bottom[1]], [0, -1], v.N, ['N'], [8, 4]);
      acc(sc, 'a', [160, 130], [0, up(p) ? -1 : 1]);
      return diagram(sc);
    },
  };

  P.crane = {
    pic(p) {
      const sc = new Scene(320, 300, L('A harbour crane lifting a container', 'Ein Hafenkran hebt einen Container'));
      road(sc, 10, 300, 270);
      path(sc, 'M60 270V30M20 40H270M60 30L270 40M60 30L20 40', 'pic-crane', [[20, 30], [270, 270]]);
      rect(sc, 40, 200, 80, 270, 'pic-device', 2);
      sc.line(230, 40, 230, 140, 'w rope');
      rect(sc, 185, 140, 275, 185, 'pic-container', 2);
      path(sc, 'M200 145V180M215 145V180M230 145V180M245 145V180M260 145V180', 'pic-ribs', [[200, 145], [260, 180]]);
      accel(sc, 'a', [290, 175], [0, -1], FS.q(p.a, 'a'));
      return picture(sc);
    },
    fbd(p, v) {
      const sc = new Scene(200, 260, L('Forces on the container', 'Kräfte auf den Container'));
      const b = block(sc, [100, 130], 90, 45, '');
      force(sc, 'S', 'k', b.top, [0, -1], v.S, ['S'], [8, 4]);
      force(sc, 'G', 'g', [100, 130], [0, 1], p.M * G, ['G'], [8, 6]);
      acc(sc, 'a', [165, 130], [0, -1]);
      return diagram(sc);
    },
  };

  P.truck = {
    pic(p) {
      const sc = new Scene(360, 220, L('A crate on the platform of a truck', 'Eine Kiste auf der Ladefläche eines Lastwagens'));
      road(sc, 10, 350, 200);
      rect(sc, 40, 150, 230, 165, 'pic-truck', 2);
      poly(sc, [[232, 165], [232, 110], [272, 110], [292, 135], [292, 165]], 'pic-truck');
      poly(sc, [[244, 118], [270, 118], [284, 135], [244, 135]], 'pic-glass');
      wheel(sc, 80, 182, 17); wheel(sc, 120, 182, 17); wheel(sc, 262, 182, 17);
      rect(sc, 90, 115, 140, 150, 'pic-crate', 2);
      accel(sc, 'a', [300, 80], [1, 0], FS.q(p.a, 'a'), [0, -12]);
      return picture(sc);
    },
    fbd(p, v) {
      const sc = new Scene(240, 220, L('Forces on the crate', 'Kräfte auf die Kiste'));
      const b = block(sc, [110, 110], 60, 50, '');
      force(sc, 'G', 'g', [104, 110], [0, 1], p.m * G, ['G'], [6, 6]);
      force(sc, 'N', 'n', [116, b.bottom[1]], [0, -1], p.m * G, ['N'], [8, 4]);
      force(sc, 'R', 'r', [96, b.bottom[1]], [1, 0], v.R, ['R'], [-4, 16]);
      acc(sc, 'a', [160, 175], [1, 0]);
      return diagram(sc);
    },
  };

  P.braking = {
    pic(p) {
      const sc = new Scene(320, 200, L('A car braking hard', 'Ein Auto bremst stark'));
      road(sc, 10, 310, 170);
      car(sc, 90, 170, 140);
      path(sc, 'M40 150H80M30 160H80M50 140H80', 'pic-speed', [[30, 140], [80, 160]]);
      velo(sc, [200, 50], [1, 0], [0, -12]);
      accel(sc, 'a', [240, 78], [-1, 0], FS.q(v_a(p), 'a'), [-10, 0]);
      return picture(sc);
    },
    fbd(p, v) {
      const sc = new Scene(260, 200, L('Forces on the car', 'Kräfte auf das Auto'));
      const b = block(sc, [120, 100], 100, 50, '');
      force(sc, 'G', 'g', [114, 100], [0, 1], p.m * G, ['G'], [6, 6]);
      force(sc, 'N', 'n', [126, b.bottom[1]], [0, -1], p.m * G, ['N'], [8, 4]);
      force(sc, 'R', 'r', [100, b.bottom[1]], [-1, 0], v.R, ['R'], [-4, 16]);
      acc(sc, 'a', [215, 160], [-1, 0]);
      return diagram(sc);
    },
  };
  // the braking deceleration (as in realproblems.js: μ g)
  const ROAD_MU = { dry: 0.8, wet: 0.5, snow: 0.2 };
  const v_a = (p) => ROAD_MU[p.road] * G;

  P.tow = {
    pic(p) {
      const sc = new Scene(400, 200, L('A car towing another one', 'Ein Auto schleppt ein anderes ab'));
      road(sc, 10, 390, 170);
      car(sc, 20, 170, 130, 'pic-car alt');
      sc.line(150, 150, 220, 150, 'w rope');
      car(sc, 220, 170, 140);
      accel(sc, 'a', [300, 80], [1, 0], aSym, [0, -12]);
      return picture(sc);
    },
    fbd(p, v) {
      const r1 = p.mu * p.m1 * G, r2 = p.mu * p.m2 * G;
      const a = new Scene(260, 200, L('Forces on the towing car', 'Kräfte auf das schleppende Auto'));
      const b1 = block(a, [130, 100], 90, 45, L('towing', 'schleppend'));
      force(a, 'F', 's', b1.right, [1, 0], p.F, ['F'], [8, -6]);
      force(a, 'S1', 'k', b1.left, [-1, 0], v.S, ['S'], [-6, -8]);
      force(a, 'R1', 'r', [b1.left[0] + 10, b1.bottom[1]], [-1, 0], r1, ['R', 1], [-4, 16]);
      const b = new Scene(260, 200, L('Forces on the towed car', 'Kräfte auf das abgeschleppte Auto'));
      const b2 = block(b, [130, 100], 90, 45, L('towed', 'abgeschleppt'));
      force(b, 'S2', 'k', b2.right, [1, 0], v.S, ['S'], [8, -6]);
      force(b, 'R2', 'r', [b2.left[0] + 10, b2.bottom[1]], [-1, 0], r2, ['R', 2], [-4, 16]);
      return two(diagram(a), diagram(b)) + `<p class="note fig-note">${L('Weight and normal force balance; they are left out.', 'Gewichtskraft und Normalkraft heben sich auf; sie sind weggelassen.')}</p>`;
    },
  };

  P.train = {
    pic(p) {
      const sc = new Scene(460, 170, L('A locomotive pulling freight wagons', 'Eine Lokomotive zieht Güterwagen'));
      road(sc, 10, 450, 150);
      const wag = (x) => { rect(sc, x, 95, x + 80, 135, 'pic-wagon', 3); wheel(sc, x + 16, 141, 9); wheel(sc, x + 64, 141, 9); };
      wag(20); wag(110); sc.text(215, 125, '…', 'lbl', 'middle'); wag(240);
      path(sc, 'M100 125H110M190 125H200M230 125H240M320 125H332', 'pic-coupling', [[100, 125], [332, 125]]);
      rect(sc, 332, 85, 440, 135, 'pic-truck', 4);
      rect(sc, 400, 60, 440, 85, 'pic-truck', 2);
      wheel(sc, 352, 141, 9); wheel(sc, 380, 141, 9); wheel(sc, 420, 141, 9);
      accel(sc, 'a', [380, 35], [1, 0], aSym, [0, -12]);
      return picture(sc);
    },
    fbd(p, v) {
      const a = new Scene(300, 180, L('All wagons together', 'Alle Wagen zusammen'));
      const b1 = block(a, [140, 90], 160, 40, L(`${p.n} wagons`, `${p.n} Wagen`));
      force(a, 'K1', 'k', b1.right, [1, 0], v.K1, ['K', 1], [8, -6]);
      const b = new Scene(220, 180, L('The last wagon', 'Der letzte Wagen'));
      const b2 = block(b, [90, 90], 70, 40, L('last', 'letzter'));
      force(b, 'Kn', 'k', b2.right, [1, 0], v.Kn, ['K', p.n], [8, -6]);
      return two(diagram(a), diagram(b));
    },
  };

  P.skydiver = {
    pic() {
      const sc = new Scene(260, 300, L('A skydiver under her parachute', 'Eine Fallschirmspringerin am Fallschirm'));
      path(sc, 'M40 90Q130 -10 220 90Q175 72 130 78Q85 72 40 90Z', 'pic-canopy', [[40, 30], [220, 90]]);
      path(sc, 'M40 90L130 190M90 78L130 190M170 78L130 190M220 90L130 190', 'pic-lines', [[40, 78], [220, 190]]);
      person(sc, 130, 262, 1.3, true);
      return picture(sc);
    },
    fbd(p, v) {
      const a = new Scene(200, 260, L('Falling at constant speed', 'Fall mit konstanter Geschwindigkeit'));
      const b1 = block(a, [100, 130], 40, 70, '');
      force(a, 'D1', 'n', b1.top, [0, -1], v.D, ['D'], [8, 4]);
      force(a, 'G1', 'g', [100, 130], [0, 1], p.m * G, ['G'], [8, 6]);
      const b = new Scene(200, 260, L('The parachute opens', 'Der Fallschirm öffnet sich'));
      const b2 = block(b, [100, 150], 40, 70, '');
      force(b, 'D2', 'n', b2.top, [0, -1], p.k * p.m * G, ['D'], [8, 4]);
      force(b, 'G2', 'g', [100, 150], [0, 1], p.m * G, ['G'], [8, 6]);
      acc(b, 'a', [150, 150], [0, -1]);
      return two(diagram(a), diagram(b));
    },
  };

  P.rocket = {
    pic(p) {
      const sc = new Scene(220, 320, L('A rocket lifting off', 'Eine Rakete beim Start'));
      road(sc, 10, 210, 300);
      poly(sc, [[110, 20], [130, 60], [130, 220], [90, 220], [90, 60]], 'pic-rocket');
      poly(sc, [[90, 180], [70, 230], [90, 220]], 'pic-fin'); poly(sc, [[130, 180], [150, 230], [130, 220]], 'pic-fin');
      circle(sc, 110, 90, 10, 'pic-glass');
      poly(sc, [[95, 222], [125, 222], [118, 262], [110, 290], [102, 262]], 'pic-flame');
      accel(sc, 'a', [175, 130], [0, -1], FS.q(p.a, 'a'));
      return picture(sc);
    },
    fbd(p, v) {
      const a = new Scene(200, 280, L('Forces on the rocket', 'Kräfte auf die Rakete'));
      const b1 = block(a, [100, 140], 40, 110, '');
      force(a, 'Th', 's', b1.bottom, [0, -1], p.Th, ['Th'], [-10, 30]);
      force(a, 'G1', 'g', [100, 140], [0, 1], p.M * G, ['G'], [8, 6]);
      acc(a, 'a1', [150, 140], [0, -1]);
      const b = new Scene(200, 280, L('Forces on the astronaut', 'Kräfte auf die Astronautin'));
      const b2 = block(b, [100, 140], 40, 70, '');
      force(b, 'N', 'n', b2.bottom, [0, -1], v.N, ['N'], [-10, 26]);
      force(b, 'G2', 'g', [100, 140], [0, 1], p.ma * G, ['G'], [8, 6]);
      acc(b, 'a2', [150, 140], [0, -1]);
      return two(diagram(a), diagram(b));
    },
  };

  const onSlope = (sc, p, len, draw) => {
    const s = p.h / p.len, c = p.run / p.len, sl = slope(sc, [30, 250], len, s, c);
    draw(sl, s, c);
    return sl;
  };

  P.parking = {
    pic(p) {
      const sc = new Scene(380, 280, L('A car parked on a ramp', 'Ein Auto auf einer Rampe'));
      onSlope(sc, p, 340, (sl, s, c) => {
        const at = sl.at, w = 120;
        const q = (d, h) => at(130 + d * w, h * w);
        poly(sc, [q(0, 0.1), q(0, 0.27), q(0.22, 0.29), q(0.36, 0.43), q(0.72, 0.43), q(0.86, 0.29), q(1, 0.26), q(1, 0.1)], 'pic-car');
        poly(sc, [q(0.4, 0.29), q(0.42, 0.39), q(0.54, 0.39), q(0.54, 0.29)], 'pic-glass');
        wheel(sc, ...q(0.2, 0.09), 0.09 * w); wheel(sc, ...q(0.8, 0.09), 0.09 * w);
      });
      return picture(sc);
    },
    fbd(p, v) {
      const sc = new Scene(380, 300, L('Forces on the car', 'Kräfte auf das Auto'));
      onSlope(sc, p, 340, (sl) => {
        const at = sc.box(sl.at(120, 0), sl.u, sl.n, 90, 40, ''), C = at(45, 20);
        force(sc, 'G', 'g', C, [0, 1], p.m * G, ['G'], [8, 6]);
        force(sc, 'N', 'n', at(55, 0), sl.n, v.N, ['N'], [8, -4]);
        force(sc, 'R', 'r', at(20, 0), sl.u, v.R, ['R'], [-6, -10]);
      });
      return diagram(sc);
    },
  };

  P.skier = {
    pic(p) {
      const sc = new Scene(380, 280, L('A skier going down a piste', 'Ein Skifahrer auf der Piste'));
      onSlope(sc, p, 340, (sl) => {
        const foot = sl.at(170, 0);
        sc.line(...sl.at(140, 2), ...sl.at(205, 2), 'pic-ski');
        person(sc, foot[0], foot[1] - 3, 1.2);
        sc.line(foot[0] - 14, foot[1] - 34, foot[0] - 22, foot[1], 'w');
        sc.line(foot[0] + 14, foot[1] - 34, foot[0] + 4, foot[1] + 4, 'w');
      });
      return picture(sc);
    },
    fbd(p, v) {
      const sc = new Scene(380, 300, L('Forces on the skier', 'Kräfte auf den Skifahrer'));
      onSlope(sc, p, 340, (sl) => {
        const at = sc.box(sl.at(140, 0), sl.u, sl.n, 50, 60, ''), C = at(25, 30);
        force(sc, 'G', 'g', C, [0, 1], p.m * G, ['G'], [8, 6]);
        force(sc, 'N', 'n', at(30, 0), sl.n, v.N, ['N'], [8, -4]);
        force(sc, 'R', 'r', at(10, 0), sl.u, p.mu * v.N, ['R'], [-6, -10]);
        sc.accel({ id: 'a', at: at(25, 75), dir: [-sl.u[0], -sl.u[1]], sym: ['a'], lab: [-8, -8] });
      });
      return diagram(sc);
    },
  };

  P.sled = {
    pic() {
      const sc = new Scene(380, 220, L('Pulling a sled with a child', 'Einen Schlitten mit einem Kind ziehen'));
      road(sc, 10, 370, 190);
      path(sc, 'M40 190H150Q165 190 165 178', 'pic-runner', [[40, 178], [165, 190]]);
      rect(sc, 45, 165, 150, 178, 'pic-crate', 2);
      circle(sc, 95, 128, 8, 'pic-head');
      path(sc, 'M95 136V160M95 160L120 165M95 145L110 160', 'pic-limbs', [[95, 136], [120, 165]]);
      // the rope rises 0.6 of its length: from the sled's front to the hand of the person pulling
      const E = [150 + 0.8 * 100, 172 - 0.6 * 100];
      sc.line(150, 172, ...E, 'w rope');
      person(sc, 258, 190, 1.5);
      path(sc, `M258 124L${f(E[0])} ${f(E[1])}`, 'pic-limbs', [[E[0], E[1]], [258, 124]]);
      return picture(sc);
    },
    fbd(p, v) {
      const sc = new Scene(280, 230, L('Forces on the sled', 'Kräfte auf den Schlitten'));
      const b = block(sc, [120, 120], 90, 40, '');
      force(sc, 'G', 'g', [114, 120], [0, 1], p.m * G, ['G'], [6, 6]);
      force(sc, 'N', 'n', [126, b.bottom[1]], [0, -1], v.N, ['N'], [8, 4]);
      force(sc, 'R', 'r', [90, b.bottom[1]], [-1, 0], p.mu * v.N, ['R'], [-4, 16]);
      force(sc, 'F', 's', b.right, [0.8, -0.6], v.F, ['F'], [8, -4]);
      return diagram(sc);
    },
  };

  P.counterweight = {
    pic(p) {
      const sc = new Scene(260, 320, L('A lift cabin and its counterweight', 'Eine Liftkabine und ihr Gegengewicht'));
      rect(sc, 20, 20, 240, 310, 'pic-shaft', 2);
      sc.pulley(130, 50, 24);
      sc.line(106, 50, 106, 160, 'w rope'); sc.line(154, 50, 154, 110, 'w rope');
      rect(sc, 50, 160, 140, 260, 'pic-cabin', 3);
      person(sc, 95, 256, 1.2);
      rect(sc, 140, 110, 168, 170, 'pic-weight', 2);
      accel(sc, 'aK', [36, 200], [0, 1], aSym, [-8, 0]);
      accel(sc, 'aG', [205, 160], [0, -1], aSym, [8, 0]);
      void p;
      return picture(sc);
    },
    fbd(p, v) {
      const a = new Scene(200, 260, L('Forces on the cabin', 'Kräfte auf die Kabine'));
      const b1 = block(a, [100, 130], 60, 70, '');
      force(a, 'S1', 'k', b1.top, [0, -1], v.S, ['S'], [8, 4]);
      force(a, 'G1', 'g', [100, 130], [0, 1], p.mC * G, ['G', 'K'], [8, 6]);
      acc(a, 'a1', [155, 130], [0, 1]);
      const b = new Scene(200, 260, L('Forces on the counterweight', 'Kräfte auf das Gegengewicht'));
      const b2 = block(b, [100, 130], 34, 60, '');
      force(b, 'S2', 'k', b2.top, [0, -1], v.S, ['S'], [8, 4]);
      force(b, 'G2', 'g', [100, 130], [0, 1], p.mG * G, ['G', 'G'], [8, 6]);
      acc(b, 'a2', [145, 130], [0, -1]);
      return two(diagram(a), diagram(b));
    },
  };

  // ================================================================ the pictures, drawn with care
  // Backgrounds with soft gradients, filled figures, vehicles with wheels and rims, and shadows.
  // Colours come from CSS variables (style.css), so that dark mode can adjust them.
  const DEFS = `<defs>
    <linearGradient id="rp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--rp-sky1)"/><stop offset="1" style="stop-color:var(--rp-sky2)"/></linearGradient>
    <linearGradient id="rp-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--rp-metal1)"/><stop offset="0.5" style="stop-color:var(--rp-metal2)"/><stop offset="1" style="stop-color:var(--rp-metal1)"/></linearGradient>
    <linearGradient id="rp-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.15"/></linearGradient>
    <linearGradient id="rp-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--rp-snow1)"/><stop offset="1" style="stop-color:var(--rp-snow2)"/></linearGradient>
    <radialGradient id="rp-flame" cx="0.5" cy="0.2" r="0.8"><stop offset="0" stop-color="#fff6c2"/><stop offset="0.45" stop-color="#ffc23d"/><stop offset="1" stop-color="#e8542c"/></radialGradient>
  </defs>`;
  const g = (sc, svg, pts) => raw(sc, svg, pts);
  const bg = (sc, x0, y0, x1, y1, fill = 'url(#rp-sky)') => { g(sc, DEFS, []); rect(sc, x0, y0, x1, y1, 'rp-bg', 10); sc.parts[sc.parts.length - 1] = sc.parts[sc.parts.length - 1].replace('class="rp-bg"', `class="rp-bg" fill="${fill}"`); };
  // ground from x0 to x1 below y: asphalt with a dashed line, concrete, snow or grass
  function ground(sc, x0, x1, y, kind = 'asphalt', depth = 26) {
    rect(sc, x0, y, x1, y + depth, `rp-ground ${kind}`, 0);
    if (kind === 'asphalt') g(sc, `<path class="rp-lane" d="M${f(x0 + 10)} ${f(y + depth / 2)}H${f(x1)}"/>`, []);
    g(sc, `<path class="rp-edge" d="M${f(x0)} ${f(y)}H${f(x1)}"/>`, []);
  }
  const shadow = (sc, cx, y, rx) => g(sc, `<ellipse class="rp-shadow" cx="${f(cx)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.12)}"/>`, [[cx - rx, y], [cx + rx, y]]);
  function rim(sc, x, y, r) {
    circle(sc, x, y, r, 'rp-tyre');
    circle(sc, x, y, r * 0.58, 'rp-rim');
    circle(sc, x, y, r * 0.18, 'rp-hub');
  }
  // A person standing with the feet at (x, y), about 76·s tall. o.hands: the hands' points
  // ([left, right]), o.knee: how far the knees bend forward (px), o.lean: the upper body leans
  // forward by this (px), o.shirt: a colour class, o.dir: 1 facing right, -1 left.
  function figure(sc, x, y, s = 1, o = {}) {
    const k = (v) => v * s, lean = (o.lean || 0) * s, kn = (o.knee || 0) * s, d = o.dir || 1;
    const hip = [x + d * lean * 0.3, y - k(32)], sh = [x + d * lean, y - k(56)];
    const legs = [-1, 1].map((side) => {
      const foot = [x + side * k(5), y], knee = [(hip[0] + foot[0]) / 2 + d * kn, (hip[1] + foot[1]) / 2];
      return `M${f(hip[0] + side * k(3))} ${f(hip[1])}L${f(knee[0])} ${f(knee[1])}L${f(foot[0])} ${f(foot[1] - k(2))}`;
    }).join('');
    g(sc, `<path class="rp-legs" style="stroke-width:${f(k(6.5))}" d="${legs}"/>`, [[x - k(10), hip[1]], [x + k(10), y]]);
    [-1, 1].forEach((side) => g(sc, `<ellipse class="rp-shoe" cx="${f(x + side * k(5) + d * k(3))}" cy="${f(y - k(1.5))}" rx="${f(k(5))}" ry="${f(k(2.5))}"/>`, []));
    const hands = o.hands || [[sh[0] - k(9), sh[1] + k(22)], [sh[0] + k(9), sh[1] + k(22)]];
    const arm = (side, hand) => `M${f(sh[0] + side * k(6))} ${f(sh[1] + k(3))}L${f(hand[0])} ${f(hand[1])}`;
    g(sc, `<path class="rp-arm ${o.shirt || ''}" style="stroke-width:${f(k(5.5))}" d="${arm(-1, hands[0])}"/>`, [hands[0]]);
    g(sc, `<path class="rp-torso ${o.shirt || ''}" d="M${f(hip[0] - k(8))} ${f(hip[1] + k(2))}L${f(sh[0] - k(9))} ${f(sh[1] + k(4))}Q${f(sh[0])} ${f(sh[1] - k(3))} ${f(sh[0] + k(9))} ${f(sh[1] + k(4))}L${f(hip[0] + k(8))} ${f(hip[1] + k(2))}Z"/>`, [[sh[0] - k(10), sh[1]], [hip[0] + k(10), hip[1]]]);
    g(sc, `<path class="rp-arm ${o.shirt || ''}" style="stroke-width:${f(k(5.5))}" d="${arm(1, hands[1])}"/>`, [hands[1]]);
    hands.forEach((h) => circle(sc, h[0], h[1], k(2.8), 'rp-skin'));
    const head = [sh[0] + d * k(1), sh[1] - k(9)];
    circle(sc, head[0], head[1], k(7.5), 'rp-skin');
    g(sc, `<path class="rp-hair" d="M${f(head[0] - k(7.5))} ${f(head[1] - k(0.5))}A${f(k(7.5))} ${f(k(7.5))} 0 0 1 ${f(head[0] + k(7.5))} ${f(head[1] - k(0.5))}Q${f(head[0])} ${f(head[1] - k(4))} ${f(head[0] - k(7.5))} ${f(head[1] - k(0.5))}Z"/>`, [[head[0] - k(8), head[1] - k(8)]]);
    return { sh, hip, head };
  }
  // a car facing right with its wheels on the road at y; as an SVG string (it can be turned)
  function carSvg(x0, y, w, cls) {
    const p = (a, b) => `${f(x0 + a * w)} ${f(y - b * w)}`;
    const body = `M${p(0.02, 0.1)}L${p(0.02, 0.24)}Q${p(0.02, 0.29)} ${p(0.1, 0.3)}L${p(0.26, 0.31)}L${p(0.37, 0.44)}Q${p(0.4, 0.46)} ${p(0.45, 0.46)}L${p(0.68, 0.46)}Q${p(0.73, 0.46)} ${p(0.76, 0.43)}L${p(0.86, 0.31)}L${p(0.95, 0.29)}Q${p(1, 0.27)} ${p(1, 0.2)}L${p(1, 0.1)}Z`;
    const win1 = `M${p(0.39, 0.31)}L${p(0.43, 0.42)}L${p(0.555, 0.42)}L${p(0.555, 0.31)}Z`, win2 = `M${p(0.58, 0.31)}L${p(0.58, 0.42)}L${p(0.69, 0.42)}L${p(0.79, 0.31)}Z`;
    const wheel = (a) => { const cx = x0 + a * w, cy = y - 0.085 * w, r = 0.085 * w; return `<circle class="rp-tyre" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/><circle class="rp-rim" cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.58)}"/><circle class="rp-hub" cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.18)}"/>`; };
    return `<ellipse class="rp-shadow" cx="${f(x0 + w / 2)}" cy="${f(y)}" rx="${f(w * 0.52)}" ry="${f(w * 0.05)}"/>` +
      `<path class="rp-car ${cls}" d="${body}"/><path class="rp-shine" d="${body}"/>` +
      `<path class="rp-glass" d="${win1}"/><path class="rp-glass" d="${win2}"/>` +
      `<path class="rp-line" d="M${p(0.565, 0.31)}L${p(0.565, 0.12)}M${p(0.3, 0.22)}H${f(x0 + 0.38 * w)}M${p(0.62, 0.22)}H${f(x0 + 0.7 * w)}"/>` +
      `<rect class="rp-light" x="${f(x0 + 0.95 * w)}" y="${f(y - 0.25 * w)}" width="${f(0.04 * w)}" height="${f(0.04 * w)}" rx="1"/>` +
      `<rect class="rp-tail" x="${f(x0 + 0.02 * w)}" y="${f(y - 0.25 * w)}" width="${f(0.03 * w)}" height="${f(0.04 * w)}" rx="1"/>` +
      wheel(0.2) + wheel(0.8);
  }
  const carAt = (sc, x0, y, w, cls = 'red') => g(sc, carSvg(x0, y, w, cls), [[x0, y - 0.47 * w], [x0 + w, y + 0.06 * w]]);
  // a lattice: two rails from a to b, width wd (px), with zigzag struts
  function lattice(sc, a, b, wd, cls = 'rp-steel') {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], n = [-u[1] * wd / 2, u[0] * wd / 2];
    const P1 = (t, side) => [a[0] + t * u[0] + side * n[0], a[1] + t * u[1] + side * n[1]];
    let d = `M${P1(0, -1).map(f).join(' ')}L${P1(len, -1).map(f).join(' ')}M${P1(0, 1).map(f).join(' ')}L${P1(len, 1).map(f).join(' ')}M${P1(0, -1).map(f).join(' ')}`;
    for (let t = wd, side = 1; t <= len; t += wd, side = -side) d += `L${P1(t, side).map(f).join(' ')}`;
    g(sc, `<path class="${cls}" d="${d}"/>`, [P1(0, -1), P1(len, 1), P1(0, 1), P1(len, -1)]);
  }

  P.scale.pic = (p) => {
    const sc = new Scene(300, 300, L('A person on a scale in a lift', 'Eine Person auf einer Waage im Lift'));
    bg(sc, 10, 0, 290, 285, 'url(#rp-metal)');
    rect(sc, 30, 0, 210, 285, 'rp-shaft', 0);
    g(sc, '<path class="rp-rope" d="M120 0V36"/>', []);
    rect(sc, 40, 36, 200, 268, 'rp-cabin', 6);
    rect(sc, 50, 46, 190, 258, 'rp-cabin-in', 3);
    g(sc, '<path class="rp-rail" d="M58 170H182"/>', []);
    rect(sc, 40, 258, 200, 268, 'rp-floor', 0);
    rect(sc, 92, 250, 148, 258, 'rp-scale', 3);
    rect(sc, 112, 252, 128, 256, 'rp-display', 1);
    figure(sc, 120, 250, 1.95, { shirt: 'blue' });
    velo(sc, [238, 120], [0, movesUp(p) ? -1 : 1]);
    accel(sc, 'a', [266, 120], [0, up(p) ? -1 : 1], FS.q(p.a, 'a'));
    return picture(sc);
  };

  P.crane.pic = (p) => {
    const sc = new Scene(340, 300, L('A harbour crane lifting a container', 'Ein Hafenkran hebt einen Container'));
    bg(sc, 0, 0, 340, 300);
    rect(sc, 0, 262, 340, 300, 'rp-water', 0);
    ground(sc, 0, 230, 262, 'concrete', 38);
    lattice(sc, [70, 262], [70, 40], 16);
    lattice(sc, [20, 44], [300, 44], 12);
    g(sc, '<path class="rp-steel" d="M70 18L20 44M70 18L300 44M70 18V40"/>', [[20, 18], [300, 44]]);
    rect(sc, 22, 50, 50, 78, 'rp-weight', 2);
    rect(sc, 80, 52, 104, 72, 'rp-glassbox', 2);
    rect(sc, 222, 50, 242, 58, 'rp-weight', 1);
    g(sc, '<path class="rp-rope" d="M232 58V128"/><path class="rp-hook" d="M226 128H238M232 128V134"/>', []);
    rect(sc, 182, 134, 282, 184, 'rp-container', 2);
    g(sc, '<path class="rp-ribs" d="M194 138V180M206 138V180M218 138V180M230 138V180M242 138V180M254 138V180M266 138V180"/>', []);
    accel(sc, 'a', [305, 178], [0, -1], FS.q(p.a, 'a'));
    return picture(sc);
  };

  P.truck.pic = (p) => {
    const sc = new Scene(380, 230, L('A crate on the platform of a truck', 'Eine Kiste auf der Ladefläche eines Lastwagens'));
    bg(sc, 0, 0, 380, 228);
    ground(sc, 0, 380, 200, 'asphalt', 28);
    shadow(sc, 170, 200, 140);
    rect(sc, 36, 150, 236, 166, 'rp-truck', 3);
    rect(sc, 36, 166, 290, 176, 'rp-chassis', 2);
    g(sc, '<path class="rp-truck" d="M238 166V112Q238 104 246 104H272Q282 104 288 112L300 136Q304 142 304 150V166Z"/><path class="rp-shine" d="M238 166V112Q238 104 246 104H272Q282 104 288 112L300 136Q304 142 304 150V166Z"/>', [[238, 104], [304, 176]]);
    g(sc, '<path class="rp-glass" d="M248 112H272Q278 112 282 118L292 136H248Z"/>', []);
    rect(sc, 296, 150, 304, 156, 'rp-light', 1);
    rim(sc, 76, 182, 17); rim(sc, 116, 182, 17); rim(sc, 268, 182, 17);
    rect(sc, 86, 112, 140, 150, 'rp-crate', 2);
    g(sc, '<path class="rp-planks" d="M86 125H140M86 137H140M90 112L136 150"/>', []);
    accel(sc, 'a', [318, 74], [1, 0], FS.q(p.a, 'a'), [0, -12]);
    return picture(sc);
  };

  P.braking.pic = (p) => {
    const sc = new Scene(340, 210, L('A car braking hard', 'Ein Auto bremst stark'));
    bg(sc, 0, 0, 340, 208);
    ground(sc, 0, 340, 180, 'asphalt', 28);
    carAt(sc, 100, 180, 150, 'red');
    g(sc, '<path class="rp-speed" d="M30 140H86M44 152H90M24 164H84"/>', []);
    velo(sc, [210, 46], [1, 0], [0, -12]);
    accel(sc, 'a', [252, 74], [-1, 0], FS.q(v_a(p), 'a'), [-10, 0]);
    return picture(sc);
  };

  P.tow.pic = () => {
    const sc = new Scene(420, 200, L('A car towing another one', 'Ein Auto schleppt ein anderes ab'));
    bg(sc, 0, 0, 420, 198);
    ground(sc, 0, 420, 170, 'asphalt', 28);
    carAt(sc, 24, 170, 140, 'blue');
    g(sc, '<path class="rp-rope" d="M164 152L232 152"/><path class="rp-flag" d="M196 152L192 140L204 144Z"/>', [[164, 140], [232, 152]]);
    carAt(sc, 232, 170, 150, 'red');
    accel(sc, 'a', [320, 70], [1, 0], aSym, [0, -12]);
    return picture(sc);
  };

  P.train.pic = () => {
    const sc = new Scene(480, 190, L('A locomotive pulling freight wagons', 'Eine Lokomotive zieht Güterwagen'));
    bg(sc, 0, 0, 480, 188);
    ground(sc, 0, 480, 158, 'gravel', 30);
    let sleepers = '';
    for (let x = 6; x < 480; x += 14) sleepers += `M${x} 160h8`;
    g(sc, `<path class="rp-sleeper" d="${sleepers}"/><path class="rp-railtop" d="M0 158H480"/>`, []);
    const wag = (x) => {
      rect(sc, x, 94, x + 84, 138, 'rp-wagon', 3);
      let ribs = '';
      for (let k = 1; k < 7; k++) ribs += `M${x + k * 12} 98V134`;
      g(sc, `<path class="rp-ribs" d="${ribs}"/>`, []);
      rect(sc, x + 4, 138, x + 80, 144, 'rp-chassis', 1);
      rim(sc, x + 18, 149, 9); rim(sc, x + 66, 149, 9);
    };
    wag(14); wag(110); sc.text(222, 126, '…', 'lbl', 'middle'); wag(240);
    g(sc, '<path class="rp-coupling" d="M98 140H110M194 140H206M236 140H240M324 140H336"/>', []);
    g(sc, '<path class="rp-loco" d="M336 144V92Q336 84 344 84H398V62Q398 56 404 56H446Q454 56 456 64L462 92Q464 100 464 108V144Z"/><path class="rp-shine" d="M336 144V92Q336 84 344 84H398V62Q398 56 404 56H446Q454 56 456 64L462 92Q464 100 464 108V144Z"/>', [[336, 56], [464, 150]]);
    rect(sc, 408, 64, 448, 84, 'rp-glass', 2);
    g(sc, '<path class="rp-stripe" d="M336 118H464"/>', []);
    rim(sc, 356, 150, 9); rim(sc, 386, 150, 9); rim(sc, 416, 150, 9); rim(sc, 446, 150, 9);
    accel(sc, 'a', [400, 30], [1, 0], aSym, [0, -12]);
    return picture(sc);
  };

  P.skydiver.pic = () => {
    const sc = new Scene(280, 320, L('A skydiver under her parachute', 'Eine Fallschirmspringerin am Fallschirm'));
    bg(sc, 0, 0, 280, 318);
    g(sc, '<path class="rp-cloud" d="M20 270q10-18 30-10q14-16 32 0q20-4 18 14H20Z"/><path class="rp-cloud" d="M190 120q8-14 24-8q12-12 26 0q16-2 14 12H190Z"/>', []);
    const canopy = 'M44 96Q140 -4 236 96Q212 86 188 92Q164 82 140 88Q116 82 92 92Q68 86 44 96Z';
    g(sc, `<path class="rp-canopy" d="${canopy}"/><path class="rp-shine" d="${canopy}"/><path class="rp-cells" d="M92 92Q100 40 140 22M188 92Q180 40 140 22M140 88V22"/>`, [[44, 20], [236, 96]]);
    g(sc, '<path class="rp-lines" d="M44 96L130 196M92 92L134 196M188 92L146 196M236 96L150 196"/>', []);
    figure(sc, 140, 290, 1.4, { shirt: 'orange', hands: [[128, 196], [152, 196]] });
    return picture(sc);
  };

  P.rocket.pic = (p) => {
    const sc = new Scene(260, 340, L('A rocket lifting off', 'Eine Rakete beim Start'));
    bg(sc, 0, 0, 260, 338);
    ground(sc, 0, 260, 306, 'concrete', 32);
    lattice(sc, [40, 306], [40, 70], 14);
    g(sc, '<path class="rp-steel" d="M47 120H96M47 200H96"/>', []);
    g(sc, '<path class="rp-smoke" d="M70 306q-20-30 10-36q6-22 30-12q20-16 40 2q26-6 30 18q28 6 14 28Z"/>', [[50, 250], [206, 306]]);
    const body = 'M118 20Q130 32 136 60V230H100V60Q106 32 118 20Z';
    g(sc, `<path class="rp-rocket" d="${body}"/><path class="rp-shine" d="${body}"/>`, [[100, 20], [136, 230]]);
    g(sc, '<path class="rp-fin" d="M100 186L80 238H100Z"/><path class="rp-fin" d="M136 186L156 238H136Z"/><path class="rp-stripe red" d="M100 90H136M100 96H136"/>', [[80, 186], [156, 238]]);
    circle(sc, 118, 120, 9, 'rp-glass');
    g(sc, '<path class="rp-nozzle" d="M106 230H130L134 240H102Z"/>', []);
    g(sc, '<path fill="url(#rp-flame)" d="M104 240H132Q136 266 118 298Q100 266 104 240Z"/>', [[100, 240], [136, 298]]);
    accel(sc, 'a', [196, 150], [0, -1], FS.q(p.a, 'a'));
    return picture(sc);
  };

  // a slope with a surface (concrete or snow) and the picture's background
  function slopeScene(sc, p, len, kind) {
    const s = p.h / p.len, c = p.run / p.len, o = [30, 250], top = [o[0] + len * c, o[1] - len * s];
    bg(sc, 0, Math.min(top[1] - 70, 40), o[0] + len * c + 30, 276);
    g(sc, `<path class="rp-slope ${kind}" d="M${f(o[0] - 30)} ${f(o[1])}L${f(o[0])} ${f(o[1])}L${f(top[0])} ${f(top[1])}L${f(top[0] + 30)} ${f(top[1])}L${f(top[0] + 30)} 276L${f(o[0] - 30)} 276Z"/>`, [[o[0] - 30, top[1]], [top[0] + 30, 276]]);
    const u = [c, -s], n = [-s, -c];
    return { s, c, u, n, at: (d, h) => [o[0] + d * u[0] + h * n[0], o[1] + d * u[1] + h * n[1]], angle: (Math.atan2(s, c) * 180) / Math.PI };
  }

  P.parking.pic = (p) => {
    const sc = new Scene(400, 290, L('A car parked on a ramp', 'Ein Auto auf einer Rampe'));
    const sl = slopeScene(sc, p, 340, 'concrete');
    const base = sl.at(110, 0), w = 140;
    g(sc, `<g transform="rotate(${f(-sl.angle)} ${f(base[0])} ${f(base[1])})">${carSvg(base[0], base[1], w, 'red')}</g>`, [[base[0], base[1] - 80], [base[0] + w * sl.c + 10, base[1] - w * sl.s - 70]]);
    return picture(sc);
  };

  P.skier.pic = (p) => {
    const sc = new Scene(400, 290, L('A skier going down a piste', 'Ein Skifahrer auf der Piste'));
    const sl = slopeScene(sc, p, 340, 'snow');
    // fir trees in the background
    const tree = (x, y, h) => g(sc, `<path class="rp-tree" d="M${f(x)} ${f(y - h)}L${f(x + h * 0.32)} ${f(y)}H${f(x - h * 0.32)}Z"/><path class="rp-trunk" d="M${f(x)} ${f(y)}V${f(y + h * 0.12)}"/>`, [[x - h * 0.32, y - h], [x + h * 0.32, y + h * 0.12]]);
    tree(...sl.at(290, 8), 46); tree(...sl.at(250, 8), 36);
    const foot = sl.at(150, 2);
    const ski = [sl.at(118, 2), sl.at(196, 2)];
    g(sc, `<path class="rp-ski" d="M${ski[0].map(f).join(' ')}L${ski[1].map(f).join(' ')}"/>`, ski);
    // facing down the slope (to the left), knees bent, poles behind
    const h = figure(sc, foot[0], foot[1] - 3, 1.25, { shirt: 'red', knee: 7, lean: 5, dir: -1, hands: [[foot[0] - 18, foot[1] - 36], [foot[0] + 4, foot[1] - 36]] });
    g(sc, `<path class="rp-pole" d="M${f(foot[0] - 18)} ${f(foot[1] - 36)}L${f(foot[0] + 4)} ${f(foot[1] + 6)}M${f(foot[0] + 4)} ${f(foot[1] - 36)}L${f(foot[0] + 24)} ${f(foot[1] - 4)}"/>`, []);
    void h;
    return picture(sc);
  };

  P.sled.pic = () => {
    const sc = new Scene(400, 230, L('Pulling a sled with a child', 'Einen Schlitten mit einem Kind ziehen'));
    bg(sc, 0, 0, 400, 228);
    rect(sc, 0, 190, 400, 228, 'rp-ground snow', 0);
    const tree = (x, y, h) => g(sc, `<path class="rp-tree" d="M${f(x)} ${f(y - h)}L${f(x + h * 0.32)} ${f(y)}H${f(x - h * 0.32)}Z"/>`, [[x - h * 0.32, y - h], [x + h * 0.32, y]]);
    tree(340, 190, 60); tree(370, 190, 44); tree(30, 190, 50);
    g(sc, '<path class="rp-runner" d="M44 190H150Q166 190 166 176M60 190V176M134 190V176"/>', [[44, 176], [166, 190]]);
    rect(sc, 46, 166, 152, 178, 'rp-crate', 3);
    // the child sitting: legs forward on the sled
    g(sc, '<path class="rp-legs" style="stroke-width:6" d="M92 160L122 162L126 164"/>', []);
    g(sc, '<path class="rp-torso green" d="M84 164L86 136Q94 130 102 136L104 164Z"/>', []);
    circle(sc, 94, 124, 8, 'rp-skin');
    g(sc, '<path class="rp-hat" d="M86 122Q94 108 102 122Z"/><circle class="rp-hat" cx="94" cy="110" r="3"/>', []);
    // the rope rises 0.6 of its length: from the sled's front to the hand of the person pulling
    const E = [150 + 0.8 * 100, 172 - 0.6 * 100];
    g(sc, `<path class="rp-rope" d="M150 172L${f(E[0])} ${f(E[1])}"/>`, []);
    figure(sc, 262, 190, 1.55, { shirt: 'blue', dir: 1, lean: -3, hands: [E, [E[0] + 6, E[1] + 8]] });
    return picture(sc);
  };

  P.counterweight.pic = () => {
    const sc = new Scene(260, 330, L('A lift cabin and its counterweight', 'Eine Liftkabine und ihr Gegengewicht'));
    bg(sc, 10, 0, 250, 326, 'url(#rp-metal)');
    rect(sc, 20, 10, 240, 320, 'rp-shaft', 2);
    g(sc, '<path class="rp-rail" d="M46 70V320M214 70V320"/>', []);
    rect(sc, 96, 14, 164, 30, 'rp-weight', 2);
    sc.pulley(130, 50, 24);
    g(sc, '<path class="rp-rope" d="M106 50V160M154 50V110"/>', []);
    rect(sc, 50, 160, 140, 268, 'rp-cabin', 5);
    rect(sc, 58, 168, 132, 260, 'rp-cabin-in', 3);
    figure(sc, 95, 258, 1.15, { shirt: 'blue' });
    rect(sc, 142, 110, 170, 176, 'rp-weight', 2);
    accel(sc, 'aK', [36, 214], [0, 1], aSym, [-8, 0]);
    accel(sc, 'aG', [205, 160], [0, -1], aSym, [8, 0]);
    return picture(sc);
  };

  root.RealPictures = P;
  if (typeof module !== 'undefined') module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
