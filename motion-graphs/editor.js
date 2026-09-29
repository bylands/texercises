// The graph the student draws, in an <svg> element.
// The drawn graph is continuous, with a dot at every breakpoint.
// Derivative (piecewise linear): dragging the line of a piece moves both of its dots.
// Integral: the dot at t = 0 is given, and a diamond in the middle of every piece bends the
//   piece into a parabola.
// Keyboard: ←/→ select a handle, ↑/↓ move it.
(function (root) {
  'use strict';

  const { MID_STEP } = root.Motion;
  const { scales, targetGraph, handles, UNIT, num } = root.Plot;

  function createEditor(el, ex, onEdit) {
    const axis = ex.axes.target, s = scales(axis), n = ex.pieces.length;
    const clamp = (v) => Math.min(axis.hi, Math.max(axis.lo, v));
    const snap = (v, step) => Math.round(v / step) * step + 0; // + 0: no −0
    let st, drag = null, active = null, view = { marks: null, solution: false, locked: false };

    function reset() {
      st = { nodes: Array(n + 1).fill(ex.dir === 'diff' ? 0 : ex.pieces[0].G0), bends: Array(n).fill(0) };
    }

    function values() {
      return ex.pieces.map((p, i) => {
        const y0 = st.nodes[i], y1 = st.nodes[i + 1];
        return { y0, ym: (y0 + y1) / 2 + st.bends[i], y1 };
      });
    }

    // Sets the value of a handle (snapped and kept on the axis).
    function set(id, value) {
      const i = Number(id.slice(1));
      if (id[0] === 'n') st.nodes[i] = clamp(snap(value, axis.step));
      else if (id[0] === 'm') {
        const chord = (st.nodes[i] + st.nodes[i + 1]) / 2;
        st.bends[i] = snap(clamp(value) - chord, MID_STEP);
      }
    }
    const valueOf = (id) => handles(ex, values()).find((h) => h.id === id);
    const stepOf = (id) => (id[0] === 'm' ? MID_STEP : axis.step);

    // ---------------------------------------------------------------- drawing
    function render() {
      el.innerHTML = targetGraph(ex, values(), { ...view, active: view.locked ? null : active });
      const h = active && valueOf(active);
      el.setAttribute('aria-valuetext', h ? `${ex.to} at ${h.t} s: ${num(Math.round(h.value * 100) / 100)} ${UNIT[ex.to]}` : '');
    }
    function edited() {
      view.marks = null;
      render();
      onEdit();
    }

    // ---------------------------------------------------------------- pointer
    function point(evt) {
      const pt = el.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(el.getScreenCTM().inverse());
    }
    // The handle under the pointer, or (derivative) the line of a piece.
    function find(pt) {
      const r = Math.max(14, 22 / (el.getScreenCTM().a || 1));
      let best = null, score = Infinity;
      for (const h of handles(ex, values())) {
        const d = Math.hypot(pt.x - h.x, pt.y - h.y);
        if (d <= r && d < score) { score = d; best = h.id; }
      }
      if (best || ex.dir !== 'diff') return best;
      // the line of a piece: move the whole piece
      const vals = values();
      const i = ex.pieces.findIndex((p) => pt.x > s.x(p.t0) + r / 2 && pt.x < s.x(p.t1) - r / 2);
      if (i < 0) return null;
      const p = ex.pieces[i], k = (pt.x - s.x(p.t0)) / (s.x(p.t1) - s.x(p.t0));
      const y = s.y(vals[i].y0 + (vals[i].y1 - vals[i].y0) * k);
      return Math.abs(pt.y - y) <= r ? `p${i}` : null;
    }

    el.addEventListener('pointerdown', (evt) => {
      if (view.locked || evt.button > 0) return;
      const pt = point(evt), id = find(pt);
      if (!id) return;
      evt.preventDefault();
      el.focus({ preventScroll: true });
      el.setPointerCapture(evt.pointerId);
      const i = Number(id.slice(1));
      drag = { id, y: s.inv(pt.y), base: id[0] === 'p' ? { y0: st.nodes[i], y1: st.nodes[i + 1] } : null };
      active = id[0] === 'p' ? `n${i}` : id;
      el.classList.add('dragging');
      render();
    });

    el.addEventListener('pointermove', (evt) => {
      const pt = point(evt);
      if (!drag) {
        el.style.cursor = !view.locked && find(pt) ? 'grab' : '';
        return;
      }
      const y = s.inv(pt.y);
      if (drag.id[0] === 'p') {
        const i = Number(drag.id.slice(1)), b = drag.base;
        const d = Math.min(axis.hi - Math.max(b.y0, b.y1), Math.max(axis.lo - Math.min(b.y0, b.y1), snap(y - drag.y, axis.step)));
        st.nodes[i] = b.y0 + d;
        st.nodes[i + 1] = b.y1 + d;
      } else {
        set(drag.id, y);
      }
      edited();
    });

    const end = () => {
      if (!drag) return;
      drag = null;
      el.classList.remove('dragging');
      render();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    // ---------------------------------------------------------------- keyboard
    el.addEventListener('focus', () => {
      if (!active && !view.locked) { active = handles(ex, values())[0].id; render(); }
    });
    el.addEventListener('blur', () => { if (!drag) { active = null; render(); } });
    el.addEventListener('keydown', (evt) => {
      if (view.locked || !active) return;
      const order = handles(ex, values()).map((h) => h.id);
      const k = order.indexOf(active);
      if (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') {
        active = order[(k + (evt.key === 'ArrowLeft' ? order.length - 1 : 1)) % order.length];
        render();
      } else if (evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
        set(active, valueOf(active).value + (evt.key === 'ArrowUp' ? 1 : -1) * stepOf(active));
        edited();
      } else {
        return;
      }
      evt.preventDefault();
    });

    reset();
    render();
    return {
      values,
      reset() { reset(); edited(); },
      show(opts) { Object.assign(view, opts); if (view.locked) active = null; render(); },
    };
  }

  root.createEditor = createEditor;
})(window);
