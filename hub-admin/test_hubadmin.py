"""Tests of the hub admin: run with `python3 hub-admin/test_hubadmin.py`.

Checks the reading of the hub page, the cleaning of a configuration, the atomic write, the
password (in the crossword app's format) and sessions, and the service end to end: login, rate
limit, the API with and without a session, and that saves reach apps.json.
"""
import hashlib
import json
import secrets
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import hubadmin as H  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def hash_password(password: str, iterations: int = 1000) -> str:  # as crosswords-web set-password
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${digest.hex()}"


class Unit(unittest.TestCase):
    def test_hub_apps(self):
        apps = H.hub_apps((ROOT / "hub" / "index.html").read_text())
        ids = [a["id"] for a in apps]
        self.assertIn("coe", ids)
        self.assertIn("force-systems", ids)
        self.assertEqual(len(ids), len(set(ids)))
        names = {a["id"]: a["name"] for a in apps}
        self.assertEqual(names["coe"], "Energy Conservation")
        self.assertEqual(names["bulb-brightness"], "Bulb Brightness")

    def test_normalize(self):
        ids = ["a", "b", "c"]
        cfg = H.normalize({"order": ["c", "x", "a", "c"], "tags": {"a": [" Mechanics ", "mechanics", "<b>Energy</b>", 3, ""], "x": ["y"], "b": "no list"}}, ids)
        self.assertEqual(cfg["order"], ["c", "a", "b"])
        self.assertEqual(cfg["tags"], {"a": ["Mechanics", "bEnergy/b"]})
        self.assertEqual(H.normalize(None, ids), {"order": ids, "tags": {}})
        many = H.normalize({"tags": {"a": [f"t{i}" for i in range(20)]}}, ids)
        self.assertEqual(len(many["tags"]["a"]), H.MAX_TAGS)
        self.assertEqual(len(H.clean_tag("x" * 100)), H.MAX_TAG_LEN)

    def test_write(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "sub" / "apps.json"
            H.write_config(p, {"order": ["a"], "tags": {"a": ["Ä"]}})
            self.assertEqual(json.loads(p.read_text()), {"order": ["a"], "tags": {"a": ["Ä"]}})
            self.assertEqual([f.name for f in p.parent.iterdir()], ["apps.json"])  # no temporary file left
            self.assertEqual(p.stat().st_mode & 0o777, 0o644)

    def test_password_and_session(self):
        with tempfile.TemporaryDirectory() as d:
            pw = Path(d) / "pw"
            pw.write_text(hash_password("secret pass") + "\n")
            self.assertTrue(H.verify_password("secret pass", pw.read_text()))
            self.assertFalse(H.verify_password("wrong", pw.read_text()))
            self.assertFalse(H.verify_password("x", "garbage"))
            a = H.Admin(pw, Path(d) / "hub", Path(d) / "apps.json")
            s = a.new_session()
            self.assertTrue(a.valid_session(s))
            self.assertFalse(a.valid_session(s[:-1] + ("0" if s[-1] != "0" else "1")))
            self.assertFalse(a.valid_session("1.abc"))
            pw.write_text(hash_password("new pass") + "\n")  # a new password ends the session
            self.assertFalse(a.valid_session(s))


class Service(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        d = Path(self.dir.name)
        (d / "pw").write_text(hash_password("teacher pw") + "\n")
        (d / "index.html").write_text((ROOT / "hub" / "index.html").read_text())
        self.config = d / "data" / "apps.json"
        self.admin = H.Admin(d / "pw", d / "index.html", self.config)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), H.make_handler(self.admin))
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.base = f"http://127.0.0.1:{self.server.server_address[1]}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.dir.cleanup()

    def req(self, path, data=None, ctype=None, cookie=None):
        r = urllib.request.Request(self.base + path, data=data, method="POST" if data is not None else "GET")
        if ctype:
            r.add_header("Content-Type", ctype)
        if cookie:
            r.add_header("Cookie", cookie)

        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *a, **k):
                return None
        opener = urllib.request.build_opener(NoRedirect)
        try:
            with opener.open(r) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers), e.read()

    def login(self, password="teacher pw"):
        return self.req("/login", f"password={password}".encode(), "application/x-www-form-urlencoded")

    def test_flow(self):
        st, _, body = self.req("/")
        self.assertEqual(st, 200)
        self.assertIn(b'type="password"', body)
        self.assertEqual(self.req("/api/config")[0], 403)
        st, _, _ = self.login("nope")
        self.assertEqual(st, 403)
        st, headers, _ = self.login()
        self.assertEqual(st, 303)
        cookie = headers["Set-Cookie"].split(";")[0]
        self.assertIn("HttpOnly", headers["Set-Cookie"])
        self.assertIn("SameSite=Strict", headers["Set-Cookie"])
        st, _, body = self.req("/", cookie=cookie)
        self.assertIn(b'id="apps"', body)
        st, _, body = self.req("/api/config", cookie=cookie)
        cfg = json.loads(body)
        ids = [a["id"] for a in cfg["apps"]]
        self.assertEqual(cfg["order"], ids)
        # a save: reordered, tagged, cleaned
        new = {"order": list(reversed(ids)), "tags": {"coe": ["Mechanics", "Energy", "energy"], "nope": ["x"]}}
        self.assertEqual(self.req("/api/config", json.dumps(new).encode(), "text/plain", cookie)[0], 415)
        self.assertEqual(self.req("/api/config", json.dumps(new).encode(), "application/json")[0], 403)
        st, _, body = self.req("/api/config", json.dumps(new).encode(), "application/json", cookie)
        self.assertEqual(st, 200)
        saved = json.loads(self.config.read_text())
        self.assertEqual(saved, {"order": list(reversed(ids)), "tags": {"coe": ["Mechanics", "Energy"]}})
        self.assertEqual(self.req("/api/config", b"{not json", "application/json", cookie)[0], 400)
        self.assertEqual(self.req("/api/config", b"x" * (H.MAX_BODY + 1), "application/json", cookie)[0], 413)
        # logging out clears the cookie
        st, headers, _ = self.req("/logout", b"", "application/x-www-form-urlencoded", cookie)
        self.assertEqual(st, 303)
        self.assertIn("Max-Age=0", headers["Set-Cookie"])
        self.assertEqual(self.req("/static/admin.js")[0], 200)
        self.assertEqual(self.req("/nothing")[0], 404)

    def test_rate_limit(self):
        for _ in range(H.LOGIN_ATTEMPTS):
            self.assertEqual(self.login("wrong")[0], 403)
        self.assertEqual(self.login()[0], 429)  # even the right password, for a while


if __name__ == "__main__":
    unittest.main()
