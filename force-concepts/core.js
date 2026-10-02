// Force concepts: conceptual questions on gravity, inertia, net force and interactions, in the
// spirit of the Force Concept Inventory (Hestenes, Wells & Swackhamer, 1992). The situations are
// our own and randomised; the wrong options follow the misconceptions the inventory probes, and
// every wrong option carries the misconception it stands for and an explanation.
//
// A scenario generator is fn(r, params) → { title, situation, figure, questions, hints, steps },
// where questions are [{ key, prompt, pics, options: [{ label, ok, code, why, text }] }] (pics:
// the labels are small drawings, and text describes them in words), hints go from what to look
// at to the plan, the law and the result, and steps are the worked solution [{ title, text,
// figure }], used for the solution and as the tutor's frames. The topic files register their
// generators here.
//
// Besides single choice (type 'choice', the default), a question can be a true/false set ('tf'),
// a ranking ('rank'), a matching ('match') or a prediction with its explanation ('two'); see the
// constructors below. Each wrong element carries a misconception code and an explanation.
//
// Languages: English and German (Swiss spelling, no ß). The generators write every text with
// T(english, german), read at generation time; the random numbers do not depend on the language,
// so the same seed gives the same exercise, with the options in the same order, in both.
(function (root) {
  'use strict';

  const LANGS = ['en', 'de'];
  let lang = 'en';
  const setLang = (l) => { lang = LANGS.includes(l) ? l : 'en'; };
  const getLang = () => lang;
  const T = (en, de) => (lang === 'de' ? de : en);

  const TOPICS = {
    mixed: { en: 'Mixed', de: 'Gemischt' },
    gravity: { en: 'Gravity', de: 'Schwerkraft' },
    inertia: { en: 'Inertia', de: 'Trägheit' },
    force: { en: 'Net force', de: 'Resultierende' },
    interact: { en: 'Interaction', de: 'Wechselwirkung' },
  };
  const topicName = (k) => TOPICS[k][lang];

  const MIS = {
    impetus: {
      en: ['Impetus', 'The push or throw is stored in the body, keeps it going and slowly wears off.'],
      de: ['Impetus', 'Der Stoss oder Wurf wird im Körper gespeichert, hält ihn in Bewegung und lässt langsam nach.'],
    },
    'active-force': {
      en: ['Motion needs a force', 'A body only moves, or keeps its speed, as long as a force pushes it along; the speed follows the force.'],
      de: ['Bewegung braucht Kraft', 'Ein Körper bewegt sich nur so lange (oder behält seine Geschwindigkeit nur so lange), wie eine Kraft ihn antreibt; die Geschwindigkeit folgt der Kraft.'],
    },
    'last-force': {
      en: ['The last force decides', 'After a push, a body moves in the direction of the last push and forgets its earlier motion.'],
      de: ['Die letzte Kraft entscheidet', 'Nach einem Stoss bewegt sich ein Körper in Richtung des letzten Stosses und vergisst seine frühere Bewegung.'],
    },
    'largest-force': {
      en: ['The largest force wins', 'When several forces act, the body moves along the largest one; the others do not count.'],
      de: ['Die grösste Kraft gewinnt', 'Wirken mehrere Kräfte, bewegt sich der Körper in Richtung der grössten; die anderen zählen nicht.'],
    },
    'circular-impetus': {
      en: ['Circular impetus', 'A body that has been moving in a circle keeps curving for a while after it is released.'],
      de: ['Kreis-Impetus', 'Ein Körper, der sich im Kreis bewegt hat, fliegt nach dem Loslassen noch eine Weile im Bogen weiter.'],
    },
    centrifugal: {
      en: ['Centrifugal push', 'A body moving in a circle is pushed outward and flies outward when it is released.'],
      de: ['Fliehkraft nach aussen', 'Ein Körper auf einer Kreisbahn wird nach aussen gedrückt und fliegt beim Loslassen nach aussen weg.'],
    },
    'heavier-faster': {
      en: ['Heavier falls faster', 'Heavier bodies fall faster, because gravity pulls harder on them.'],
      de: ['Schwerer fällt schneller', 'Schwerere Körper fallen schneller, weil die Schwerkraft stärker an ihnen zieht.'],
    },
    'rest-no-force': {
      en: ['At rest, no force', 'A body that is at rest, even for a moment, has no force acting on it or no acceleration.'],
      de: ['In Ruhe, keine Kraft', 'Auf einen Körper, der (auch nur kurz) ruht, wirkt keine Kraft, oder er hat keine Beschleunigung.'],
    },
    'mass-wins': {
      en: ['The larger mass pushes harder', 'In an interaction, the heavier body exerts the larger force.'],
      de: ['Die grössere Masse drückt stärker', 'Bei einer Wechselwirkung übt der schwerere Körper die grössere Kraft aus.'],
    },
    'active-wins': {
      en: ['The active one pushes harder', 'In an interaction, the body that is faster or does the pushing exerts the larger force.'],
      de: ['Wer aktiv ist, drückt stärker', 'Bei einer Wechselwirkung übt der Körper, der schneller ist oder stösst, die grössere Kraft aus.'],
    },
    obstacle: {
      en: ['Obstacles exert no force', 'Tables, ropes, walls or parked cars only block the way; they do not push or pull.'],
      de: ['Hindernisse üben keine Kraft aus', 'Tische, Seile, Wände oder parkierte Autos sind nur im Weg; sie drücken oder ziehen nicht.'],
    },
    'pair-confusion': {
      en: ['Balance mistaken for interaction', 'Two forces that balance on one body are taken for an action–reaction pair.'],
      de: ['Gleichgewicht mit Wechselwirkung verwechselt', 'Zwei Kräfte, die sich an einem Körper aufheben, werden für ein Kraft-Gegenkraft-Paar gehalten.'],
    },
    'vector-add': {
      en: ['Directions ignored', 'Velocities or forces are added as plain numbers, ignoring their directions.'],
      de: ['Richtungen vergessen', 'Geschwindigkeiten oder Kräfte werden wie Zahlen addiert, ohne ihre Richtungen zu beachten.'],
    },
  };
  const mis = (code) => (MIS[code] ? { name: MIS[code][lang][0], text: MIS[code][lang][1] } : null);

  // ---------------------------------------------------------------- random numbers
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = (arr) => arr[Math.floor(next() * arr.length)];
    const shuffle = (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    };
    return { next, pick, shuffle };
  }

  // ---------------------------------------------------------------- text helpers
  const it = (s) => `<i>${s}</i>`;
  // Force symbols by meaning; German uses its own subscripts (F_S Seilkraft, F_R Reibung, …).
  // Anything else (1, 2, …) is used as it is.
  const SUBS = {
    G: ['G', 'G'], N: ['N', 'N'], T: ['T', 'S'], f: ['f', 'R'], R: ['R', 'W'], D: ['D', 'L'],
    net: ['net', 'res'], push: ['push', 'D'], drive: ['drive', 'A'], res: ['res', 'W'],
  };
  const sub = (k) => (SUBS[k] ? SUBS[k][lang === 'de' ? 1 : 0] : k);
  const F = (k) => `<i>F</i><sub>${sub(k)}</sub>`;   // HTML
  const FL = (k) => `F_${sub(k)}`;                    // label in a picture
  const list = (xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // Numbers with sig significant digits, without trailing zeros (decimal point in both
  // languages); units after a no-break space.
  const num = (x, sig = 2) => String(Number(x.toPrecision(sig)));
  const qty = (x, unit, sig = 2) => `${num(x, sig)}&nbsp;${unit}`;
  const deg = (rad) => Math.round((rad * 180) / Math.PI);

  // German nouns with their articles: noun('m', 'Ball').acc → 'den Ball', .einen → 'einen Ball',
  // .er/.ihn/.ihm → pronouns.
  const DEF = { nom: { m: 'der', f: 'die', n: 'das' }, acc: { m: 'den', f: 'die', n: 'das' }, dat: { m: 'dem', f: 'der', n: 'dem' } };
  const IND = { nom: { m: 'ein', f: 'eine', n: 'ein' }, acc: { m: 'einen', f: 'eine', n: 'ein' }, dat: { m: 'einem', f: 'einer', n: 'einem' } };
  const noun = (g, word) => ({
    g, word,
    nom: `${DEF.nom[g]} ${word}`, acc: `${DEF.acc[g]} ${word}`, dat: `${DEF.dat[g]} ${word}`,
    ein: `${IND.nom[g]} ${word}`, einen: `${IND.acc[g]} ${word}`, einem: `${IND.dat[g]} ${word}`,
    er: { m: 'er', f: 'sie', n: 'es' }[g], ihn: { m: 'ihn', f: 'sie', n: 'es' }[g], ihm: { m: 'ihm', f: 'ihr', n: 'ihm' }[g],
  });

  // An option: code 'ok' for the right one, otherwise a key of MIS or 'other'.
  const o = (label, code, why, text) => ({ label, ok: code === 'ok', code, why, text: text || label });
  const q = (r, key, prompt, options, pics = false) => ({ type: 'choice', key, prompt, pics, options: r.shuffle(options) });

  // ---------------------------------------------------------------- other question formats
  // True/false set: statements { text, value, why, code } (code: the misconception behind a wrong
  // judgement of this statement).
  const stmt = (text, value, why, code = 'other') => ({ text, value, why, code });
  const tf = (r, key, prompt, items) => ({ type: 'tf', key, prompt, items: r.shuffle(items) });
  // Ranking from the largest (rank 1) down; equal values share a rank. items { label, name, value,
  // alt: { trap: value } } in a fixed order (they are named A, B, … in the picture); traps
  // { key, code, why }: the order a misconception gives, from the values alt[key]; why: the reason
  // for the right order.
  const rank = (key, prompt, items, traps, why) => ({ type: 'rank', key, prompt, items, traps, why });
  // Matching: each item { label, name, answer: choice id, why, wrong: { choice id: { code, why } },
  // other } gets one of the choices { id, label, name } (a choice may fit several items or none);
  // other explains any wrong choice without its own entry in wrong.
  const match = (key, prompt, items, choices, pics = false) => ({ type: 'match', key, prompt, pics, items, choices });
  // Predict and explain: a prediction (options, one right) and its reason (reasons, one right).
  const two = (r, key, prompt, reasonPrompt, options, reasons, pics = false) =>
    ({ type: 'two', key, prompt, reasonPrompt, pics, options: r.shuffle(options), reasons: r.shuffle(reasons) });

  // Competition ranks from the largest: [5, 7, 5] → [2, 1, 2].
  const ranksOf = (vs) => vs.map((v) => 1 + vs.filter((w) => w > v + 1e-9).length);
  // The items in rank order, as text: "B > A = C".
  function rankText(items, vs) {
    const rk = ranksOf(vs), idx = items.map((x, i) => i).sort((a, b) => rk[a] - rk[b]);
    return idx.map((i, k) => (k === 0 ? '' : rk[i] === rk[idx[k - 1]] ? ' = ' : ' > ') + items[i].name).join('');
  }
  const TRUE = () => T('true', 'richtig'), FALSE = () => T('false', 'falsch');
  const answerOf = (opts) => opts.find((x) => x.ok);

  // The right answer to a question, as HTML.
  function answerText(qu) {
    switch (qu.type) {
      case 'tf': return qu.items.map((x) => `${x.text} — <b>${x.value ? TRUE() : FALSE()}</b>`).join('<br>');
      case 'rank': return rankText(qu.items, qu.items.map((x) => x.value));
      case 'match': return qu.items.map((x) => `${x.name} → ${qu.choices.find((c) => c.id === x.answer).name}`).join('; ');
      case 'two': return `${answerOf(qu.options).text} ${T('Reason:', 'Begründung:')} ${answerOf(qu.reasons).text}`;
      default: return answerOf(qu.options).text;
    }
  }

  // The typical wrong answers to a question: [{ text, code, why }].
  function misreads(qu) {
    switch (qu.type) {
      case 'tf': return qu.items.map((x) => ({ text: `${x.text} — ${x.value ? FALSE() : TRUE()}`, code: x.code, why: x.why }));
      case 'rank': return qu.traps.map((t) => ({ text: rankText(qu.items, qu.items.map((x) => x.alt[t.key])), code: t.code, why: t.why }));
      case 'match': return qu.items.flatMap((x) => Object.entries(x.wrong || {}).map(([id, w]) =>
        ({ text: `${x.name} → ${qu.choices.find((c) => c.id === id).name}`, code: w.code, why: w.why })));
      case 'two': return [...qu.options, ...qu.reasons].filter((x) => !x.ok);
      default: return qu.options.filter((x) => !x.ok);
    }
  }

  // ---------------------------------------------------------------- registry
  const GENS = {};
  const POOLS = { gravity: [], inertia: [], force: [], interact: [] };
  const FORMATS = {
    all: { en: 'All formats', de: 'Alle Formate' },
    choice: { en: 'Single choice', de: 'Einfachauswahl' },
    sort: { en: 'Sort & match', de: 'Ordnen & zuordnen' },
    predict: { en: 'Predict & explain', de: 'Vorhersagen & begründen' },
    tf: { en: 'True or false', de: 'Richtig oder falsch' },
  };
  const formatName = (k) => FORMATS[k][lang];
  function register(topic, name, fn, params = {}, format = 'choice') {
    GENS[name] = fn;
    POOLS[topic].push({ name, params, format });
  }

  function finish(ex, id, topic, gen) {
    ex.id = id;
    ex.topic = topic;
    ex.gen = gen;
    ex.lang = lang;
    ex.short = ex.questions.map((qu) => ({ prompt: qu.prompt, answer: answerText(qu) }));
    return ex;
  }

  // The exercises of a topic in a format ('all' for any); a topic without that format falls back
  // to all topics. Ids: topic-seed, or topic-format-seed when a format is chosen.
  function pool(topic, format = 'all') {
    const all = topic === 'mixed' ? Object.values(POOLS).flat() : POOLS[topic];
    if (format === 'all') return all;
    const some = all.filter((g) => g.format === format);
    return some.length ? some : Object.values(POOLS).flat().filter((g) => g.format === format);
  }
  // The exercise type (generator) a seed gives: the first random number picks it.
  const genOf = (topic, seed, format = 'all') => rng(seed).pick(pool(topic, format)).name;

  // Names of the exercise types, for the student's overview.
  const TYPE_NAMES = {
    drop: ['Heavy and light', 'Schwer und leicht'], rolloff: ['Launched horizontally', 'Horizontal abgeworfen'], throw: ['Forces in flight', 'Kräfte im Flug'],
    kick: ['A brief kick', 'Ein kurzer Stoss'], circle: ['Leaving a circle', 'Aus dem Kreis'], engine: ['Engine on, engine off', 'Triebwerk an, Triebwerk aus'],
    balance: ['Comparing two forces', 'Zwei Kräfte vergleichen'], thruster: ['Thrust to the side', 'Schub zur Seite'], 'two-forces': ['Two strings', 'Zwei Schnüre'],
    collision: ['Truck and car', 'Lastwagen und Auto'], 'push-apart': ['On the ice', 'Auf dem Eis'], 'push-car': ['Pushing a van', 'Einen Lieferwagen schieben'],
    support: ['Resting and hanging', 'Liegen und hängen'], 'rank-elevator': ['Four elevator rides', 'Vier Liftfahrten'], 'rank-launch': ['Four balls off the table', 'Vier Kugeln vom Tisch'],
    'match-diagrams': ['Free-body diagrams', 'Kräftediagramme'], 'match-partners': ['Third-law partners', 'Kraft und Gegenkraft'], 'cart-launcher': ['Ball from a moving cart', 'Ball vom fahrenden Wagen'],
    magnets: ['Magnets', 'Magnete'], 'pendulum-cut': ['Cutting the pendulum string', 'Pendelschnur durchschneiden'], ramp: ['Up and down the ramp', 'Die Rampe hinauf und hinunter'],
    'tf-throw': ['True or false: thrown up', 'Richtig oder falsch: hochgeworfen'], 'tf-motion': ['True or false: Newton’s laws', 'Richtig oder falsch: Newtonsche Gesetze'],
    'tf-interact': ['True or false: pulling on each other', 'Richtig oder falsch: gegenseitige Anziehung'],
  };
  const typeName = (gen) => (TYPE_NAMES[gen] ? TYPE_NAMES[gen][lang === 'de' ? 1 : 0] : gen);

  // How hard each type was for the student: stats { type: { n, s } }, s a moving average of the
  // scores in [0, 1] (0: right at once, 1: solution needed). A type comes up with weight
  // 1 + 3·s, so up to 4 times as often as a mastered one; an unseen type counts as s = 0.35.
  const UNSEEN = 0.35;
  function recordResult(stats, gen, score) {
    const old = stats[gen];
    const s = old ? 0.6 * old.s + 0.4 * score : score;
    return { ...stats, [gen]: { n: (old ? old.n : 0) + 1, s: Number(s.toFixed(3)) } };
  }
  const weightOf = (stats, gen) => 1 + 3 * (stats[gen] ? stats[gen].s : UNSEEN);

  // A new random seed for the next exercise. Its type is drawn with these weights from the types
  // available, leaving out the last few in recent (the types shown so far, oldest first): about
  // half of the types, at most 8, are held back, so the same type does not come back too soon.
  // With a single type there is no choice.
  function freshSeed(topic, format = 'all', recent = [], random = Math.random, stats = {}) {
    const types = [...new Set(pool(topic, format).map((g) => g.name))], w = Math.min(8, Math.floor(types.length / 2));
    const avoid = w ? recent.slice(-w) : [];
    const allowed = types.filter((t) => !avoid.includes(t));
    const from = allowed.length ? allowed : types;
    const ws = from.map((t) => weightOf(stats, t)), total = ws.reduce((a, b) => a + b, 0);
    let x = random() * total, type = from[from.length - 1];
    for (let i = 0; i < from.length; i++) { x -= ws[i]; if (x < 0) { type = from[i]; break; } }
    let seed = 1 + Math.floor(random() * 999999);
    for (let i = 0; i < 5000 && genOf(topic, seed, format) !== type; i++) seed = 1 + Math.floor(random() * 999999);
    return seed;
  }

  function generate(topic, seed, format = 'all') {
    const r = rng(seed);
    const g = r.pick(pool(topic, format));
    const ex = finish(GENS[g.name](r, { ...g.params }), format === 'all' ? `${topic}-${seed}` : `${topic}-${format}-${seed}`, topic, g.name);
    ex.format = format;
    return ex;
  }

  // A fixed exercise (for the tutor): the generator with the given parameters.
  function build(gen, params, seed = 1) {
    return finish(GENS[gen](rng(seed), { ...params }), `tutor-${gen}`, 'tutor', gen);
  }

  const api = {
    LANGS, setLang, getLang, T, TOPICS, topicName, FORMATS, formatName, MIS, mis, POOLS, GENS, rng,
    it, F, FL, list, cap, num, qty, deg, noun, o, q, stmt, tf, rank, match, two, ranksOf, rankText, answerText, misreads,
    register, pool, genOf, freshSeed, generate, build, TYPE_NAMES, typeName, recordResult, weightOf,
  };
  root.FC = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
