// Shared by the teachingphysics.ch apps (canonical copy in shared/, copied by sync.sh): the page
// language, English or German. It comes from ?lang=de in the address, else the last choice in any
// of the apps (they share their storage), else the browser's language.
//   Lang.L(en, de)        the text in the current language
//   Lang.get(), set(l)    the language; set() remembers it
//   Lang.apply(dict)      fills in [data-i18n] (text), [data-i18n-html] and [data-i18n-label]
//                         (aria-label) from dict, sets <html lang> and the EN/DE switch
//   Lang.wire(onChange)   connects the EN/DE switch (#langs) to onChange(lang)
(function (root) {
  'use strict';

  const LANGS = ['en', 'de'], KEY = 'tp-lang';
  let lang = 'en';

  const remembered = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  function initial() {
    const asked = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lang') : null;
    if (LANGS.includes(asked)) return asked;
    if (LANGS.includes(remembered())) return remembered();
    const nav = typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'en';
    return nav.toLowerCase().startsWith('de') ? 'de' : 'en';
  }

  const Lang = {
    LANGS,
    get: () => lang,
    // quiet: do not remember the choice (e.g. in tests)
    set(l, quiet) {
      lang = LANGS.includes(l) ? l : 'en';
      if (!quiet) { try { localStorage.setItem(KEY, lang); } catch (e) { /* storage unavailable */ } }
    },
    L: (en, de) => (lang === 'de' ? de : en),
    init() { lang = initial(); return lang; },
    apply(dict) {
      const text = (v) => (typeof v === 'function' ? v() : v);
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-i18n]').forEach((el) => { if (dict[el.dataset.i18n] != null) el.textContent = text(dict[el.dataset.i18n]); });
      document.querySelectorAll('[data-i18n-html]').forEach((el) => { if (dict[el.dataset.i18nHtml] != null) el.innerHTML = text(dict[el.dataset.i18nHtml]); });
      document.querySelectorAll('[data-i18n-label]').forEach((el) => { if (dict[el.dataset.i18nLabel] != null) el.setAttribute('aria-label', text(dict[el.dataset.i18nLabel])); });
      const r = document.querySelector(`input[name="lang"][value="${lang}"]`);
      if (r) r.checked = true;
    },
    wire(onChange) {
      const el = document.querySelector('#langs');
      if (el) el.addEventListener('change', (evt) => { Lang.set(evt.target.value); onChange(lang); });
    },
  };

  root.Lang = Lang;
  if (typeof module !== 'undefined') module.exports = Lang;
})(typeof window !== 'undefined' ? window : globalThis);
