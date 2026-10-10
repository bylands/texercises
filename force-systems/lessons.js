// The tutor's worked examples, from easy to hard: the situations of the worksheet
// “Übungen Kräftesysteme” (scenario and parameters as in scenarios.js), springs and air
// resistance, then a student's attempt with one wrong step (error: the practice type, p.err as in
// generator.js). Each example's practice: its stages, with the exercise types (scenarios) of each;
// where a topic has a straight case and one at an angle (or on a slope), the straight one first.
// The order of the examples and stages was changed once (version 2, see app.js: migrate), which
// moves a student's saved progress along with the content.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      scenario: 'rest-angle', p: { m: 1.5, F: 14, alpha: 30, ref: 'v' },
      practice: [{ en: 'lifted or pressed straight', de: 'senkrecht gezogen oder gedrückt', types: ['rest-up'] }, { en: 'pulled at an angle', de: 'schräg gezogen', types: ['rest-angle'] }],
      name: { en: 'At rest', de: 'In Ruhe' },
      idea: { en: 'A box at rest: the forces balance, vertically and horizontally. The pull carries part of the weight, so the normal force is less than the weight.', de: 'Eine ruhende Kiste: Die Kräfte heben sich auf, senkrecht und waagrecht. Die Zugkraft trägt einen Teil der Gewichtskraft, darum ist die Normalkraft kleiner als die Gewichtskraft.' },
    },
    {
      scenario: 'pull-friction', p: { m: 3, mu: 0.6, given: 'a', a: 2 },
      practice: [{ types: ['pull-friction'] }],
      name: { en: 'Pulled with friction', de: 'Mit Reibung gezogen' },
      idea: { en: 'Only the net force accelerates the box: the pull has to overcome friction as well.', de: 'Nur die resultierende Kraft beschleunigt die Kiste: Die Zugkraft muss auch die Reibung überwinden.' },
    },
    {
      scenario: 'push-pair', p: { m1: 3, m2: 2, mu: 0, F: 15 },
      practice: [{ types: ['push-pair'] }, { en: 'joined by a rope', de: 'mit einem Seil verbunden', types: ['rope-pair'] }],
      name: { en: 'Two boxes pushed', de: 'Zwei Kisten geschoben' },
      idea: { en: 'First both boxes together as one system, then one box alone: the left box passes on only part of the push.', de: 'Zuerst beide Kisten zusammen als ein System, dann eine Kiste allein: Die linke Kiste gibt nur einen Teil der Kraft weiter.' },
    },
    {
      scenario: 'table-pulley', p: { m1: 4, m2: 4, mu: 0.3 },
      practice: [{ types: ['table-pulley'] }, { en: 'both hanging', de: 'beide hängend', types: ['atwood'] }],
      name: { en: 'Over the table edge', de: 'Über die Tischkante' },
      idea: { en: 'A pulley turns the rope around: along the rope, the two boxes form one system. For the rope force, take one box alone: it is less than the weight of the hanging box.', de: 'Eine Rolle lenkt das Seil um: Entlang des Seils bilden die beiden Kisten ein System. Für die Seilkraft nimmt man eine Kiste allein: Sie ist kleiner als die Gewichtskraft der hängenden Kiste.' },
    },
    {
      scenario: 'incline-pull', p: { m: 4, alpha: 30, mu: 0.4, a: 3 },
      practice: [{ en: 'on level ground', de: 'auf ebenem Boden', types: ['pull-friction'] }, { en: 'up a slope', de: 'den Hang hinauf', types: ['incline-pull'] }],
      name: { en: 'Up a slope', de: 'Den Hang hinauf' },
      idea: { en: 'On a slope, split the weight into a component along the slope and one perpendicular to it.', de: 'Auf einer schiefen Ebene zerlegt man die Gewichtskraft in eine Komponente entlang und eine senkrecht zur Unterlage.' },
    },
    {
      scenario: 'incline-pulley', p: { m1: 6, m2: 8, alpha: 30, mu: 0.4 },
      practice: [{ en: 'on a level table', de: 'auf einem waagrechten Tisch', types: ['table-pulley'] }, { en: 'up a slope', de: 'den Hang hinauf', types: ['incline-pulley'] }],
      name: { en: 'Slope and pulley', de: 'Hang und Rolle' },
      idea: { en: 'Everything together: a hanging box pulls a box up a slope with friction.', de: 'Alles zusammen: Eine hängende Kiste zieht eine Kiste mit Reibung den Hang hinauf.' },
    },
    {
      scenario: 'spring-floor', p: { m: 2, k: 200, dx: 10, mu: 0.25, state: 'stretch' },
      practice: [{ types: ['spring-floor'] }, { en: 'hanging from or resting on a spring', de: 'an einer Feder hängend oder auf einer Feder liegend', types: ['spring-hang'] }],
      name: { en: 'Spring force', de: 'Federkraft' },
      idea: { en: 'A spring acts where it is attached, back towards its relaxed length: stretched, it pulls; compressed, it pushes. Its force is F = k Δx, never along the stretch.', de: 'Eine Feder wirkt dort, wo sie befestigt ist, zurück zu ihrer entspannten Länge: gedehnt zieht sie, gestaucht drückt sie. Ihre Kraft ist F = k Δx, nie in Richtung der Dehnung.' },
    },
    {
      scenario: 'drag-fall', p: { m: 80, phase: 'early', a: 4, D: 480, u: 30 },
      practice: [{ types: ['drag-fall'] }, { en: 'a cyclist coasting', de: 'eine ausrollende Radfahrerin', types: ['drag-bike'] }],
      name: { en: 'Air resistance', de: 'Luftwiderstand' },
      idea: { en: 'Air resistance points against the velocity, not against the acceleration, and grows with speed: once it is as large as the weight, a falling body has reached its terminal velocity. There is no “force of motion”.', de: 'Der Luftwiderstand zeigt gegen die Geschwindigkeit, nicht gegen die Beschleunigung, und wächst mit der Geschwindigkeit: Sobald er so gross ist wie die Gewichtskraft, hat ein fallender Körper seine Endgeschwindigkeit erreicht. Eine „Bewegungskraft“ gibt es nicht.' },
    },
    {
      error: 'error-pulley', scenario: 'table-pulley', p: { m1: 3, m2: 2, mu: 0.2, err: { eqs: [0, 1, 2], at: 3, n: 1 } },
      practice: [{ en: 'on the floor', de: 'auf dem Boden', types: ['error-floor'] }, { en: 'pulleys', de: 'Rollen', types: ['error-pulley'] }, { en: 'slopes', de: 'schiefe Ebenen', types: ['error-slope'] },
        { en: 'springs', de: 'Federn', types: ['error-spring'] }, { en: 'air resistance', de: 'Luftwiderstand', types: ['error-drag'] }],
      name: { en: 'Find the error', de: 'Finde den Fehler' },
      idea: { en: 'Check a student’s free-body diagram and equations step by step: a “force of motion”, a missing friction force, a rope force set equal to a weight, a spring force along the stretch or air resistance along the velocity.', de: 'Prüfe Kräfte und Gleichungen einer Schülerin Schritt für Schritt: eine „Bewegungskraft“, eine fehlende Reibungskraft, eine Seilkraft gleich einer Gewichtskraft, eine Federkraft in Richtung der Dehnung oder ein Luftwiderstand in Richtung der Geschwindigkeit.' },
    },
  ];

  // Saved progress of earlier versions. Version 2 changed the order of the topics and stages: Find
  // the error moved after the spring force and air resistance (topics 7, 8, 9 → 9, 7, 8); At rest
  // starts with the straight case (its stages 1 and 2 swapped); Up a slope and Slope and pulley
  // start on level ground (a new stage before the one they had). Practice keeps per topic
  // { stage, wins } (fs-progress) and the topic and stage chosen (fs-topic), each also per set
  // (key@set), and the ids of the exercises solved (fs-done: 'p7.2-1234' is topic 7, stage 2), all
  // by index (topics.js, practice.js): migrate(storage) moves them along with their content, once
  // (fs-layout). A student who had reached the last step of Find the error (all steps) goes on with
  // its new steps, on springs and air resistance.
  const LAYOUT = 2;
  const topicV2 = (t) => ({ 6: 8, 7: 6, 8: 7 })[t] ?? t;
  function stageV2(t, s) {
    if (t === 0) return [1, 0][s] ?? s; // straight, then at an angle
    if (t === 4 || t === 5) return s + 1; // level ground first
    return s; // Find the error: its three steps stay, its "all steps" is now the springs
  }
  const idV2 = (id) => String(id).replace(/^p(\d+)\.(\d+)-(\d+)$/, (x, t, s, seed) => `p${topicV2(t - 1) + 1}.${stageV2(t - 1, s - 1) + 1}-${seed}`);
  // storage: like localStorage (length, key(i), getItem, setItem)
  function migrate(storage) {
    const get = (k) => { try { return JSON.parse(storage.getItem(k)); } catch (e) { return null; } };
    const set = (k, v) => storage.setItem(k, JSON.stringify(v));
    if ((get('fs-layout') || 1) >= LAYOUT) return;
    const keys = [];
    for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
    keys.forEach((key) => {
      const m = /^fs-(progress|topic|done)(@.*)?$/.exec(key), v = m && get(key);
      if (!v || typeof v !== 'object') return;
      if (m[1] === 'progress') {
        const out = {};
        Object.entries(v).forEach(([t, p]) => { out[topicV2(Number(t))] = p && typeof p === 'object' ? { ...p, stage: stageV2(Number(t), p.stage || 0) } : p; });
        set(key, out);
      } else if (m[1] === 'topic' && Number.isInteger(v.topic)) {
        set(key, v.topic < 0 ? v : { ...v, topic: topicV2(v.topic), stage: stageV2(v.topic, v.stage || 0) });
      } else if (m[1] === 'done' && Array.isArray(v)) set(key, v.map(idV2));
    });
    set('fs-layout', LAYOUT);
  }
  // a worked example of a set saved before there were objectives (seven examples then)
  const oldTutor = (i) => (i === 6 ? 8 : i);

  root.Lessons = { EXAMPLES, LAYOUT, migrate, oldTutor };
  if (typeof module !== 'undefined') module.exports = root.Lessons;
})(typeof window !== 'undefined' ? window : globalThis);
