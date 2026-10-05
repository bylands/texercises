// Animations for the tutor: the body moves through the situation, from state ① to the last one,
// while an energy bar chart beside it shows how the energy is shared at every moment; the
// dashed line, the total energy, stays where it is. The motion pauses at each state, whose label
// lights up, and runs as fast as the body moves (slow near rest, fast where its kinetic energy is
// large), with a lower limit so that it never stalls.
// For each situation, MOTION[id](p) gives { states, pos(s), energy(s), draw(fig, s, state) }:
// s runs from 0 to 1 along the motion, states are the values of s of the states ①②③, pos(s) is
// where the body is drawn (px), energy(s) its energies { pot, kin, el } (J; as in states() of
// scenarios.js), and draw() draws the scene with the body at s, state the label to light up
// (or -1).
//   Motion.create(ex)    { duration, frame(t) → { svg, state }, markup(key) } for an exercise
//   Motion.get(key)      an animation created before, by its key (for the app's player)
(function (root) {
  'use strict';

  const EC = root.EC, { Fig } = root.Draw, H$ = root.Scenarios.helpers;
  const { R, ball, groundAt, ceilingAt, zeroLine, track, tangentAt, heightAt, DIRS } = H$;
  const G = EC.G;
  const sq = (x) => x * x;
  const fval = ([n, d]) => n / d;
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------------------------------------------------------------- drawing helpers
  // where the body was or will be in a state: a faint dashed outline and the state's label
  const ghostBall = (fig, c, i, lit, dx = -R - 16) => {
    fig.circle(c[0], c[1], R, 'ghost');
    fig.text(c[0] + dx, c[1] + 6, EC.CIRCLED[i], `lbl state${lit ? ' hl' : ''}`, 'middle');
  };
  const ghostRect = (fig, x, y, w, h, i, lit, lx, ly) => {
    fig.rect(x, y, w, h, 'ghost');
    fig.text(lx, ly, EC.CIRCLED[i], `lbl state${lit ? ' hl' : ''}`, 'middle');
  };
  // the velocity: an arrow from the body along the motion, as long as the speed demands
  function velocity(fig, from, dir, v, vmax, max = 46) {
    const len = (max * v) / (vmax || 1), n = Math.hypot(...dir);
    if (len < 7 || !n) return;
    const u = [dir[0] / n, dir[1] / n];
    fig.arrow(from[0] + u[0] * (R + 3), from[1] + u[1] * (R + 3), from[0] + u[0] * (R + 3 + len), from[1] + u[1] * (R + 3 + len), 'vel');
  }

  // A body moving up or down along a vertical line: heights in metres hgt(s), drawn 150 px for
  // the highest point top; total the energy (J, m = 1 kg).
  function vertical(p, { top, hgt, states }) {
    const sc = 150 / top, total = G * top;
    const pos = (s) => [0, -hgt(s) * sc - R];
    return {
      states, pos,
      energy: (s) => ({ pot: G * hgt(s), kin: Math.max(0, total - G * hgt(s)) }),
      draw(fig, s, lit, mo) {
        groundAt(fig, 0, 0, 150);
        zeroLine(fig, 75, 77, 0);
        states.forEach((t, i) => ghostBall(fig, pos(t), i, lit === i));
        const c = pos(s);
        ball(fig, c[0], c[1] + R);
        velocity(fig, c, mo.dir(s), mo.v(s), mo.vmax);
      },
    };
  }

  const MOTION = {
    fall: (p) => (p.dir === 'drop'
      ? vertical(p, { top: p.V.h, hgt: (s) => p.V.h * (1 - s), states: [0, 1] })
      : vertical(p, { top: p.V.h, hgt: (s) => p.V.h * s, states: [0, 1] })),
    'part-drop': (p) => vertical(p, { top: p.V.h, hgt: (s) => p.V.h * (1 - s * (1 - fval(p.fr))), states: [0, 1] }),
    'speed-fraction': (p) => vertical(p, { top: p.V.h, hgt: (s) => p.V.h * (1 - s), states: [0, sq(fval(p.fr)), 1] }),

    launcher(p) {
      const { k, s: sm } = p.V, L0 = 96, C = 38, bw = 40, bh = 30, xc = L0 - C, xe = L0 + 140, total = 0.5 * k * sm * sm;
      const xb = (s) => lerp(xc, xe, s), comp = (s) => (sm * Math.max(0, L0 - xb(s))) / C;
      return {
        states: [0, 1],
        pos: (s) => [xb(s) + bw / 2, -bh / 2],
        energy: (s) => { const el = 0.5 * k * sq(comp(s)); return { el, kin: Math.max(0, total - el) }; },
        draw(fig, s, lit, mo) {
          fig.surface(0, xe + bw + 40, 0);
          fig.wall(0, 0, -60);
          ghostRect(fig, xc, -bh, bw, bh, 0, lit === 0, xc + bw / 2, 26);
          ghostRect(fig, xe, -bh, bw, bh, 1, lit === 1, xe + bw / 2, 26);
          const x = xb(s);
          fig.spring([0, -bh / 2], [Math.min(x, L0), -bh / 2], 8, Math.min(x, L0) < L0 - 10 ? 5 : 7);
          fig.rect(x, -bh, bw, bh, 'body');
          velocity(fig, [x + bw / 2 + 8, -bh / 2], [1, 0], mo.v(s), mo.vmax);
        },
      };
    },

    pendulum(p) {
      const Lp = 140, a = (p.ang * Math.PI) / 180, l = p.V.l, total = G * l * (1 - Math.cos(a));
      const th = (s) => a * (1 - s), pos = (s) => [-Lp * Math.sin(th(s)), Lp * Math.cos(th(s))];
      return {
        states: [0, 1], pos,
        energy: (s) => { const pot = G * l * (1 - Math.cos(th(s))); return { pot, kin: Math.max(0, total - pot) }; },
        draw(fig, s, lit, mo) {
          ceilingAt(fig, 0, 0, 80);
          const arc = [];
          for (let k = 0; k <= 30; k++) { const t = -a + (k / 30) * a * 1.6; arc.push([Lp * Math.sin(t), Lp * Math.cos(t)]); }
          fig.path(`M${arc.map((x) => x.map((y) => y.toFixed(1)).join(' ')).join('L')}`, arc, 'w dash');
          zeroLine(fig, -Lp - 30, Lp * 0.75, Lp);
          ghostBall(fig, pos(0), 0, lit === 0, -R - 14);
          ghostBall(fig, pos(1), 1, lit === 1, 0);
          const c = pos(s);
          fig.line(0, 0, ...c, 'w rope');
          fig.circle(c[0], c[1], R, 'body ball');
          fig.circle(0, 0, 2.5, 'dot');
          velocity(fig, c, mo.dir(s), mo.v(s), mo.vmax);
        },
      };
    },

    ramp(p) {
      const { pts, sc } = track(p), total = G * p.V.h1 + 0.5 * sq(p.V.v1);
      const at = (s) => { const x = 260 * s, y = heightAt(pts, x), t = tangentAt(pts, x), n = Math.hypot(...t); return { x, y, nn: [t[1] / n, -t[0] / n] }; };
      const pos = (s) => { const q = at(s); return [q.x + q.nn[0] * R, q.y + q.nn[1] * R]; };
      return {
        states: [0, 1], pos,
        energy: (s) => { const pot = (G * -at(s).y) / sc; return { pot, kin: Math.max(0, total - pot) }; },
        draw(fig, s, lit, mo) {
          fig.surface(-70, 340, 0);
          fig.path(`M${pts.map((x) => x.map((y) => y.toFixed(1)).join(' ')).join('L')}`, pts, 'track');
          zeroLine(fig, 340, 342, 0);
          [0, 1].forEach((i) => { const c = pos(i); fig.circle(c[0], c[1], R, 'ghost'); fig.text(c[0], c[1] - R - 12, EC.CIRCLED[i], `lbl state${lit === i ? ' hl' : ''}`); });
          const c = pos(s);
          fig.circle(c[0], c[1], R, 'body ball');
          velocity(fig, c, mo.dir(s), mo.v(s), mo.vmax, 40);
        },
      };
    },

    tower(p) {
      // the real path: thrown at the angle of the exercise, drawn to scale
      const a = (DIRS[p.dir] * Math.PI) / 180, { h, v0 } = p.V, vx = v0 * Math.cos(a), vy = v0 * Math.sin(a);
      const T = (vy + Math.sqrt(vy * vy + 2 * G * h)) / G, xe = vx * T, ymax = h + (vy > 0 ? (vy * vy) / (2 * G) : 0);
      const sc = Math.min(150 / ymax, 300 / Math.max(xe, 1e-9)), total = G * h + 0.5 * v0 * v0;
      const xy = (s) => { const t = s * T; return [vx * t, h + vy * t - 0.5 * G * t * t]; };
      const pos = (s) => { const [x, y] = xy(s); return [x * sc + R, -y * sc - R]; };
      return {
        states: [0, 1], pos,
        energy: (s) => { const pot = G * Math.max(0, xy(s)[1]); return { pot, kin: Math.max(0, total - pot) }; },
        draw(fig, s, lit, mo) {
          const tw = 46;
          fig.rect(-tw, -h * sc, tw, h * sc, 'tower');
          fig.surface(-tw - 30, Math.max(xe * sc + 2 * R + 40, 160), 0);
          zeroLine(fig, Math.max(xe * sc + 2 * R + 40, 160), Math.max(xe * sc + 2 * R + 42, 162), 0);
          const path = [];
          for (let k = 0; k <= 40; k++) path.push(pos(k / 40));
          fig.path(`M${path.map((x) => x.map((y) => y.toFixed(1)).join(' ')).join('L')}`, path, 'w dash');
          fig.circle(...pos(0), R, 'ghost'); fig.text(-tw / 2, -h * sc - 12, EC.CIRCLED[0], `lbl state${lit === 0 ? ' hl' : ''}`);
          fig.circle(...pos(1), R, 'ghost'); fig.text(pos(1)[0], 28, EC.CIRCLED[1], `lbl state${lit === 1 ? ' hl' : ''}`);
          const c = pos(s);
          fig.circle(c[0], c[1], R, 'body ball');
          velocity(fig, c, mo.dir(s), mo.v(s), mo.vmax, 40);
        },
      };
    },

    'spring-up'(p) {
      const { k, s: sm, m, h } = p.V, L0 = 70, C = 30, Hpx = 150, y0 = -(L0 - C), total = 0.5 * k * sm * sm;
      const r = (s) => s * h; // the rise above the start (m)
      const rpx = (s) => (r(s) <= sm ? (C * r(s)) / sm : C + ((Hpx - C) * (r(s) - sm)) / (h - sm));
      const pos = (s) => [0, y0 - rpx(s) - R];
      return {
        states: [0, 1], pos,
        energy: (s) => {
          const el = 0.5 * k * sq(sm - Math.min(r(s), sm)), pot = m * G * r(s);
          return { pot, kin: Math.max(0, total - el - pot), el };
        },
        draw(fig, s, lit, mo) {
          groundAt(fig, 0, 0, 100);
          zeroLine(fig, -50, 70, y0);
          const top = y0 - Math.min(rpx(s), C);
          fig.spring([0, 0], [0, top], 9, 7);
          fig.line(-16, top, 16, top, 'w plate');
          ghostBall(fig, pos(0), 0, lit === 0, -R - 34);
          ghostBall(fig, pos(1), 1, lit === 1, -R - 16);
          const c = pos(s);
          ball(fig, c[0], c[1] + R);
          velocity(fig, [c[0] + 2 * R + 6, c[1] + 10], [0, -1], mo.v(s), mo.vmax, 40);
        },
      };
    },

    'drop-spring'(p) {
      const { k, s: sm, m, h } = p.V, L0 = 70, C = 30, H = 100, y0 = -(L0 - C), total = m * G * (h + sm);
      const z = (s) => (h + sm) * (1 - s); // height above the lowest point (m)
      const zpx = (s) => (z(s) >= sm ? C + (H * (z(s) - sm)) / h : (C * z(s)) / sm);
      const pos = (s) => [0, y0 - zpx(s) - R];
      return {
        states: [0, h / (h + sm), 1], pos,
        energy: (s) => {
          const pot = m * G * z(s), el = 0.5 * k * sq(Math.max(0, sm - z(s)));
          return { pot, kin: Math.max(0, total - pot - el), el };
        },
        draw(fig, s, lit, mo) {
          groundAt(fig, 0, 0, 100);
          zeroLine(fig, -50, 70, y0);
          const top = z(s) >= sm ? -L0 : y0 - zpx(s);
          fig.spring([0, 0], [0, top], 9, 7);
          fig.line(-16, top, 16, top, 'w plate');
          this.states.forEach((t, i) => ghostBall(fig, pos(t), i, lit === i, -R - 34));
          const c = pos(s);
          ball(fig, c[0], c[1] + R);
          velocity(fig, [c[0] + 2 * R + 6, c[1] - 10], [0, 1], mo.v(s), mo.vmax, 40);
        },
      };
    },

    'spring-hang'(p) {
      const { k, s: sm, m } = p.V, L0 = 80, S0 = 110, bw = 28, bh = 30, total = m * G * sm;
      const d = (s) => s * sm;
      const pos = (s) => [0, L0 + S0 * s + bh / 2];
      return {
        states: p.ask === 'v' ? [0, fval(p.fr), 1] : [0, 1], pos,
        energy: (s) => {
          const pot = m * G * (sm - d(s)), el = 0.5 * k * sq(d(s));
          return { pot, kin: Math.max(0, total - pot - el), el };
        },
        draw(fig, s, lit, mo) {
          ceilingAt(fig, 0, 0, 100);
          zeroLine(fig, -50, 60, L0 + S0 + bh);
          this.states.forEach((t, i) => ghostRect(fig, -bw / 2, L0 + S0 * t, bw, bh, i, lit === i, -bw / 2 - 24, L0 + S0 * t + bh / 2 + 6));
          fig.spring([0, 0], [0, L0 + S0 * s], 8, 9);
          fig.rect(-bw / 2, L0 + S0 * s, bw, bh, 'body');
          velocity(fig, [bw / 2 + 8 - R, L0 + S0 * s + 4 - R], [0, 1], mo.v(s), mo.vmax, 40);
        },
      };
    },
  };

  // ---------------------------------------------------------------- the timeline
  const N = 400, MOVE = 4.2, HOLD = 1.1, END = 1.4; // s

  const made = {};

  function create(ex) {
    const def = MOTION[ex.scenario](ex.p), forms = ex.forms, m = ex.p.V.m || 1;
    const E = (s) => def.energy(s);
    const tot = (e) => (e.pot || 0) + (e.kin || 0) + (e.el || 0);
    const total = tot(E(0));
    const v = (s) => Math.sqrt((2 * (E(s).kin || 0)) / m);
    // samples along the motion, and the time to reach each one: distance on the screen over the
    // speed (at least a quarter of the top speed)
    const S = [], P = [], V = [];
    for (let i = 0; i <= N; i++) { const s = i / N; S.push(s); P.push(def.pos(s)); V.push(v(s)); }
    const vmax = Math.max(...V) || 1, tau = [0];
    for (let i = 0; i < N; i++) {
      const ds = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
      tau.push(tau[i] + ds / Math.max((V[i] + V[i + 1]) / 2, 0.25 * vmax));
    }
    const scale = MOVE / (tau[N] || 1);
    for (let i = 0; i <= N; i++) tau[i] *= scale;
    const tauOf = (s) => { const x = s * N, i = Math.min(N - 1, Math.floor(x)); return lerp(tau[i], tau[i + 1], x - i); };
    const sOf = (t) => {
      let lo = 0, hi = N;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tau[mid] <= t) lo = mid; else hi = mid; }
      return (lo + (t - tau[lo]) / ((tau[hi] - tau[lo]) || 1)) / N;
    };
    const mo = {
      vmax,
      v,
      dir: (s) => { const a = def.pos(Math.max(0, s - 0.004)), b = def.pos(Math.min(1, s + 0.004)); return [b[0] - a[0], b[1] - a[1]]; },
    };

    // pauses at the states, the motion between them, and a longer pause at the end
    const pieces = [];
    let t = 0;
    def.states.forEach((st, j) => {
      const hold = j === def.states.length - 1 ? HOLD + END : HOLD;
      pieces.push({ t0: t, t1: t + hold, s0: st, s1: st, state: j });
      t += hold;
      if (j < def.states.length - 1) {
        const dur = tauOf(def.states[j + 1]) - tauOf(st);
        pieces.push({ t0: t, t1: t + dur, s0: st, s1: def.states[j + 1], state: -1 });
        t += dur;
      }
    });
    const duration = t;

    // the scene and, beside it, the energy bars, at s
    const meterAt = (box) => ({ x: box[2] + 56, y: box[3] - 4, H: Math.max(90, Math.min(140, box[3] - box[1] - 30)) });
    const sceneBox = (() => {
      const f = new Fig();
      [0, 0.25, 0.5, 0.75, 1, ...def.states].forEach((s) => def.draw.call(def, f, s, -1, mo));
      return f.box0.slice();
    })();
    const mt = meterAt(sceneBox);
    const draw = (s, state) => {
      const f = new Fig(ex.title);
      def.draw.call(def, f, s, state, mo);
      f.meter(mt.x, mt.y, E(s), forms, total, mt.H);
      return f;
    };
    const box = (() => { const f = draw(0, -1), b = f.box0; return [Math.min(b[0], sceneBox[0]), Math.min(b[1], sceneBox[1]), Math.max(b[2], sceneBox[2]), Math.max(b[3], sceneBox[3])]; })();

    function at(time) {
      const tt = Math.max(0, Math.min(duration, time));
      const pc = pieces.find((q) => tt <= q.t1) || pieces[pieces.length - 1];
      const s = pc.state >= 0 ? pc.s0 : sOf(tauOf(pc.s0) + (tt - pc.t0));
      return { s, state: pc.state };
    }

    const anim = {
      duration, states: def.states, energy: E, total,
      frame(time) { const { s, state } = at(time); return { svg: draw(s, state).inner(), state, s }; },
      // the figure with the player's controls (see the app)
      markup(key) {
        const f = draw(0, 0).render(box);
        return `<div class="anim" data-anim="${key}">${f}<div class="anim-ctrl">` +
          `<button type="button" class="anim-play" aria-label="${EC.L('Play', 'Abspielen')}">▶</button>` +
          `<input type="range" class="anim-seek" min="0" max="1000" value="0" aria-label="${EC.L('Time', 'Zeit')}"></div></div>`;
      },
    };
    return anim;
  }

  const Motion = {
    MOTION,
    create,
    // created once per key, so that the app's player finds the one in the frame
    make(key, ex) { made[key] = create(ex); return made[key]; },
    get: (key) => made[key],
  };
  root.Motion = Motion;
  if (typeof module !== 'undefined') module.exports = Motion;
})(typeof window !== 'undefined' ? window : globalThis);
