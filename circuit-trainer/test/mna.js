'use strict';

// Modified nodal analysis. Elements: ['R', name, a, b, ohms] or ['V', name, plus, minus, volts]; node 0 is ground.
function solve(E) {
  const nodes = Math.max(...E.flatMap((e) => [e[2], e[3]]));
  const srcs = E.filter((e) => e[0] === 'V');
  const n = nodes + srcs.length;
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  const at = (i, j, x) => { if (i > 0 && j > 0) A[i - 1][j - 1] += x; };
  for (const [type, , a, b, val] of E) {
    if (type !== 'R') continue;
    const g = 1 / val;
    at(a, a, g); at(b, b, g); at(a, b, -g); at(b, a, -g);
  }
  srcs.forEach(([, , a, b, val], k) => {
    const r = nodes + k;
    if (a > 0) { A[a - 1][r] += 1; A[r][a - 1] += 1; }
    if (b > 0) { A[b - 1][r] -= 1; A[r][b - 1] -= 1; }
    A[r][n] = val;
  });
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  const x = A.map((row, i) => row[n] / row[i]);
  const v = (node) => (node === 0 ? 0 : x[node - 1]);
  const byName = Object.fromEntries(E.map((e) => [e[1], e]));
  return { v, i: (name) => { const [, , a, b, R] = byName[name]; return (v(a) - v(b)) / R; } };
}

module.exports = { solve };
