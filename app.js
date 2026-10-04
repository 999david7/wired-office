// Each app's download button always targets the newest GitHub release.
const ORG = "Wired-Office";
const CACHE_MINUTES = 15;

const APPS = [
  {
    id: "paper",
    name: "Wired Paper",
    repo: "Wired-Paper",
    tagline: "A word processor that gets out of the way.",
    requires: "macOS 14+",
    features: [
      "Real paginated editing, styles & tables",
      "Opens and saves .docx, .odt, .rtf",
      "On-device writing suggestions",
      "PDF export that matches the page",
    ],
  },
  {
    id: "grid",
    name: "Wired Grid",
    repo: "Wired-Grid",
    tagline: "Spreadsheets with an Excel-shaped brain.",
    requires: "macOS 14+",
    features: [
      "300+ functions incl. XLOOKUP & LET",
      "Dynamic arrays, charts, conditional formats",
      "Reads and writes .xlsx, CSV, TSV",
      "A million rows, drawn on demand",
    ],
  },
  {
    id: "slides",
    name: "Wired Slides",
    repo: "Wired-Slides",
    tagline: "Presentations, from first slide to standing ovation.",
    requires: "macOS 15+",
    features: [
      "12 themes, 70+ shapes, Morph transition",
      "Presenter View with notes and timers",
      "Opens and saves .pptx",
      "Export to PDF, images or MP4",
    ],
  },
];

function formatSize(bytes) {
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Prefer a .dmg, then .zip / .pkg, so the button downloads the installer directly.
function pickAsset(assets) {
  for (const ext of [".dmg", ".zip", ".pkg"]) {
    const asset = assets.find((a) => a.name.toLowerCase().endsWith(ext));
    if (asset) return asset;
  }
  return null;
}

function readCache(key) {
  try {
    const hit = JSON.parse(localStorage.getItem(key));
    if (hit && Date.now() - hit.at < CACHE_MINUTES * 60e3) return hit.data;
  } catch {}
  return undefined;
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {}
}

// Resolves to the release object, or null when the app has no release yet.
async function latestRelease(repo) {
  const key = `wired-release:${repo}`;
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const res = await fetch(`https://api.github.com/repos/${ORG}/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) {
    writeCache(key, null);
    return null;
  }
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);

  const json = await res.json();
  const data = {
    tag: json.tag_name,
    url: json.html_url,
    date: json.published_at,
    asset: pickAsset(json.assets || []),
  };
  writeCache(key, data);
  return data;
}

function renderCard(app) {
  const node = document.getElementById("app-card").content.firstElementChild.cloneNode(true);
  node.dataset.app = app.id;
  node.querySelector(".icon").src = `assets/${app.id}.png`;
  node.querySelector(".icon").alt = `${app.name} icon`;
  node.querySelector("[data-name]").textContent = app.name;
  node.querySelector("[data-tagline]").textContent = app.tagline;
  const list = node.querySelector("[data-features]");
  for (const f of app.features) {
    const li = document.createElement("li");
    li.textContent = f;
    list.append(li);
  }
  node.querySelector("[data-download]").classList.add("loading");
  return node;
}

function enableButton(btn, href, label) {
  btn.href = href;
  btn.removeAttribute("aria-disabled");
  btn.querySelector("[data-label]").innerHTML = label;
}

async function hydrate(app, card) {
  const btn = card.querySelector("[data-download]");
  const label = btn.querySelector("[data-label]");
  const version = card.querySelector("[data-version]");
  const meta = card.querySelector("[data-meta]");
  const releasesUrl = `https://github.com/${ORG}/${app.repo}/releases/latest`;

  try {
    const release = await latestRelease(app.repo);
    btn.classList.remove("loading");

    if (!release) {
      version.textContent = "soon";
      label.textContent = "Coming soon";
      meta.textContent = app.requires;
      return;
    }

    version.textContent = release.tag;
    if (release.asset) {
      enableButton(btn, release.asset.browser_download_url, `Download for Mac <span aria-hidden="true">↓</span>`);
      meta.innerHTML = `${app.requires} · ${formatSize(release.asset.size)} · <a href="${release.url}" target="_blank" rel="noopener">${formatDate(release.date)}</a>`;
    } else {
      enableButton(btn, release.url, `View release <span aria-hidden="true">↗</span>`);
      meta.textContent = `${app.requires} · ${formatDate(release.date)}`;
    }
  } catch {
    // Rate-limited or offline: fall back to GitHub's own "latest release" page.
    btn.classList.remove("loading");
    version.textContent = "latest";
    enableButton(btn, releasesUrl, `Download on GitHub <span aria-hidden="true">↗</span>`);
    meta.textContent = app.requires;
  }
}

const container = document.getElementById("apps");
for (const app of APPS) {
  const card = renderCard(app);
  container.append(card);
  hydrate(app, card);
}

// Cursor-following spotlight on the dot backdrop.
const dots = document.querySelector(".dots");
let frame = 0;
window.addEventListener("pointermove", (e) => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    dots.style.setProperty("--mx", `${e.clientX}px`);
    dots.style.setProperty("--my", `${e.clientY}px`);
  });
});
