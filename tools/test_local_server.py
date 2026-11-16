import http.client
import json
from datetime import date
from pathlib import Path
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch

import local_server


class LocalBackupTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.backups = Path(self.folder.name) / "backups"
        self.patch = patch.object(local_server, "BACKUP_DIR", self.backups)
        self.patch.start()
        self.clock_patch = patch.object(local_server, "today_cn", return_value=date(2026, 11, 30))
        self.clock_patch.start()
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), local_server.LocalHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.patch.stop()
        self.clock_patch.stop()
        self.folder.cleanup()

    def request(self, method, path, data=None, origin="http://localhost:8080"):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        headers = {"Host": "localhost:8080", "Origin": origin,
                   "Content-Type": "application/json"}
        body = json.dumps(data).encode() if data is not None else None
        conn.request(method, path, body=body, headers=headers)
        response = conn.getresponse()
        result = response.status, response.read()
        conn.close()
        return result

    def test_monthly_backup_is_restorable_and_never_overwritten(self):
        first = {"format": "xxsg-full-local-v1", "userId": "user-one", "browserId": "browser-one", "period": "2026-11",
                 "entries": {"tasks_user-one": '[{"id":"task-one"}]',
                             "habitTrackerData": "[]"}}
        status, body = self.request("POST", "/api/local-backup", first)
        self.assertEqual(status, 200)
        result = json.loads(body)
        self.assertEqual(result["status"], "created")
        filename = result["filename"]
        saved = json.loads((self.backups / filename).read_text(encoding="utf-8"))
        self.assertEqual(saved["entries"], first["entries"])
        self.assertEqual(saved["metadata"]["entryCount"], 2)
        self.assertEqual(saved["metadata"]["scheduledFor"], "2026-11-30")
        self.assertFalse(saved["metadata"]["late"])

        first["entries"]["tasks_user-one"] = '[{"id":"task-two"}]'
        status, body = self.request("POST", "/api/local-backup", first)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["status"], "existing")
        self.assertEqual(json.loads((self.backups / filename).read_text(encoding="utf-8")), saved)

        first["browserId"] = "browser-two"
        status, body = self.request("POST", "/api/local-backup", first)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["status"], "created")
        self.assertNotEqual(json.loads(body)["filename"], filename)

    def test_backup_is_not_downloadable_from_site(self):
        self.backups.mkdir()
        (self.backups / "secret.json").write_text("secret", encoding="utf-8")
        for path in ("/backups/secret.json", "/%62ackups/secret.json"):
            status, body = self.request("GET", path)
            self.assertEqual(status, 404)
            self.assertNotIn(b"secret", body)

    def test_cross_origin_and_empty_backups_are_rejected(self):
        data = {"format": "xxsg-full-local-v1", "userId": "user-one", "browserId": "browser-one", "period": "2026-11",
                "entries": {"tasks_user-one": "[]"}}
        self.assertEqual(self.request("POST", "/api/local-backup", data,
                                      origin="https://other.example")[0], 403)
        self.assertEqual(self.request("POST", "/api/local-backup",
                                      {"format": "xxsg-full-local-v1", "userId": "user-one", "browserId": "browser-one", "period": "2026-11",
                                       "entries": {}})[0], 400)
        self.assertEqual(self.request("POST", "/api/local-backup",
                                      {"format": "xxsg-full-local-v1", "userId": "user-one", "browserId": "browser-one", "period": "2026-11",
                                       "entries": {"adminPassword": "private"}})[0], 400)
        self.assertFalse(self.backups.exists())

    def test_calendar_and_catchup_schedule(self):
        self.assertFalse(local_server.due_schedule(date(2026, 11, 13))["due"])
        self.assertEqual(local_server.due_schedule(date(2026, 11, 30))["period"], "2026-11")
        self.assertFalse(local_server.due_schedule(date(2026, 11, 29))["due"])
        self.assertEqual(local_server.last_workday(2027, 10), date(2027, 10, 29))
        self.assertEqual(local_server.last_workday(2027, 1), date(2027, 1, 29))
        with patch.dict(local_server.HOLIDAY_CALENDAR, {"2027": {"holidays": [["2027-10-29", "2027-10-29"]]}}):
            self.assertEqual(local_server.last_workday(2027, 10), date(2027, 10, 28))
        catchup = local_server.due_schedule(date(2026, 12, 1))
        self.assertEqual(catchup["period"], "2026-11")
        self.assertTrue(catchup["late"])
        self.assertFalse(local_server.due_schedule(date(2028, 12, 29))["calendarVerified"])
        with patch.object(local_server, "today_cn", return_value=date(2026, 11, 13)):
            status, body = self.request("GET", "/api/local-backup/schedule")
            self.assertEqual(status, 200)
            self.assertFalse(json.loads(body)["due"])
            self.assertEqual(self.request("POST", "/api/local-backup",
                            {"format": "xxsg-full-local-v1", "userId": "user-one",
                             "browserId": "browser-one", "period": "2026-11",
                             "entries": {"tasks_user-one": "[]"}})[0], 409)


if __name__ == "__main__":
    unittest.main()
