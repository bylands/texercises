// The graph the student draws, in an <svg> element.
// The drawn graph is continuous and piecewise linear, with a dot at every breakpoint; dragging
// the line of a piece moves both of its dots.
// Keyboard: ←/→ select a handle, ↑/↓ move it.
(function (root) {
  'use strict';

  const { scales, targetGraph, handles, UNIT, num, svgPoint, hoverPoint } = root.Plot;
  const L = (en, de) => root.Lang.L(en, de);

  function createEditor(el, ex, onEdit) {
    const axis = ex.axes.target, s = scales(axis), n = ex.pieces.length;
    const clamp = (v) => Math.min(axis.hi, Math.max(axis.lo, v));
    const snap = (v, step) => Math.round(v / step) * step + 0; // + 0: no −0
    let st, drag = null, active = null, hover = null, view = { marks: null, solution: false, locked: false };

    function reset() {
      st = { nodes: Array(n + 1).fill(0) };
    }

    function values() {
      return ex.pieces.map((p, i) => {
        const y0 = st.nodes[i], y1 = st.nodes[i + 1];
        return { y0, ym: (y0 + y1) / 2, y1 };
      });
    }

    // Sets the value of a handle (snapped and kept on the axis).
    function set(id, value) {
      st.nodes[Number(id.slice(1))] = clamp(snap(value, axis.step));
    }
    const valueOf = (id) => handles(ex, values()).find((h) => h.id === id);

    // ---------------------------------------------------------------- drawing
    function render() {
      el.innerHTML = targetGraph(ex, values(), { ...view, active: view.locked ? null : active, hover });
      const h = active && valueOf(active);
      el.setAttribute('aria-valuetext', h ? `${ex.to} ${L('at', 'bei')} ${num(h.t)} s: ${num(Math.round(h.value * 100) / 100)} ${UNIT[ex.to]}` : '');
    }
    function edited() {
      view.marks = null;
      render();
      onEdit();
    }

    // ---------------------------------------------------------------- pointer
    const point = (evt) => svgPoint(el, evt);
    // Shows the point g under the mouse (null: none), redrawing only when it changes.
    function setHover(g) {
      if (hover === g || (hover && g && hover.t === g.t && hover.v === g.v)) return;
      hover = g;
      render();
    }
    // The handle under the pointer, or the line of a piece.
    function find(pt) {
      const r = Math.max(14, 22 / (el.getScreenCTM().a || 1));
      let best = null, score = Infinity;
      for (const h of handles(ex, values())) {
        const d = Math.hypot(pt.x - h.x, pt.y - h.y);
        if (d <= r && d < score) { score = d; best = h.id; }
      }
      if (best) return best;
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
      hover = null;
      drag = { id, y: s.inv(pt.y), base: id[0] === 'p' ? { y0: st.nodes[i], y1: st.nodes[i + 1] } : null };
      active = id[0] === 'p' ? `n${i}` : id;
      el.classList.add('dragging');
      render();
    });

    el.addEventListener('pointermove', (evt) => {
      const pt = point(evt);
      if (!drag) {
        const id = !view.locked && find(pt);
        el.style.cursor = id ? 'grab' : '';
        const curves = view.solution ? [values(), ex.answer] : [values()];
        setHover(id || evt.pointerType === 'touch' ? null : hoverPoint(ex, axis, curves, pt.x, pt.y));
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
    el.addEventListener('pointerleave', () => { if (!drag) setHover(null); });

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
        set(active, valueOf(active).value + (evt.key === 'ArrowUp' ? 1 : -1) * axis.step);
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
      // the drawing, to carry it over to a new editor (e.g. after switching the language)
      state: () => JSON.parse(JSON.stringify(st)),
      restore(saved) { st = JSON.parse(JSON.stringify(saved)); render(); },
      show(opts) { Object.assign(view, opts); if (view.locked) active = null; render(); },
    };
  }

  root.createEditor = createEditor;
})(window);
