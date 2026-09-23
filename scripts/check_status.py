import json
import time
from datetime import datetime, timezone
from urllib.parse import quote
from urllib.request import Request, urlopen

HOST = "technology-trombone.gl.joinmc.link"
ENDPOINT = f"https://api.mcstatus.io/v2/status/java/{quote(HOST, safe='') }?query=false&timeout=5"
HISTORY_FILE = "data/history.json"
LIVE_FILE = "public/data/live.json"
CONFIG_FILE = "data/config.json"
MAX_SAMPLE_AGE = 72 * 60 * 60


def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path, value):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(value, f, ensure_ascii=False, indent=2)


def minecraft_status():
    try:
        req = Request(ENDPOINT, headers={"User-Agent": "MintServer-Status/1.0"})
        with urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
        online = bool(data.get("online"))
        return {
            "status": "online" if online else "offline",
            "players": (data.get("players") or {}).get("online"),
            "maxPlayers": (data.get("players") or {}).get("max"),
            "latency": None,
        }
    except Exception:
        return {
            "status": "offline",
            "players": None,
            "maxPlayers": None,
            "latency": None,
        }


def main():
    now = time.time()
    now_iso = datetime.now(timezone.utc).isoformat()
    mc = minecraft_status()
    config = load_json(CONFIG_FILE, {"discordBotStatus": "ON", "notices": []})
    discord_value = str(config.get("discordBotStatus", "ON")).upper()
    discord_status = "offline" if discord_value == "OFF" else "online"

    history = load_json(HISTORY_FILE, {"version": 2, "samples": []})
    samples = history.get("samples", [])
    samples.append({"time": now_iso, "minecraft": mc["status"], "discord": discord_status})

    cutoff = now - MAX_SAMPLE_AGE
    clean = []
    for sample in samples:
        try:
            ts = datetime.fromisoformat(sample["time"].replace("Z", "+00:00")).timestamp()
        except Exception:
            continue
        if ts >= cutoff:
            clean.append(sample)

    clean = clean[-900:]
    save_json(HISTORY_FILE, {"version": 2, "samples": clean})
    save_json(
        LIVE_FILE,
        {
            "checkedAt": now_iso,
            "minecraft": mc,
            "discord": {"status": discord_status}
        }
    )


if __name__ == "__main__":
    main()
