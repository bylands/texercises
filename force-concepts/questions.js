// The question formats in the page: how each type is drawn, read, checked and marked.
//   choice  one option (radio buttons)          two   a prediction and a reason
//   tf      true/false for each statement        rank  a rank (1, 2, …) for each item, ties allowed
//   match   one choice for each item (select)
// state(q) reads the answer from the page, evaluate(q, state) checks it: { complete, ok, marks,
// misses } — marks say what to colour and explain where, misses the misconceptions behind wrong
// parts ({ id, code }, id unique within the question).
(function (root) {
  'use strict';

  const FC = root.FC, T = FC.T;
  const LETTERS = 'ABCDEF';
  const $q = (q) => document.querySelector(`.field[data-key="${q.key}"]`);
  const tag = (code) => (FC.MIS[code] ? ` <span class="tag" title="${FC.mis(code).text}">${FC.mis(code).name}</span>` : '');
  const right = () => T('Right.', 'Richtig.');

  // ---------------------------------------------------------------- drawing
  const optionsHtml = (opts, name, pics, ro) => `
    <div class="opts ${pics ? 'pics' : 'list'}" role="radiogroup">${opts.map((x, i) => `
      <label><input type="radio" name="${name}" value="${i}"${ro ? ' disabled' : ''}><span><b class="letter">${LETTERS[i]}</b>${pics ? `<span class="pic">${x.label}</span>` : `<span>${x.label}</span>`}</span></label>`).join('')}
    </div>`;
  const select = (name, values, ro) => `<select name="${name}"${ro ? ' disabled' : ''}><option value="">–</option>${values.map(([v, label]) => `<option value="${v}">${label}</option>`).join('')}</select>`;

  // The question as HTML; ro: read-only (for the tutor).
  function html(q, k, ro = false) {
    const head = `<p class="qprompt"><span class="qn">${k + 1}</span>${q.prompt}</p>`;
    switch (q.type) {
      case 'two':
        return `<div class="field two" data-key="${q.key}">${head}
          <div class="grp" data-grp="pred">${optionsHtml(q.options, `pred-${q.key}`, q.pics, ro)}<p class="fb"></p></div>
          <p class="qprompt sub">${q.reasonPrompt}</p>
          <div class="grp" data-grp="reason">${optionsHtml(q.reasons, `reason-${q.key}`, false, ro)}<p class="fb"></p></div>
          <p class="fb qfb"></p></div>`;
      case 'tf':
        return `<div class="field tf" data-key="${q.key}">${head}<ol class="rows">${q.items.map((x, i) => `
          <li class="row" data-i="${i}"><span class="row-text">${x.text}</span>
            <span class="tf-btns" role="radiogroup">
              <label><input type="radio" name="tf-${q.key}-${i}" value="1"${ro ? ' disabled' : ''}><span>${T('true', 'richtig')}</span></label>
              <label><input type="radio" name="tf-${q.key}-${i}" value="0"${ro ? ' disabled' : ''}><span>${T('false', 'falsch')}</span></label>
            </span><p class="fb"></p></li>`).join('')}</ol></div>`;
      case 'rank': {
        const n = q.items.length, vals = Array.from({ length: n }, (z, i) => [i + 1, String(i + 1)]);
        return `<div class="field rank" data-key="${q.key}">${head}<ol class="rows">${q.items.map((x, i) => `
          <li class="row" data-i="${i}">${select(`rank-${q.key}-${i}`, vals, ro)}<span class="row-text">${x.label}</span></li>`).join('')}</ol><p class="fb qfb"></p></div>`;
      }
      case 'match': {
        const vals = q.choices.map((c, j) => [j, c.name]);
        const gallery = q.pics && !q.shown ? `<div class="gallery">${q.choices.map((c) => `<figure class="choice"><figcaption><b class="letter">${c.name}</b></figcaption>${c.label}</figure>`).join('')}</div>` : '';
        return `<div class="field match" data-key="${q.key}">${head}${gallery}<ol class="rows">${q.items.map((x, i) => `
          <li class="row" data-i="${i}"><span class="row-text">${x.label}</span>${select(`match-${q.key}-${i}`, vals, ro)}<p class="fb"></p></li>`).join('')}</ol></div>`;
      }
      default:
        return `<div class="field choice" data-key="${q.key}">${head}<div class="grp" data-grp="pred">${optionsHtml(q.options, `opt-${q.key}`, q.pics, ro)}<p class="fb"></p></div></div>`;
    }
  }

  // ---------------------------------------------------------------- reading and setting answers
  const radio = (name) => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? Number(el.value) : null; };
  const sel = (name) => { const el = document.querySelector(`select[name="${name}"]`); return el && el.value !== '' ? Number(el.value) : null; };
  function state(q) {
    switch (q.type) {
      case 'two': return [radio(`pred-${q.key}`), radio(`reason-${q.key}`)];
      case 'tf': return q.items.map((x, i) => { const v = radio(`tf-${q.key}-${i}`); return v == null ? null : v === 1; });
      case 'rank': return q.items.map((x, i) => sel(`rank-${q.key}-${i}`));
      case 'match': return q.items.map((x, i) => sel(`match-${q.key}-${i}`));
      default: return radio(`opt-${q.key}`);
    }
  }
  function setState(q, s) {
    const check = (name, v) => { if (v != null) { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; } };
    const choose = (name, v) => { const el = document.querySelector(`select[name="${name}"]`); if (el) el.value = v == null ? '' : String(v); };
    switch (q.type) {
      case 'two': check(`pred-${q.key}`, s[0]); check(`reason-${q.key}`, s[1]); break;
      case 'tf': s.forEach((v, i) => check(`tf-${q.key}-${i}`, v == null ? null : v ? 1 : 0)); break;
      case 'rank': s.forEach((v, i) => choose(`rank-${q.key}-${i}`, v)); break;
      case 'match': s.forEach((v, i) => choose(`match-${q.key}-${i}`, v)); break;
      default: check(`opt-${q.key}`, s);
    }
  }

  // ---------------------------------------------------------------- checking
  // marks: [{ where: 'pred' | 'reason' | 'q' | row index, ok, fb }]
  function evaluate(q, s) {
    const marks = [], misses = [];
    const miss = (id, code) => { if (FC.MIS[code]) misses.push({ id, code }); };
    switch (q.type) {
      case 'two': {
        const [p, rsn] = s, P = p == null ? null : q.options[p], R = rsn == null ? null : q.reasons[rsn];
        if (P) { marks.push({ where: 'pred', ok: P.ok, fb: P.ok ? right() : P.why + tag(P.code) }); if (!P.ok) miss(`p${p}`, P.code); }
        if (R) { marks.push({ where: 'reason', ok: R.ok, fb: R.ok ? R.why : R.why + tag(R.code) }); if (!R.ok) miss(`r${rsn}`, R.code); }
        if (P && R && P.ok && !R.ok) marks.push({ where: 'q', ok: false, fb: T('The prediction is right, but not the reason — so the answer does not count yet.', 'Die Vorhersage stimmt, aber nicht die Begründung — deshalb zählt die Antwort noch nicht.') });
        if (P && R && !P.ok && R.ok) marks.push({ where: 'q', ok: false, fb: T('The reason is right, but it leads to a different prediction.', 'Die Begründung stimmt, führt aber zu einer anderen Vorhersage.') });
        return { complete: !!(P && R), ok: !!(P && R && P.ok && R.ok), marks, misses };
      }
      case 'tf': {
        q.items.forEach((x, i) => {
          if (s[i] == null) return;
          const ok = s[i] === x.value;
          marks.push({ where: i, ok, fb: (ok ? `${right()} ` : '') + x.why + (ok ? '' : tag(x.code)) });
          if (!ok) miss(`s${i}`, x.code);
        });
        return { complete: s.every((v) => v != null), ok: s.every((v, i) => v === q.items[i].value), marks, misses };
      }
      case 'rank': {
        const complete = s.every((v) => v != null);
        if (!complete) return { complete, ok: false, marks, misses };
        const want = FC.ranksOf(q.items.map((x) => x.value)), ok = s.every((v, i) => v === want[i]);
        q.items.forEach((x, i) => marks.push({ where: i, ok: s[i] === want[i] }));
        const trap = q.traps.find((t) => { const tr = FC.ranksOf(q.items.map((x) => x.alt[t.key])); return s.every((v, i) => v === tr[i]); });
        marks.push({ where: 'q', ok, fb: ok ? q.why : trap ? trap.why + tag(trap.code) : T('Not quite: the marked ranks are wrong. Remember that equal values get the same rank.', 'Noch nicht ganz: Die markierten Ränge stimmen nicht. Denk daran, dass gleiche Werte denselben Rang bekommen.') });
        if (trap) miss(trap.key, trap.code);
        return { complete, ok, marks, misses };
      }
      case 'match': {
        q.items.forEach((x, i) => {
          if (s[i] == null) return;
          const c = q.choices[s[i]], ok = c.id === x.answer, w = (x.wrong || {})[c.id];
          marks.push({ where: i, ok, fb: ok ? `${right()} ${x.why}` : w ? w.why + tag(w.code) : x.other });
          if (!ok && w) miss(`${i}-${c.id}`, w.code);
        });
        return { complete: s.every((v) => v != null), ok: s.every((v, i) => v != null && q.choices[v].id === q.items[i].answer), marks, misses };
      }
      default: {
        const x = s == null ? null : q.options[s];
        if (x) { marks.push({ where: 'pred', ok: x.ok, fb: x.why + (x.ok ? '' : tag(x.code)) }); if (!x.ok) miss(`o${s}`, x.code); }
        return { complete: !!x, ok: !!(x && x.ok), marks, misses };
      }
    }
  }

  // ---------------------------------------------------------------- marking
  function clear(q) {
    const f = $q(q);
    f.querySelectorAll('.ok, .bad').forEach((el) => el.classList.remove('ok', 'bad'));
    f.querySelectorAll('.fb').forEach((el) => { el.innerHTML = ''; });
  }
  // Clears the marks of the part that contains el (after the answer there changed).
  function clearAt(el) {
    const part = el.closest('.row, .grp');
    if (!part) return;
    part.classList.remove('ok', 'bad');
    part.querySelectorAll('.fb').forEach((x) => { x.innerHTML = ''; x.classList.remove('ok', 'bad'); });
    const f = el.closest('.field'), qfb = f.querySelector('.qfb');
    if (qfb) { qfb.innerHTML = ''; qfb.classList.remove('ok', 'bad'); }
  }
  function paint(q, ev) {
    clear(q);
    const f = $q(q);
    for (const m of ev.marks) {
      const part = m.where === 'q' ? null : typeof m.where === 'number' ? f.querySelector(`.row[data-i="${m.where}"]`) : f.querySelector(`.grp[data-grp="${m.where}"]`);
      if (part) part.classList.add(m.ok ? 'ok' : 'bad');
      const fb = m.where === 'q' ? f.querySelector('.qfb') : part && part.querySelector('.fb');
      if (fb && m.fb) { fb.innerHTML = m.fb; fb.classList.add(m.ok ? 'ok' : 'bad'); }
    }
  }

  root.Questions = { html, state, setState, evaluate, clear, clearAt, paint, tag };
})(window);
