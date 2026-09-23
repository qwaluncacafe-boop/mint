import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
public_data = root / "public" / "data"
public_data.mkdir(parents=True, exist_ok=True)

shutil.copy2(root / "data" / "config.json", public_data / "config.json")
shutil.copy2(root / "data" / "history.json", public_data / "history.json")

# live.json may already exist from the monitor step; keep it when available.
if not (public_data / "live.json").exists():
    (public_data / "live.json").write_text(
        json.dumps({
            "checkedAt": None,
            "minecraft": {"status": "unknown", "players": None, "maxPlayers": None, "latency": None},
            "discord": {"status": str(json.loads((root / "data" / "config.json").read_text(encoding="utf-8")).get("discordBotStatus", "ON")).lower()}
        }, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
