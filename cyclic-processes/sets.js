// Shared by the learningphysics.ch apps (canonical copy in shared/, copied by sync.sh).
// Sets of apps for a class: in the admin panel (/admin/), the teacher chooses some apps and, in
// each, its modes and, for the tutor and practice, the worked examples and the stages. The set is
// opened at /<name>: the hub page with only its apps, which link to /<app>/?set=<name>. Here, in
// the app, the set hides what it leaves out (it is a view, not access control). It is remembered
// for the tab (sessionStorage lp-set: { name, set }, written by the hub page), so that it applies
// before the app starts; an app opened with ?set= without it waits for /sets.json and reloads.
// ?set= (empty) leaves the set, and so does the hub page at /.
//   LPSets.name                the set's name, or null
//   LPSets.mode(m)             whether mode m (tutor, practice, real, arcade) is in the set
//   LPSets.tutor()             the indices of the worked examples to show, or null (all)
//   LPSets.practice()          the keys of the practice stages to offer, or null (all)
//   LPSets.kinds(kinds)        the arcade's kinds in the set: a kind that is a practice type only
//                              if a chosen stage has it (all, if none is left)
//   LPSets.register(what, x)   topics.js ('topics', the app's topics) and tutor.js ('tutor',
//                              { names() }) say what the app has
//   LPSets.stageKey(stage)     a stage's key: its types joined with '+'
//   LPSets.lang()              the language the set fixes ('en', 'de'), or null (the student's
//                              choice); lang.js asks for it
// With ?outline=1 (the admin panel loads the app in a hidden frame), the app posts its modes,
// worked examples and topics with their stages to the page that holds the frame (same origin).
(function (root) {
  'use strict';

  const KEY = 'lp-set', NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
  const stageKey = (stage) => stage.types.join('+');
  // the types of the stages whose keys are given
  const typesOf = (topics, keys) => new Set(topics.flatMap((t) => t.stages.filter((s) => keys.includes(stageKey(s))).flatMap((s) => s.types)));
  function filterKinds(kinds, topics, keys) {
    if (!keys || !topics) return kinds;
    const all = typesOf(topics, topics.flatMap((t) => t.stages.map(stageKey))), on = typesOf(topics, keys);
    const left = kinds.filter((k) => !all.has(k.id) || on.has(k.id));
    return left.length ? left : kinds;
  }
  const pure = { stageKey, typesOf, filterKinds, NAME };
  if (typeof document === 'undefined') { if (typeof module !== 'undefined') module.exports = pure; return; }

  const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } };
  const save = (v) => { try { if (v) sessionStorage.setItem(KEY, JSON.stringify(v)); else sessionStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ } };
  const q = new URLSearchParams(location.search), outline = q.get('outline') === '1';
  const app = (location.pathname.match(/^\/([a-z0-9-]+)\//) || [])[1];
  let stored = read(), name = outline ? null : q.get('set');
  if (name === '') { save(null); stored = null; }
  if (name == null && stored && !outline) name = stored.name;
  if (name && !NAME.test(name)) name = null;
  const set = name && stored && stored.name === name && stored.set && typeof stored.set === 'object' ? stored.set : null;
  const entry = set && Array.isArray(set.apps) ? set.apps.find((a) => a && a.id === app) || null : null;
  const reg = {};

  // a set not yet known in this tab: wait for it (the page hidden), then reload with it
  function fetchSet(then) {
    fetch('/sets.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      then(d && d.sets && typeof d.sets === 'object' && d.sets[name] && typeof d.sets[name] === 'object' ? d.sets[name] : null);
    }).catch(() => then(undefined));
  }
  if (name && !set) {
    const style = document.createElement('style');
    style.textContent = 'body { visibility: hidden; }';
    document.head.append(style);
    const show = () => style.remove();
    setTimeout(show, 3000);
    fetchSet((s) => { if (s) { save({ name, set: s }); location.reload(); } else { if (s === null) save(null); show(); } });
  } else if (set) {
    // the teacher may have changed it since: then reload with the new one
    fetchSet((s) => {
      if (s === undefined || JSON.stringify(s) === JSON.stringify(set)) return;
      save(s ? { name, set: s } : null);
      location.reload();
    });
  }

  const modeOn = (m) => !entry || (Array.isArray(entry.modes) && entry.modes.includes(m));
  const LPSets = {
    name: set ? name : null,
    mode: modeOn,
    tutor: () => (entry && Array.isArray(entry.tutor) ? entry.tutor.filter(Number.isInteger) : null),
    practice: () => (entry && Array.isArray(entry.practice) ? entry.practice.filter((k) => typeof k === 'string') : null),
    kinds: (kinds) => filterKinds(kinds, reg.topics, LPSets.practice()),
    register(what, x) { reg[what] = x; },
    stageKey,
    lang: () => (set && ['en', 'de'].includes(set.lang) ? set.lang : null),
  };
  root.LPSets = LPSets;

  const text = (html) => { const d = document.createElement('div'); d.innerHTML = String(html == null ? '' : html); return d.textContent.trim(); };
  function outlineOf() {
    const modes = [...document.querySelectorAll('input[name="mode"]')].map((r) => r.value);
    return {
      type: 'lp-outline', app, modes,
      tutor: reg.tutor ? reg.tutor.names().map(text) : [],
      topics: (reg.topics || []).map((t) => ({ name: text(t.name()), stages: t.stages.map((s) => ({ name: s.name ? text(s.name()) : null, key: stageKey(s) })) })),
    };
  }

  // once the app has started (its own handlers have run): hide the modes not in the set, leave one
  // that is not, and point the home link to the set
  function after() {
    if (outline) { if (root.parent !== root) root.parent.postMessage(outlineOf(), location.origin); return; }
    if (!set) return;
    const home = document.querySelector('a.home');
    if (home) home.href = `/${name}`;
    if (!entry) return;
    const radios = [...document.querySelectorAll('input[name="mode"]')];
    radios.forEach((r) => { const l = r.closest('label'); if (l) l.hidden = !modeOn(r.value); });
    const cur = radios.find((r) => r.checked), first = radios.find((r) => modeOn(r.value));
    if (first && (!cur || !modeOn(cur.value))) {
      first.checked = true;
      first.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  // (deferred, this file runs before the app, maybe in another task: wait for the end of parsing)
  if (document.readyState === 'complete') setTimeout(after);
  else document.addEventListener('DOMContentLoaded', () => setTimeout(after));
})(typeof window !== 'undefined' ? window : globalThis);
