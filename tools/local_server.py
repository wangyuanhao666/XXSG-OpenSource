"""XXSG local server with month-end backups outside browser storage."""

from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import socket
import tempfile
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
BACKUP_DIR = ROOT / "backups"
MAX_BODY_BYTES = 25 * 1024 * 1024
BACKUP_FORMAT = "xxsg-full-local-v1"
BLOCKED_KEY = re.compile(r"password|credential|session|token|secret|api.?key|private.?key|auth|jwt|bearer|oauth|cookie|csrf|refresh|verification|2fa|mfa|otp|^users$|^_xxsg_|^aiConfig$|^admin|^remember|^telemetry|^legalConsent|^taskBackups|^lastAutoBackup|_backup(?:_time)?$|^error_logs$|^pendingActions$|^_heartbeat", re.I)
CHINA_TIMEZONE = timezone(timedelta(hours=8))
SCHEDULE_START = date(2026, 11, 13)
HOLIDAY_CALENDAR = json.loads((ROOT / "tools" / "cn-holidays.json").read_text(encoding="utf-8"))


def today_cn():
    return datetime.now(CHINA_TIMEZONE).date()


def holiday_dates(year):
    calendar = HOLIDAY_CALENDAR.get(str(year))
    if not calendar:
        return set(), False
    dates = set()
    for start_raw, end_raw in calendar["holidays"]:
        day = date.fromisoformat(start_raw)
        end = date.fromisoformat(end_raw)
        while day <= end:
            dates.add(day)
            day += timedelta(days=1)
    return dates, True


def is_workday(day):
    holidays, _ = holiday_dates(day.year)
    return day.weekday() < 5 and day not in holidays


def last_workday(year, month):
    day = date(year, month, monthrange(year, month)[1])
    while not is_workday(day):
        day -= timedelta(days=1)
    return day


def due_schedule(day):
    if not is_workday(day):
        return {"due": False}
    cutoff = last_workday(day.year, day.month)
    if day == cutoff:
        scheduled = cutoff
        late = False
    else:
        previous = date(day.year, day.month, 1) - timedelta(days=1)
        scheduled = last_workday(previous.year, previous.month)
        if scheduled < SCHEDULE_START:
            return {"due": False}
        late = True
    _, verified = holiday_dates(scheduled.year)
    return {
        "due": True,
        "period": scheduled.strftime("%Y-%m"),
        "scheduledFor": scheduled.isoformat(),
        "late": late,
        "calendarVerified": verified,
    }


class LocalHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _blocked_path(self):
        path = unquote(urlsplit(self.path).path).replace("\\", "/")
        return any(part.lower() == "backups" for part in path.split("/"))

    def send_head(self):
        if self._blocked_path():
            self.send_error(404)
            return None
        return super().send_head()

    def do_GET(self):
        if urlsplit(self.path).path == "/api/local-backup/schedule":
            host = self.headers.get("Host", "").lower()
            if (self.client_address[0] not in ("127.0.0.1", "::1", "::ffff:127.0.0.1")
                    or host not in ("localhost:8080", "127.0.0.1:8080")):
                self._reply(403, {"error": "Local page required"})
            else:
                self._reply(200, due_schedule(today_cn()))
            return
        super().do_GET()

    def _reply(self, status, body):
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        if urlsplit(self.path).path != "/api/local-backup":
            self._reply(404, {"error": "Not found"})
            return

        host = self.headers.get("Host", "").lower()
        origin = self.headers.get("Origin", "")
        allowed = ("localhost:8080", "127.0.0.1:8080")
        if (self.client_address[0] not in ("127.0.0.1", "::1", "::ffff:127.0.0.1")
                or host not in allowed or origin != f"http://{host}"):
            self._reply(403, {"error": "Local page required"})
            return
        if self.headers.get_content_type() != "application/json":
            self._reply(415, {"error": "JSON required"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if not 0 < length <= MAX_BODY_BYTES:
            self._reply(413, {"error": "Invalid backup size"})
            return
        try:
            data = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeDecodeError):
            self._reply(400, {"error": "Invalid JSON"})
            return
        if not isinstance(data, dict):
            self._reply(400, {"error": "Invalid backup"})
            return
        user_id = data.get("userId")
        browser_id = data.get("browserId")
        entries = data.get("entries")
        schedule = due_schedule(today_cn())
        if not schedule["due"] or data.get("period") != schedule["period"]:
            self._reply(409, {"error": "Backup is not due"})
            return
        if (not isinstance(user_id, str) or not 0 < len(user_id) <= 128
                or not isinstance(browser_id, str) or not 0 < len(browser_id) <= 128
                or data.get("format") != BACKUP_FORMAT
                or not isinstance(entries, dict) or not entries
                or any(not isinstance(key, str) or not 0 < len(key) <= 200
                       or BLOCKED_KEY.search(key)
                       or not isinstance(value, str) for key, value in entries.items())):
            self._reply(400, {"error": "Invalid backup content"})
            return

        now = datetime.now(CHINA_TIMEZONE)
        month = schedule["period"]
        user_hash = sha256(user_id.encode("utf-8")).hexdigest()[:16]
        browser_hash = sha256(browser_id.encode("utf-8")).hexdigest()[:8]
        filename = f"象限时光完整备份_{month}_月末_{user_hash}_{browser_hash}.json"
        destination = BACKUP_DIR / filename
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            self._reply(200, {"status": "existing", "filename": filename})
            return
        snapshot = {
            "format": BACKUP_FORMAT,
            "createdAt": now.isoformat(),
            "ownerId": user_id,
            "entries": entries,
            "metadata": {
                "entryCount": len(entries), "backupType": "monthly-last-workday",
                "period": month, "scheduledFor": schedule["scheduledFor"],
                "late": schedule["late"], "calendarVerified": schedule["calendarVerified"],
            },
        }
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(
                    mode="w", encoding="utf-8", dir=BACKUP_DIR,
                    prefix=".monthly-", suffix=".tmp", delete=False) as output:
                temporary = Path(output.name)
                json.dump(snapshot, output, ensure_ascii=False, indent=2)
                output.flush()
                os.fsync(output.fileno())
            # A hard link installs the complete file without overwriting a prior snapshot.
            try:
                os.link(temporary, destination)
                status = "created"
            except FileExistsError:
                status = "existing"
            self._reply(200, {"status": status, "filename": filename})
        except OSError:
            self._reply(500, {"error": "Backup write failed"})
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)


class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


if __name__ == "__main__":
    DualStackServer(("::", 8080), LocalHandler).serve_forever()
