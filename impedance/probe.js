// The probe on a graph: moving the mouse (or a finger, or the arrow keys once the graph has the
// focus) over the graph shows the point on the curve at that ω, the tangent there, and a readout
// of ω, ω⁻² (Z² of a series RC circuit is a straight line in it), Z, the slope dZ/dω and, on
// log-log axes, the slope of the straight line in the log-log plot. A click or tap (or Enter) pins
// the point (up to three); pinned points are listed below the graph.
(function (root) {
  'use strict';

  const I = root.Impedance, P = root.Plot;
  // the page language (lang.js, shared by the apps); English where it is not loaded
  const L = (en, de) => (root.Lang ? root.Lang.L(en, de) : en);
  const MAX_PINS = 3;

  // el: the element holding the graph <svg>; get() returns { c, ax, mode } of what is drawn;
  // out: element for the readout; pinList: element for the pinned points.
  function createProbe(el, get, out, pinList) {
    let w = null, pins = [], next = 1, down = null;

    const svg = () => el.querySelector('svg');
    function point(evt) {
      const s = svg(), pt = s.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(s.getScreenCTM().inverse());
    }
    // the variable of the axis: ω in rad/s, or (problems) f in Hz, with digits enough to tell
    // readings apart in a narrow window of frequencies
    const xOf = (r, ax, mode) => {
      if (!ax.x || ax.x.unit !== 'Hz') return `<i>ω</i> = ${I.H(r.w, 'w')}`;
      const sc = P.scales(ax, mode), span = sc.wmax - sc.wmin;
      const n = mode === 'semilog' || mode === 'log' ? 3 : Math.min(7, Math.max(3, 3 + Math.ceil(Math.log10(r.w / span))));
      return `<i>${ax.x.name}</i> = ${I.H(r.w, 'Hz', n)}`;
    };
    // ω⁻² (or f⁻²) in s²: Z² of a series RC circuit is a straight line in it, Z² = R² + ω⁻²/C²
    const inv2 = (r, ax) => `<i>${ax.x ? ax.x.name : 'ω'}</i><sup>−2</sup> = ${I.H(r.inv2, 's2')}`;
    const line = (r, mode, ax) => `<span>${xOf(r, ax, mode)}</span><span>${inv2(r, ax)}</span><span><i>Z</i> = ${I.H(r.z, 'ohm')}</span>` +
      `<span>${L('slope', 'Steigung')} <i>dZ</i>/<i>d${ax.x ? ax.x.name : 'ω'}</i> = ${I.H(r.d, 'ohms')}</span>` +
      (mode === 'log' ? `<span>${L('log-log slope', 'doppelt logarithmische Steigung')} = ${I.digits(r.p)}</span>` : '');

    function draw() {
      const { c, ax, mode } = get(), layer = el.querySelector('.probe');
      if (!layer) return;
      // the graph takes the focus for the arrow keys (the tutor leaves an svg[tabindex] alone)
      const s = svg();
      if (!s.hasAttribute('tabindex')) {
        s.setAttribute('tabindex', '0');
        s.setAttribute('aria-label', `${s.getAttribute('aria-label')}. ${L('Arrow keys move the probe (with Shift in larger steps), Enter pins a point.', 'Die Pfeiltasten verschieben die Sonde (mit Shift in grösseren Schritten), Enter hält einen Punkt fest.')}`);
      }
      layer.innerHTML = P.probeMark(c, ax, mode, w, pins);
      out.innerHTML = w === null
        ? `<span class="muted">${L('Move the mouse over the graph (or touch it) to read the coordinates and the slope of the tangent. Click or tap to pin a point.', 'Fahre mit der Maus über den Graphen (oder tippe darauf), um die Koordinaten und die Steigung der Tangente abzulesen. Klicke oder tippe, um einen Punkt festzuhalten.')}</span>`
        : line(P.readout(c, ax, mode, w), mode, ax);
      pinList.innerHTML = pins.map((p) => `<li><span class="pin-label">${p.n}</span>${line(P.readout(c, ax, mode, p.w), mode, ax)}<button type="button" class="unpin" data-n="${p.n}" aria-label="${L('Remove point', 'Punkt entfernen')} ${p.n}">×</button></li>`).join('');
      pinList.hidden = !pins.length;
    }

    function move(evt) {
      const { ax, mode } = get(), pt = point(evt);
      const nw = P.omegaAt(ax, mode, pt.x);
      if (nw === null && evt.pointerType !== 'touch') { if (w !== null) { w = null; draw(); } return; }
      if (nw !== null) { w = nw; draw(); }
    }

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', (evt) => {
      if (!svg()) return;
      down = { x: evt.clientX, y: evt.clientY };
      if (evt.pointerType === 'touch') { el.setPointerCapture(evt.pointerId); move(evt); }
    });
    el.addEventListener('pointerup', (evt) => {
      if (!down || w === null) return;
      const moved = Math.hypot(evt.clientX - down.x, evt.clientY - down.y);
      down = null;
      if (moved > 8) return;
      pins.push({ w, n: next++ });
      if (pins.length > MAX_PINS) pins.shift();
      draw();
    });
    el.addEventListener('pointerleave', (evt) => { if (evt.pointerType !== 'touch') { w = null; draw(); } });
    // the keyboard: ← → move the probe by 1/100 of the axis (Shift: 1/10), Enter or space pins the
    // point, Escape hides the probe
    el.addEventListener('keydown', (evt) => {
      if (!evt.target.matches || !evt.target.matches('svg[tabindex]')) return;
      const { ax, mode } = get(), sc = P.scales(ax, mode);
      if (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') {
        const px = w === null ? P.ML + P.PW / 2 : sc.x(w) + (evt.key === 'ArrowRight' ? 1 : -1) * (evt.shiftKey ? P.PW / 10 : P.PW / 100);
        w = P.omegaAt(ax, mode, Math.min(P.ML + P.PW, Math.max(P.ML, px)));
      } else if ((evt.key === 'Enter' || evt.key === ' ') && w !== null) {
        pins.push({ w, n: next++ });
        if (pins.length > MAX_PINS) pins.shift();
      } else if (evt.key === 'Escape') w = null;
      else return;
      evt.preventDefault();
      draw();
    });
    el.addEventListener('focusout', () => { if (w !== null && !down) { w = null; draw(); } });
    pinList.addEventListener('click', (evt) => {
      const b = evt.target.closest('.unpin');
      if (!b) return;
      pins = pins.filter((p) => p.n !== Number(b.dataset.n));
      draw();
    });

    return {
      draw,
      reset() { w = null; pins = []; next = 1; draw(); },
    };
  }

  root.createProbe = createProbe;
})(window);
