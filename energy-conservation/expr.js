// Formulas typed by the student, such as sqrt(2/3 g h), √(2gh), v0^2/(2g) or 1/2 g s: parsed into a
// tree that can be evaluated and shown in KaTeX. A product may be written without a sign (2gh),
// a root without brackets reaches to the end of the product (√2gh = √(2gh)), and ² and ³ work as
// exponents. Variables are single letters, optionally with an index (v0, v_0, v₀, h1); l and L
// stand for ℓ. A prime (h') makes a variable of its own, so that it can be named in a message.
//   Expr.parse(text)          { tree } or { error: { key, at } }
//   Expr.vars(tree)           the variables used: ['g', 'h']
//   Expr.evaluate(tree, V)    the value for the variables V ({ g: 9.81, h: 2 })
//   Expr.tex(tree)            KaTeX
//   Expr.same(tree, f, base, vars)  whether the formula equals f(V) for values around base
//                             (each variable of vars between 0.6 and 1.4 times its base value)
(function (root) {
  'use strict';

  const FUNCS = { sqrt: 'sqrt', wurzel: 'sqrt', root: 'sqrt', '√': 'sqrt' };
  const SUBS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3' };

  function tokenize(s) {
    const out = [];
    let i = 0;
    s = s.replace(/[−–—‒]/g, '-').replace(/[·×⋅∙]/g, '*').replace(/[:÷]/g, '/').replace(/\*\*/g, '^').replace(/[‘’′´`]/g, "'");
    while (i < s.length) {
      const c = s[i], rest = s.slice(i);
      if (/\s/.test(c)) { i++; continue; }
      let m = rest.match(/^\d+(?:[.,]\d+)?|^[.,]\d+/);
      if (m) { out.push({ t: 'num', v: Number(m[0].replace(',', '.')), at: i }); i += m[0].length; continue; }
      m = rest.match(/^(sqrt|wurzel|root)/i);
      if (m) { out.push({ t: 'fn', v: FUNCS[m[0].toLowerCase()], at: i }); i += m[0].length; continue; }
      if (c === '√') { out.push({ t: 'fn', v: 'sqrt', at: i }); i++; continue; }
      m = rest.match(/^([A-Za-zℓ])(?:_?([0-9])|([₀₁₂₃]))?('?)/);
      if (m) {
        let l = m[1] === 'ℓ' || m[1] === 'L' ? 'l' : m[1].toLowerCase();
        const sub = m[2] || (m[3] && SUBS[m[3]]) || '';
        out.push({ t: 'var', v: `${l}${m[4] ? 'p' : ''}${sub}`, at: i });
        i += m[0].length;
        continue;
      }
      if (c === '²' || c === '³') { out.push({ t: 'op', v: '^' }, { t: 'num', v: c === '²' ? 2 : 3, at: i }); i++; continue; }
      if ('+-*/^()[]{}'.includes(c)) { out.push({ t: 'op', v: c === '[' || c === '{' ? '(' : c === ']' || c === '}' ? ')' : c, at: i }); i++; continue; }
      return { error: { key: 'char', at: i, ch: c } };
    }
    return { tokens: out };
  }

  // expr = term (± term)*; term = unary ((* | / | nothing) unary)*; unary = -unary | power;
  // power = atom (^ unary)?; atom = number | variable | (expr) | √ atom-or-product
  function parse(text) {
    if (!text || !text.trim()) return { error: { key: 'empty' } };
    const tk = tokenize(text);
    if (tk.error) return tk;
    const t = tk.tokens;
    let i = 0;
    const peek = () => t[i], isOp = (v) => t[i] && t[i].t === 'op' && t[i].v === v;
    const fail = (key) => { throw { key, at: t[i] ? t[i].at : text.length }; };
    const starts = () => t[i] && (t[i].t !== 'op' || t[i].v === '(');

    function expr() {
      let a = term();
      while (isOp('+') || isOp('-')) { const op = t[i++].v; a = { k: op === '+' ? 'add' : 'sub', a, b: term() }; }
      return a;
    }
    function term() {
      let a = unary();
      for (;;) {
        if (isOp('*') || isOp('/')) { const op = t[i++].v; a = { k: op === '*' ? 'mul' : 'div', a, b: unary() }; }
        else if (starts()) a = { k: 'mul', a, b: power(), implicit: true };
        else return a;
      }
    }
    function unary() {
      if (isOp('-')) { i++; return { k: 'neg', a: unary() }; }
      if (isOp('+')) { i++; return unary(); }
      return power();
    }
    function power() {
      const a = atom();
      if (isOp('^')) { i++; return { k: 'pow', a, b: unary() }; }
      return a;
    }
    function atom() {
      const x = peek();
      if (!x) fail('end');
      if (x.t === 'num') { i++; return { k: 'num', v: x.v }; }
      if (x.t === 'var') { i++; return { k: 'var', v: x.v }; }
      if (x.t === 'fn') {
        i++;
        // with brackets: sqrt(...)^2 is the square of the root; without: the rest of the product
        if (isOp('(')) { i++; const a = expr(); if (!isOp(')')) fail('close'); i++; return { k: 'sqrt', a, b: true }; }
        if (!starts()) fail('arg');
        let a = power();
        while (starts() || isOp('*') || isOp('/')) {
          if (isOp('*') || isOp('/')) { const op = t[i++].v; a = { k: op === '*' ? 'mul' : 'div', a, b: power() }; }
          else a = { k: 'mul', a, b: power(), implicit: true };
        }
        return { k: 'sqrt', a };
      }
      if (isOp('(')) { i++; const a = expr(); if (!isOp(')')) fail('close'); i++; return { k: 'par', a }; }
      fail(isOp(')') ? 'open' : 'operand');
    }

    try {
      const tree = expr();
      if (i < t.length) fail(isOp(')') ? 'open' : 'operand');
      return { tree };
    } catch (e) {
      if (e && e.key) return { error: e };
      throw e;
    }
  }

  function vars(tree, out = new Set()) {
    if (!tree) return [...out];
    if (tree.k === 'var') out.add(tree.v);
    if (tree.a) vars(tree.a, out);
    if (tree.b && typeof tree.b === 'object') vars(tree.b, out);
    return [...out];
  }

  function evaluate(n, V) {
    switch (n.k) {
      case 'num': return n.v;
      case 'var': return V[n.v] == null ? NaN : V[n.v];
      case 'par': return evaluate(n.a, V);
      case 'neg': return -evaluate(n.a, V);
      case 'add': return evaluate(n.a, V) + evaluate(n.b, V);
      case 'sub': return evaluate(n.a, V) - evaluate(n.b, V);
      case 'mul': return evaluate(n.a, V) * evaluate(n.b, V);
      case 'div': return evaluate(n.a, V) / evaluate(n.b, V);
      case 'pow': return Math.pow(evaluate(n.a, V), evaluate(n.b, V));
      case 'sqrt': return Math.sqrt(evaluate(n.a, V));
      default: return NaN;
    }
  }

  // ---------------------------------------------------------------- KaTeX
  const VTEX = (v) => {
    const m = v.match(/^([a-z])(p?)(\d?)$/);
    if (!m) return v;
    return `${m[1] === 'l' ? '\\ell' : m[1]}${m[2] ? "'" : ''}${m[3] ? `_${m[3]}` : ''}`;
  };
  const PREC = { add: 1, sub: 1, neg: 2, mul: 3, div: 3, pow: 4, num: 5, var: 5, par: 5, sqrt: 5 };
  // A number written right after another: 2·3, not 23; and 2·(…) stays as typed.
  const startsNum = (n) => n.k === 'num' || ((n.k === 'mul' || n.k === 'pow') && startsNum(n.a));
  function tex(n) {
    const wrap = (c, min) => (PREC[c.k] < min ? `\\left(${tex(c)}\\right)` : tex(c));
    switch (n.k) {
      case 'num': return String(n.v).replace('.', root.EC && root.EC.getLang() === 'de' ? '{,}' : '.');
      case 'var': return VTEX(n.v);
      case 'par': return `\\left(${tex(n.a)}\\right)`;
      case 'neg': return `-${wrap(n.a, 3)}`;
      case 'add': return `${tex(n.a)} + ${wrap(n.b, 2)}`;
      case 'sub': return `${tex(n.a)} - ${wrap(n.b, 2)}`;
      case 'mul': {
        const a = wrap(n.a, 3), b = wrap(n.b, 3);
        return startsNum(n.b) || n.b.k === 'neg' ? `${a} \\cdot ${b}` : `${a}\\,${b}`;
      }
      case 'div': return `\\frac{${tex(n.a.k === 'par' ? n.a.a : n.a)}}{${tex(n.b.k === 'par' ? n.b.a : n.b)}}`;
      case 'pow': return `{${wrap(n.a, 5)}}^{${tex(n.b.k === 'par' ? n.b.a : n.b)}}`;
      case 'sqrt': return `\\sqrt{${tex(n.a)}}`;
      default: return '?';
    }
  }

  // ---------------------------------------------------------------- comparison
  // Deterministic sample values, so that a check gives the same verdict every time.
  function samples(base, vars, n = 8) {
    let s = 12345;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const out = [];
    for (let k = 0; k < n; k++) {
      const V = { ...base };
      for (const v of vars) V[v] = base[v] * (0.6 + 0.8 * r());
      out.push(V);
    }
    return out;
  }
  const close = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(Math.abs(x), Math.abs(y), 1e-12);
  // tree may also be a function of V. Values where f is undefined are skipped.
  function same(tree, f, base, vars) {
    const val = typeof tree === 'function' ? tree : (V) => evaluate(tree, V);
    let compared = 0;
    for (const V of samples(base, vars)) {
      const want = f(V);
      if (!Number.isFinite(want)) continue;
      const got = val(V);
      if (!Number.isFinite(got) || !close(got, want)) return false;
      compared++;
    }
    return compared > 0;
  }

  root.Expr = { parse, vars, evaluate, tex, same, samples };
  if (typeof module !== 'undefined') module.exports = root.Expr;
})(typeof window !== 'undefined' ? window : globalThis);
