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

  root.RealPictures = P;
  if (typeof module !== 'undefined') module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
