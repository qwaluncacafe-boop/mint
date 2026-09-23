function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getJSON(path) {
  const res = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatJST(value) {
  if (!value) return "日時未定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時未定";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function stateClass(value) {
  if (value === "online") return "ok";
  if (value === "offline") return "bad";
  return "unknown";
}

function stateLabel(value) {
  if (value === "online") return "正常";
  if (value === "offline") return "障害";
  return "未記録";
}

function makeDisplayBuckets(samples) {
  const now = Date.now();
  const start = now - 72 * 60 * 60 * 1000;
  const bucketCount = 96;
  const bucketMs = (72 * 60 * 60 * 1000) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    start: start + i * bucketMs,
    minecraft: "unknown",
    discord: "unknown"
  }));

  for (const sample of samples || []) {
    const t = new Date(sample.time).getTime();
    if (!Number.isFinite(t) || t < start || t > now) continue;
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((t - start) / bucketMs)));
    for (const service of ["minecraft", "discord"]) {
      const value = sample?.[service];
      if (value === "offline") buckets[index][service] = "offline";
      else if (value === "online" && buckets[index][service] !== "offline") buckets[index][service] = "online";
    }
  }

  return buckets;
}

function renderHistory(samples) {
  const buckets = makeDisplayBuckets(samples);
  const rows = ["minecraft", "discord"].map(service => {
    const cells = buckets.map(bucket => {
      const value = bucket[service];
      const start = new Date(bucket.start).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
      return `<div class="bar ${stateClass(value)}" title="${escapeHtml(start)} / ${stateLabel(value)}"></div>`;
    }).join("");

    const label = service === "minecraft" ? "Minecraft" : "Discord BOT";
    return `<div class="history-row"><div class="service-name">${label}</div><div class="bar-track">${cells}</div></div>`;
  }).join("");

  document.getElementById("historyRows").innerHTML = rows;
}

function renderNotices(notices) {
  const box = document.getElementById("notices");
  const sorted = [...(notices || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!sorted.length) {
    box.innerHTML = `<div class="empty">お知らせはありません。</div>`;
    return;
  }
  box.innerHTML = sorted.map(item => `
    <article class="notice">
      <div class="notice-date">${escapeHtml(formatJST(item.date))}</div>
      <div class="notice-title">${escapeHtml(item.title || "")}</div>
      <div class="notice-body">${escapeHtml(item.body || "")}</div>
    </article>
  `).join("");
}

function renderStatus(live) {
  const services = [
    ["Minecraft", live?.minecraft?.status || "unknown"],
    ["Discord BOT", live?.discord?.status || "unknown"]
  ];

  const incidents = services.filter(([, value]) => value === "offline");
  const healthy = services.filter(([, value]) => value === "online");

  document.getElementById("incidents").innerHTML = incidents.length
    ? incidents.map(([name]) => `<div class="status-item"><span class="status-dot bad"></span><span>${escapeHtml(name)}</span></div>`).join("")
    : `<div class="empty">現在、障害はありません。</div>`;

  document.getElementById("healthy").innerHTML = healthy.length
    ? healthy.map(([name]) => `<div class="status-item"><span class="status-dot ok"></span><span>${escapeHtml(name)}</span></div>`).join("")
    : `<div class="empty">現在、正常なサービスはありません。</div>`;
}

async function load() {
  try {
    const [live, history, config] = await Promise.all([
      getJSON("./data/live.json"),
      getJSON("./data/history.json"),
      getJSON("./data/config.json")
    ]);

    renderHistory(history.samples || []);
    renderNotices(config.notices || []);
    renderStatus(live);
    document.getElementById("updated").textContent = live.checkedAt
      ? `最終確認 ${formatJST(live.checkedAt)}`
      : "確認中";
  } catch {
    document.getElementById("updated").textContent = "確認中";
    document.getElementById("incidents").innerHTML = `<div class="empty">現在、情報を取得できません。</div>`;
    document.getElementById("healthy").innerHTML = "";
  }
}

load();
setInterval(load, 60 * 1000);
