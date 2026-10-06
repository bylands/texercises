// Shared by the teachingphysics.ch apps (canonical copy in shared/, copied by sync.sh).
// The problems mode: problems from everyday life and technology, told as stories, chosen in a
// menu (solved ones have a ✓), each with new numbers on request. A problem comes back with the
// numbers it had last time, so that a solved one shows its solution again. Ids: real<i+1>-<seed>.
//   const R = Problems.create({
//     app,                    the app's storage prefix
//     problems: [{ id, title() }],
//     make(i, seed),          the exercise of problem i (it gets real = i, seed and its id here)
//     open(ex),               show an exercise (the app's own)
//     current(),              the exercise shown, or null
//     pick, renew,            the menu (a select) and the button for new numbers
//   })
//   R.is(ex)                  a problem (not a practice exercise)?
//   R.menu()                  the menu in the current language
//   R.go(i, seed)             problem i, with its numbers of last time unless a seed is given
//   R.next()                  the next problem, with new numbers
//   R.resume()                the problem shown last (entering the mode)
//   R.parse(id)               the exercise of such an id, or null
//   R.solved(ex)              mark it solved (the ✓ in the menu)
(function (root) {
  'use strict';

  function create(o) {
    const key = (k) => `${o.app}-real-${k}`;
    const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(key(k))); return v == null ? d : v; } catch (e) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
    const newSeed = () => 1 + Math.floor(Math.random() * 999999);
    const is = (ex) => !!ex && ex.real != null;

    function build(i, seed) {
      const ex = o.make(i, seed);
      ex.real = i; ex.seed = seed; ex.id = `real${i + 1}-${seed}`;
      return ex;
    }
    function show(ex) {
      write('seeds', { ...read('seeds', {}), [ex.real]: ex.seed }); // the numbers to come back to
      write('last', ex.real);
      o.open(ex);
      R.menu();
    }

    const R = {
      is,
      menu() {
        const done = read('solved', []), ex = o.current(), cur = is(ex) ? ex.real : read('last', 0);
        o.pick.innerHTML = o.problems.map((pb, i) => `<option value="${i}"${i === cur ? ' selected' : ''}>${i + 1} · ${pb.title()}${done.includes(pb.id) ? ' ✓' : ''}</option>`).join('');
      },
      go(i, seed) { show(build(i, seed || read('seeds', {})[i] || newSeed())); },
      next() { const ex = o.current(); R.go(((is(ex) ? ex.real : -1) + 1) % o.problems.length, newSeed()); },
      resume() { const ex = o.current(); if (!is(ex)) R.go(Math.min(read('last', 0), o.problems.length - 1)); },
      parse(id) {
        const m = /^real(\d+)-(\d+)$/.exec(id);
        if (!m || Number(m[1]) < 1 || Number(m[1]) > o.problems.length) return null;
        const ex = build(Number(m[1]) - 1, Number(m[2]));
        write('seeds', { ...read('seeds', {}), [ex.real]: ex.seed });
        write('last', ex.real);
        return ex;
      },
      solved(ex) {
        if (!is(ex)) return;
        write('solved', [...new Set([...read('solved', []), o.problems[ex.real].id])]);
        R.menu();
      },
    };
    o.pick.addEventListener('change', () => R.go(Number(o.pick.value)));
    o.renew.addEventListener('click', () => { const ex = o.current(); R.go(is(ex) ? ex.real : Number(o.pick.value), newSeed()); });
    return R;
  }

  root.Problems = { create };
})(window);
