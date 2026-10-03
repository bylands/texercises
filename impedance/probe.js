// The probe on a graph: moving the mouse (or a finger) over the graph shows the point on the
// curve at that ω, the tangent there, and a readout of ω, Z, the slope dZ/dω and, on log-log
// axes, the slope of the straight line in the log-log plot. A click or tap pins the point (up to
// three); pinned points are listed below the graph.
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
    const line = (r, mode) => `<span><i>ω</i> = ${I.H(r.w, 'w')}</span><span><i>Z</i> = ${I.H(r.z, 'ohm')}</span>` +
      `<span>${L('slope', 'Steigung')} <i>dZ</i>/<i>dω</i> = ${I.H(r.d, 'ohms')}</span>` +
      (mode === 'log' ? `<span>${L('log-log slope', 'doppelt logarithmische Steigung')} = ${I.digits(r.p)}</span>` : '');

    function draw() {
      const { c, ax, mode } = get(), layer = el.querySelector('.probe');
      if (!layer) return;
      layer.innerHTML = P.probeMark(c, ax, mode, w, pins);
      out.innerHTML = w === null
        ? `<span class="muted">${L('Move the mouse over the graph (or touch it) to read the coordinates and the slope of the tangent. Click or tap to pin a point.', 'Fahre mit der Maus über den Graphen (oder tippe darauf), um die Koordinaten und die Steigung der Tangente abzulesen. Klicke oder tippe, um einen Punkt festzuhalten.')}</span>`
        : line(P.readout(c, ax, mode, w), mode);
      pinList.innerHTML = pins.map((p) => `<li><span class="pin-label">${p.n}</span>${line(P.readout(c, ax, mode, p.w), mode)}<button type="button" class="unpin" data-n="${p.n}" aria-label="${L('Remove point', 'Punkt entfernen')} ${p.n}">×</button></li>`).join('');
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
