#!/usr/bin/env python3
"""Admin panel of the teachingphysics.ch hub: tags (e.g. physics topics) and the order of the apps.

The hub page (hub/index.html, served as /) shows a card per app; it reads /apps.json and puts the
cards in its order, shows their tags, and lets visitors filter by tag. This service, served at
/admin/ behind nginx, lets the teacher edit that file:

    /admin/              login page, or the panel once logged in
    /admin/login         POST password=...          sets the session cookie
    /admin/logout        POST                       ends the session
    /admin/api/config    GET  the apps of the hub page with their order and tags
                         POST {"order": [id, ...], "tags": {id: [tag, ...]}}   saves apps.json
    /admin/static/...    the panel's script and styles

The apps and their names come from the hub page itself (its <a class="app" href="/id/"> cards),
so a new app needs no change here. The password is the crossword app's teacher password: the
same salted PBKDF2 hash file (crosswords-web set-password), read on every use, so a new password
takes effect at once and ends every session. Standard library only.

    python3 hubadmin.py --port 8040 --password-file /opt/crosswords/teacher-password \
        --hub /var/www/teachingphysics/index.html --config /var/www/teachingphysics/hub-data/apps.json

Deployment: see hub-admin.service (systemd) and the nginx locations /admin/ and /apps.json.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import sys
import tempfile
import time
from html import escape
from html.parser import HTMLParser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import parse_qs

COOKIE = "hub_admin"
SESSION_DAYS = 30
MAX_BODY = 64 * 1024
MAX_TAGS = 8  # per app
MAX_TAG_LEN = 32
LOGIN_ATTEMPTS, LOGIN_WINDOW = 10, 15 * 60  # failed logins per address and window (s)


# ---------------------------------------------------------------------- passwords (as crosswords)
def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iterations, salt, digest = stored.strip().split("$")
        if algo != "pbkdf2_sha256":
            return False
        test = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations))
        return hmac.compare_digest(test.hex(), digest)
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------- the hub's apps
class _Cards(HTMLParser):
    """The cards of the hub page: <a class="app" href="/id/"> … <h2>Name</h2> … </a>."""

    def __init__(self) -> None:
        super().__init__()
        self.apps: List[Dict[str, str]] = []
        self._in_card = False
        self._in_h2 = False

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        a = dict(attrs)
        if tag == "a" and "app" in (a.get("class") or "").split():
            m = re.fullmatch(r"/([a-z0-9-]+)/?", a.get("href") or "")
            if m:
                self.apps.append({"id": m.group(1), "name": m.group(1)})
                self._in_card = True
        elif tag == "h2" and self._in_card:
            self._in_h2 = True
            self.apps[-1]["name"] = ""

    def handle_endtag(self, tag: str) -> None:
        if tag == "h2":
            self._in_h2 = False
        elif tag == "a":
            self._in_card = False

    def handle_data(self, data: str) -> None:
        if self._in_h2:
            self.apps[-1]["name"] += data


def hub_apps(hub_html: str) -> List[Dict[str, str]]:
    """[{id, name}] of the hub page's cards, in their order on the page."""
    p = _Cards()
    p.feed(hub_html)
    return [{"id": a["id"], "name": a["name"].strip() or a["id"]} for a in p.apps]


# ---------------------------------------------------------------------- the configuration
def clean_tag(tag: object) -> str:
    """A tag as stored: text without control characters, spaces collapsed, at most MAX_TAG_LEN."""
    if not isinstance(tag, str):
        return ""
    tag = re.sub(r"[\x00-\x1f\x7f<>]", "", tag)
    return re.sub(r"\s+", " ", tag).strip()[:MAX_TAG_LEN].strip()


def normalize(config: object, app_ids: List[str]) -> Dict[str, object]:
    """A valid configuration for the given apps: every app once in the order (those the config
    leaves out at the end, in the hub's order), and for each app its distinct tags. Unknown apps
    and anything malformed are dropped."""
    config = config if isinstance(config, dict) else {}
    order_in = config.get("order") if isinstance(config.get("order"), list) else []
    order = [a for i, a in enumerate(order_in) if a in app_ids and a not in order_in[:i]]
    order += [a for a in app_ids if a not in order]
    tags_in = config.get("tags") if isinstance(config.get("tags"), dict) else {}
    tags: Dict[str, List[str]] = {}
    for app in order:
        seen: List[str] = []
        raw = tags_in.get(app) if isinstance(tags_in.get(app), list) else []
        for t in raw:
            t = clean_tag(t)
            if t and t.casefold() not in (s.casefold() for s in seen):
                seen.append(t)
        if seen:
            tags[app] = seen[:MAX_TAGS]
    return {"order": order, "tags": tags}


def read_config(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def write_config(path: Path, config: Dict[str, object]) -> None:
    """Atomically: a reader sees the old file or the new one, never half of it."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".apps-", suffix=".json", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=1)
            f.write("\n")
        os.chmod(tmp, 0o644)  # nginx serves it as /apps.json
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


# ---------------------------------------------------------------------- the service
class Admin:
    def __init__(self, password_file: Path, hub: Path, config: Path) -> None:
        self.password_file, self.hub, self.config = password_file, hub, config
        self.failures: Dict[str, List[float]] = {}

    def stored_hash(self) -> str:
        """Read on every use, so a new password takes effect without a restart."""
        try:
            return self.password_file.read_text().strip()
        except OSError:
            return ""

    def _session_key(self, stored: str) -> bytes:
        # Derived from the password hash: changing the password ends every session.
        return hashlib.sha256(b"hub-admin-session|" + stored.encode()).digest()

    def new_session(self) -> str:
        expires = str(int(time.time()) + SESSION_DAYS * 86400)
        sig = hmac.new(self._session_key(self.stored_hash()), expires.encode(), "sha256").hexdigest()
        return f"{expires}.{sig}"

    def valid_session(self, value: str) -> bool:
        stored = self.stored_hash()
        if not stored or not value:
            return False
        try:
            expires, sig = value.split(".", 1)
            if int(expires) < time.time():
                return False
        except ValueError:
            return False
        want = hmac.new(self._session_key(stored), expires.encode(), "sha256").hexdigest()
        return hmac.compare_digest(want, sig)

    def blocked(self, addr: str) -> bool:
        now = time.time()
        self.failures[addr] = [t for t in self.failures.get(addr, []) if now - t < LOGIN_WINDOW]
        return len(self.failures[addr]) >= LOGIN_ATTEMPTS

    def failed(self, addr: str) -> None:
        self.failures.setdefault(addr, []).append(time.time())

    def apps(self) -> List[Dict[str, str]]:
        try:
            return hub_apps(self.hub.read_text(encoding="utf-8"))
        except OSError:
            return []

    def current(self) -> Dict[str, object]:
        apps = self.apps()
        cfg = normalize(read_config(self.config), [a["id"] for a in apps])
        return {"apps": apps, **cfg}

    def save(self, data: object) -> Dict[str, object]:
        apps = self.apps()
        if not apps:
            raise ValueError("the hub page lists no apps")
        cfg = normalize(data, [a["id"] for a in apps])
        write_config(self.config, cfg)
        return {"apps": apps, **cfg}


def make_handler(admin: Admin):
    class Handler(BaseHTTPRequestHandler):
        server_version = "hub-admin"
        sys_version = ""

        def log_message(self, fmt: str, *args) -> None:  # one line per request, without addresses
            sys.stderr.write((fmt % args) + "\n")

        # -------------------------------------------------------------- helpers
        def addr(self) -> str:
            return self.headers.get("X-Real-IP") or self.client_address[0]

        def cookie(self) -> str:
            for part in (self.headers.get("Cookie") or "").split(";"):
                k, _, v = part.strip().partition("=")
                if k == COOKIE:
                    return v
            return ""

        def logged_in(self) -> bool:
            return admin.valid_session(self.cookie())

        def send(self, status: int, body: str | bytes, ctype: str = "text/html; charset=utf-8", headers: Optional[Dict[str, str]] = None) -> None:
            data = body.encode("utf-8") if isinstance(body, str) else body
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "same-origin")
            self.send_header("Content-Security-Policy",
                             "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; "
                             "img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'")
            for k, v in (headers or {}).items():
                self.send_header(k, v)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)

        def json(self, status: int, obj: object) -> None:
            self.send(status, json.dumps(obj, ensure_ascii=False), "application/json; charset=utf-8")

        def body(self) -> Optional[bytes]:
            try:
                n = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                return None
            if n < 0 or n > MAX_BODY:
                return None
            return self.rfile.read(n)

        def redirect(self, cookie: Optional[str] = None) -> None:
            headers = {"Location": "/admin/"}
            if cookie is not None:
                headers["Set-Cookie"] = f"{COOKIE}={cookie}; Path=/admin/; HttpOnly; Secure; SameSite=Strict" + \
                    (f"; Max-Age={SESSION_DAYS * 86400}" if cookie else "; Max-Age=0")
            self.send(HTTPStatus.SEE_OTHER, "", headers=headers)

        # -------------------------------------------------------------- routes
        def do_HEAD(self) -> None:
            self.do_GET()

        def do_GET(self) -> None:
            path = self.path.split("?", 1)[0]
            if path == "/":
                self.send(200, panel_page() if self.logged_in() else login_page(bool(admin.stored_hash())))
            elif path == "/static/admin.js":
                self.send(200, ADMIN_JS, "text/javascript; charset=utf-8")
            elif path == "/static/admin.css":
                self.send(200, ADMIN_CSS, "text/css; charset=utf-8")
            elif path == "/api/config":
                if not self.logged_in():
                    self.json(403, {"error": "login"})
                else:
                    self.json(200, admin.current())
            else:
                self.send(404, "Not found", "text/plain; charset=utf-8")

        def do_POST(self) -> None:
            path = self.path.split("?", 1)[0]
            if path == "/login":
                data = self.body()
                if data is None:
                    self.send(413, "Too large", "text/plain; charset=utf-8")
                    return
                if admin.blocked(self.addr()):
                    self.send(429, login_page(True, "Too many attempts. Try again in a few minutes."))
                    return
                password = (parse_qs(data.decode("utf-8", "replace")).get("password") or [""])[0]
                stored = admin.stored_hash()
                if stored and verify_password(password, stored):
                    self.redirect(admin.new_session())
                else:
                    admin.failed(self.addr())
                    self.send(403, login_page(bool(stored), "Wrong password."))
            elif path == "/logout":
                self.redirect("")
            elif path == "/api/config":
                # JSON only: a form on another site cannot send it (and the cookie is SameSite=Strict)
                if not self.logged_in():
                    self.json(403, {"error": "login"})
                    return
                if not (self.headers.get("Content-Type") or "").startswith("application/json"):
                    self.json(415, {"error": "JSON expected"})
                    return
                data = self.body()
                if data is None:
                    self.json(413, {"error": "too large"})
                    return
                try:
                    self.json(200, admin.save(json.loads(data.decode("utf-8"))))
                except ValueError as e:
                    self.json(400, {"error": str(e)})
                except OSError:
                    self.json(500, {"error": "could not write the configuration"})
            else:
                self.send(404, "Not found", "text/plain; charset=utf-8")

    return Handler


# ---------------------------------------------------------------------- pages
def page(title: str, body: str, script: bool = False) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>{escape(title)}</title>
  <link rel="stylesheet" href="/admin/static/admin.css">
  {'<script defer src="/admin/static/admin.js"></script>' if script else ''}
</head>
<body>
  <header class="wrap">
    <p class="crumb"><a href="/">Teaching Physics</a> / Admin</p>
    <h1>{escape(title)}</h1>
  </header>
  <main class="wrap">{body}</main>
</body>
</html>"""


def login_page(ready: bool, error: str = "") -> str:
    if not ready:
        return page("Admin", '<p class="card">Teacher access hasn\'t been set up yet: set the teacher password of the crossword app.</p>')
    err = f'<p class="error" role="alert">{escape(error)}</p>' if error else ""
    return page("Admin", f"""
    <form class="card login" method="post" action="/admin/login">
      <p>The teacher password, the same as for the crosswords.</p>
      {err}
      <label class="field"><span>Password</span><input type="password" name="password" required autofocus autocomplete="current-password"></label>
      <button type="submit" class="primary">Log in</button>
    </form>""")


def panel_page() -> str:
    return page("Apps on the hub page", """
    <p class="lead">Put the apps in order and give them tags, e.g. physics topics. On the hub page, visitors can filter the apps by tag.</p>
    <div class="bar">
      <button type="button" id="save" class="primary" disabled>Save</button>
      <span id="status" class="status" aria-live="polite"></span>
      <a class="view" href="/" target="_blank" rel="noopener">View the hub page ↗</a>
      <form method="post" action="/admin/logout" class="logout"><button type="submit">Log out</button></form>
    </div>
    <ol id="apps" class="apps"></ol>
    <datalist id="known-tags"></datalist>
    <p class="note">Tags: at most 8 per app, 32 characters each. A tag used by no app disappears from the filter.</p>""", script=True)


ADMIN_CSS = """
:root { --bg: #f6f5f1; --card: #fff; --ink: #1f2328; --muted: #646b73; --line: #d9d6ce; --accent: #2b59c3; --accent-ink: #fff; --ok: #1d7a3e; --bad: #b3261e; --chip: #eef2fb; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root { --bg: #15171a; --card: #1e2125; --ink: #e6e3dc; --muted: #9aa0a6; --line: #3a3e44; --accent: #7aa2ff; --accent-ink: #0d1320; --ok: #7fd49a; --bad: #ff8a80; --chip: #26304a; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
.wrap { max-width: 820px; margin: 0 auto; padding: 0 16px; }
header.wrap { padding-top: 32px; }
.crumb { margin: 0; color: var(--muted); font-size: 0.95rem; }
.crumb a { color: inherit; }
h1 { margin: 4px 0 16px; font-size: 1.6rem; }
.lead, .note { color: var(--muted); }
.note { font-size: 0.9rem; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; }
.login { max-width: 420px; }
.field { display: block; margin: 12px 0; }
.field span { display: block; font-size: 0.9rem; color: var(--muted); margin-bottom: 4px; }
input { font: inherit; color: inherit; background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 7px 9px; width: 100%; }
input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
button { font: inherit; color: inherit; background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; cursor: pointer; }
button:hover:not(:disabled) { border-color: var(--accent); }
button:disabled { opacity: 0.45; cursor: default; }
button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); font-weight: 600; }
.error { color: var(--bad); }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 0 0 14px; position: sticky; top: 0; background: var(--bg); padding: 10px 0; z-index: 1; }
.status { color: var(--muted); font-size: 0.9rem; }
.status.ok { color: var(--ok); }
.status.bad { color: var(--bad); }
.view { margin-left: auto; color: var(--accent); }
.logout { margin: 0; }
.apps { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.app { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; align-items: start; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
.app.moved { border-color: var(--accent); }
.move { display: flex; flex-direction: column; gap: 4px; }
.move button { padding: 2px 9px; line-height: 1.3; }
.app h2 { margin: 0; font-size: 1.05rem; }
.app .id { color: var(--muted); font-size: 0.85rem; margin-left: 6px; font-weight: 400; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 8px; }
.tag { display: inline-flex; align-items: center; gap: 2px; background: var(--chip); border-radius: 999px; padding: 2px 4px 2px 10px; font-size: 0.9rem; }
.tag button { border: 0; background: transparent; padding: 0 6px; font-size: 1rem; line-height: 1; color: var(--muted); }
.tag button:hover { color: var(--bad); }
.add { display: inline-flex; gap: 4px; }
.add input { width: 12em; padding: 3px 8px; font-size: 0.9rem; }
.add button { padding: 3px 10px; font-size: 0.9rem; }
@media (max-width: 560px) { .view { margin-left: 0; } .add input { width: 9em; } }
"""

ADMIN_JS = r"""
// The admin panel: loads the apps with their order and tags, edits them here, saves them on Save.
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const MAX_TAGS = 8, MAX_LEN = 32;
  let apps = [], order = [], tags = {}, dirty = false;

  const nameOf = (id) => (apps.find((a) => a.id === id) || { name: id }).name;
  const status = (text, cls) => { const el = $('#status'); el.textContent = text; el.className = `status ${cls || ''}`; };
  function changed() { dirty = true; $('#save').disabled = false; status('Unsaved changes'); }

  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); });
    kids.forEach((k) => e.append(k));
    return e;
  }

  function render(focus) {
    const list = $('#apps');
    list.replaceChildren(...order.map((id, i) => {
      const own = tags[id] || [];
      const input = el('input', { type: 'text', list: 'known-tags', maxlength: String(MAX_LEN), placeholder: 'New tag', 'aria-label': `New tag for ${nameOf(id)}` });
      const add = () => {
        const t = input.value.replace(/\s+/g, ' ').trim();
        if (!t) return;
        if (own.some((x) => x.toLowerCase() === t.toLowerCase())) { input.value = ''; return; }
        if (own.length >= MAX_TAGS) { status(`At most ${MAX_TAGS} tags per app`, 'bad'); return; }
        tags[id] = [...own, t];
        changed();
        render({ id, what: 'input' });
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      return el('li', { class: 'app', 'data-id': id },
        el('div', { class: 'move' },
          el('button', { type: 'button', 'aria-label': `Move ${nameOf(id)} up`, onclick: () => move(i, -1), ...(i === 0 ? { disabled: '' } : {}) }, '↑'),
          el('button', { type: 'button', 'aria-label': `Move ${nameOf(id)} down`, onclick: () => move(i, 1), ...(i === order.length - 1 ? { disabled: '' } : {}) }, '↓')),
        el('div', {},
          el('h2', {}, nameOf(id), el('span', { class: 'id' }, `/${id}/`)),
          el('div', { class: 'tags' },
            ...own.map((t) => el('span', { class: 'tag' }, t,
              el('button', { type: 'button', 'aria-label': `Remove tag ${t} from ${nameOf(id)}`, onclick: () => { tags[id] = own.filter((x) => x !== t); changed(); render(); } }, '×'))),
            el('span', { class: 'add' }, input, el('button', { type: 'button', onclick: add }, 'Add')))));
    }));
    // suggestions: every tag in use
    const all = [...new Set(Object.values(tags).flat())].sort((a, b) => a.localeCompare(b));
    $('#known-tags').replaceChildren(...all.map((t) => el('option', { value: t })));
    if (focus) {
      const li = list.querySelector(`li[data-id="${focus.id}"]`);
      if (li) {
        if (focus.what === 'input') li.querySelector('input').focus();
        else { const b = li.querySelectorAll('.move button')[focus.what === 'up' ? 0 : 1]; (b.disabled ? li.querySelector('.move button:not(:disabled)') : b).focus(); li.classList.add('moved'); }
      }
    }
  }

  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    changed();
    render({ id: order[j], what: d < 0 ? 'up' : 'down' });
  }

  function apply(cfg) { apps = cfg.apps; order = cfg.order; tags = cfg.tags || {}; dirty = false; $('#save').disabled = true; render(); }

  async function load() {
    const r = await fetch('/admin/api/config', { credentials: 'same-origin' });
    if (r.status === 403) { location.reload(); return; }
    apply(await r.json());
    status(apps.length ? '' : 'The hub page lists no apps.', apps.length ? '' : 'bad');
  }

  async function save() {
    $('#save').disabled = true;
    status('Saving…');
    try {
      const r = await fetch('/admin/api/config', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order, tags }) });
      if (r.status === 403) { status('Logged out: log in again (your changes are lost on reload)', 'bad'); $('#save').disabled = false; return; }
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
      apply(await r.json());
      status('Saved. The hub page shows the new order and tags.', 'ok');
    } catch (e) {
      $('#save').disabled = false;
      status(`Not saved: ${e.message}`, 'bad');
    }
  }

  $('#save').addEventListener('click', save);
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  load().catch(() => status('Could not load the apps.', 'bad'));
})();
"""


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Admin panel of the teachingphysics.ch hub (tags and order of the apps).")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8040)
    p.add_argument("--password-file", type=Path, required=True, help="the teacher password hash (crosswords-web set-password)")
    p.add_argument("--hub", type=Path, required=True, help="the hub page, whose cards list the apps")
    p.add_argument("--config", type=Path, required=True, help="where to write apps.json (served as /apps.json)")
    args = p.parse_args(argv)
    admin = Admin(args.password_file, args.hub, args.config)
    server = ThreadingHTTPServer((args.host, args.port), make_handler(admin))
    print(f"hub admin on http://{args.host}:{args.port}/", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
