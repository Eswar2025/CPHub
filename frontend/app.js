const API_BASE_URL = "http://localhost:5003/api";

const state = {
  currentHandle: "",
  isLoading: false,
};

const elements = {
  apiBaseLabel: document.querySelector("#apiBaseLabel"),
  searchForm: document.querySelector("#searchForm"),
  handleInput: document.querySelector("#handleInput"),
  searchButton: document.querySelector("#searchButton"),
  refreshButton: document.querySelector("#refreshButton"),
  loadLeaderboardButton: document.querySelector("#loadLeaderboardButton"),
  loadMetricsButton: document.querySelector("#loadMetricsButton"),
  messageBox: document.querySelector("#messageBox"),
  healthBadge: document.querySelector("#healthBadge"),
  sourceBadge: document.querySelector("#sourceBadge"),
  cacheProviderBadge: document.querySelector("#cacheProviderBadge"),
  profileDetails: document.querySelector("#profileDetails"),
  summaryGrid: document.querySelector("#summaryGrid"),
  platformCards: document.querySelector("#platformCards"),
  platformCount: document.querySelector("#platformCount"),
  leaderboardBody: document.querySelector("#leaderboardBody"),
  metricsGrid: document.querySelector("#metricsGrid"),
  metricsUpdated: document.querySelector("#metricsUpdated"),
  exampleButtons: document.querySelectorAll(".example-button"),
};

elements.apiBaseLabel.textContent = API_BASE_URL;

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchProfile();
});

elements.refreshButton.addEventListener("click", () => {
  refreshProfile();
});

elements.loadLeaderboardButton.addEventListener("click", () => {
  loadLeaderboard();
});

elements.loadMetricsButton.addEventListener("click", () => {
  loadMetrics();
});

elements.exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.handleInput.value = button.dataset.handle;
    searchProfile();
  });
});

initializeDashboard();

async function initializeDashboard() {
  await checkHealth();
  await Promise.all([loadLeaderboard(), loadMetrics()]);
}

async function checkHealth() {
  try {
    const result = await requestJson("/health");
    elements.healthBadge.textContent = result.success ? "API Online" : "API Issue";
    elements.healthBadge.className = result.success ? "badge badge-hit" : "badge badge-stale";
  } catch (error) {
    elements.healthBadge.textContent = "API Offline";
    elements.healthBadge.className = "badge badge-stale";
    showMessage("Backend is offline. Start the Express API before searching.", "error");
  }
}

async function searchProfile() {
  const handle = getHandle();
  if (!handle) return;

  setLoading(true, "Loading...");
  state.currentHandle = handle;

  try {
    const result = await requestJson(`/profile/${encodeURIComponent(handle)}`);
    renderProfile(result);
    showMessage(
      `Loaded ${result.data.handle} with ${formatSource(result.source)} using ${formatSource(result.cacheProvider)} cache.`,
      "success"
    );
    await Promise.all([loadLeaderboard(false), loadMetrics(false)]);
  } catch (error) {
    showError(error);
  } finally {
    setLoading(false);
  }
}

async function refreshProfile() {
  const handle = getHandle() || state.currentHandle;
  if (!handle) return;

  setLoading(true, "Loading...");
  state.currentHandle = handle;

  try {
    const result = await requestJson(`/profile/${encodeURIComponent(handle)}/refresh`, {
      method: "POST",
    });
    renderProfile(result);
    showMessage(
      `Refreshed ${result.data.handle} with ${formatSource(result.source)} using ${formatSource(result.cacheProvider)} cache.`,
      "success"
    );
    await Promise.all([loadLeaderboard(false), loadMetrics(false)]);
  } catch (error) {
    showError(error);
  } finally {
    setLoading(false);
  }
}

async function loadLeaderboard(showLoading = true) {
  if (showLoading) {
    elements.leaderboardBody.innerHTML = rowMessage("Loading...", 8);
  }

  try {
    const result = await requestJson("/leaderboard");
    renderLeaderboard(result.data || []);
  } catch (error) {
    elements.leaderboardBody.innerHTML = rowMessage(escapeHtml(getErrorMessage(error)), 8);
  }
}

async function loadMetrics(showLoading = true) {
  if (showLoading) {
    elements.metricsUpdated.textContent = "Loading";
    elements.metricsUpdated.className = "badge badge-fresh";
    elements.metricsGrid.innerHTML = `<div class="empty-state">Loading...</div>`;
  }

  try {
    const result = await requestJson("/metrics");
    renderMetrics(result.data || {});
  } catch (error) {
    elements.metricsUpdated.textContent = "Error";
    elements.metricsUpdated.className = "badge badge-stale";
    elements.metricsGrid.innerHTML = `<div class="empty-state">${escapeHtml(getErrorMessage(error))}</div>`;
  }
}

function renderProfile(result) {
  const profile = result.data || {};
  const summary = profile.summary || {};
  const platforms = profile.platforms || [];
  const lastUpdated = profile.lastUpdated || getLatestPlatformUpdate(platforms);

  elements.sourceBadge.textContent = formatSource(result.source);
  elements.sourceBadge.className = `badge ${getBadgeClass(result.source)}`;
  elements.cacheProviderBadge.textContent = formatSource(result.cacheProvider || "memory");
  elements.cacheProviderBadge.className = `badge ${getBadgeClass(result.cacheProvider || "memory")}`;

  elements.profileDetails.innerHTML = [
    detailCard(profile.handle || "Unknown", "Handle"),
    detailBadge(result.source, "Source"),
    detailBadge(result.cacheProvider || "memory", "Cache Provider"),
    detailCard(`${result.responseTimeMs || 0} ms`, "Response Time"),
    detailCard(formatDate(lastUpdated), "Last Updated"),
    result.warning ? warningBox(result.warning) : "",
  ].join("");

  elements.summaryGrid.innerHTML = [
    statCard(formatNumber(summary.bestRating || 0), "Best Rating"),
    statCard(formatNumber(summary.totalSolved || 0), "Total Solved"),
    statCard(formatNumber(summary.activePlatforms || 0), "Active Platforms"),
    statCard(`${result.responseTimeMs || 0} ms`, "Response Time"),
  ].join("");

  elements.platformCount.textContent = `${platforms.length} Platform${platforms.length === 1 ? "" : "s"}`;
  elements.platformCount.className = "badge badge-muted";

  elements.platformCards.innerHTML = platforms.length
    ? platforms.map(platformCard).join("")
    : `<div class="empty-state">No platform data returned.</div>`;
}

function renderLeaderboard(rows) {
  if (!rows.length) {
    elements.leaderboardBody.innerHTML = rowMessage("Search profiles to build the leaderboard.", 8);
    return;
  }

  elements.leaderboardBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.rank}</td>
          <td><strong>${escapeHtml(row.handle)}</strong></td>
          <td>${formatNumber(row.rating)}</td>
          <td>${formatNumber(row.maxRating)}</td>
          <td>${formatNumber(row.solved)}</td>
          <td>${formatNumber(row.totalSolved)}</td>
          <td><span class="badge ${getBadgeClass(row.source)}">${formatSource(row.source)}</span></td>
          <td>${formatDate(row.lastUpdated)}</td>
        </tr>
      `
    )
    .join("");
}

function renderMetrics(metrics) {
  const cards = [
    ["Total Requests", metrics.totalRequests],
    ["Cache Hits", metrics.cacheHits],
    ["Cache Misses", metrics.cacheMisses],
    ["Fresh Fetches", metrics.freshFetches],
    ["Stale Cache Uses", metrics.staleCacheUses],
    ["External API Failures", metrics.externalApiFailures],
    ["Rate Limited", metrics.rateLimitedRequests],
    ["Avg Response", `${metrics.averageResponseTimeMs || 0} ms`],
  ];

  elements.metricsGrid.innerHTML = cards
    .map(([label, value]) => statCard(formatMetricValue(value), label))
    .join("");

  elements.metricsUpdated.textContent = "Updated";
  elements.metricsUpdated.className = "badge badge-hit";
}

function platformCard(platform) {
  return `
    <article class="platform-card">
      <div class="platform-card-header">
        <div>
          <h3>${escapeHtml(platform.platform || "platform")}</h3>
          <span class="platform-meta">${escapeHtml(platform.handle || "unknown")}</span>
        </div>
        <span class="badge ${getBadgeClass(platform.source)}">${formatSource(platform.source)}</span>
      </div>
      <div class="platform-stats">
        <div>
          <strong>${formatNumber(platform.rating)}</strong>
          <span class="platform-meta">Rating</span>
        </div>
        <div>
          <strong>${formatNumber(platform.maxRating)}</strong>
          <span class="platform-meta">Max Rating</span>
        </div>
        <div>
          <strong>${escapeHtml(platform.rank || "unrated")}</strong>
          <span class="platform-meta">Rank</span>
        </div>
        <div>
          <strong>${formatNumber(platform.solvedCount)}</strong>
          <span class="platform-meta">Solved Count</span>
        </div>
      </div>
      <span class="platform-meta">Last updated ${formatDate(platform.lastUpdated)}</span>
    </article>
  `;
}

function statCard(value, label) {
  return `
    <div class="stat-card">
      <span class="stat-value">${escapeHtml(String(value))}</span>
      <span class="stat-label">${escapeHtml(label)}</span>
    </div>
  `;
}

function detailCard(value, label) {
  return `
    <div class="detail-card">
      <span class="detail-value">${escapeHtml(String(value))}</span>
      <span class="detail-label">${escapeHtml(label)}</span>
    </div>
  `;
}

function detailBadge(source, label) {
  return `
    <div class="detail-card">
      <span class="badge ${getBadgeClass(source)}">${formatSource(source)}</span>
      <span class="detail-label">${escapeHtml(label)}</span>
    </div>
  `;
}

function warningBox(message) {
  return `<div class="warning-box">${escapeHtml(message)}</div>`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error?.message || payload.message || "Request failed");
    error.status = response.status;
    error.code = payload.error?.code || "REQUEST_FAILED";
    throw error;
  }

  return payload;
}

function getHandle() {
  const handle = elements.handleInput.value.trim();

  if (!handle) {
    showMessage("Enter a handle first.", "error");
    return "";
  }

  return handle;
}

function setLoading(isLoading, message = "") {
  state.isLoading = isLoading;
  elements.searchButton.disabled = isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.loadLeaderboardButton.disabled = isLoading;
  elements.loadMetricsButton.disabled = isLoading;
  elements.searchButton.textContent = isLoading ? "Loading..." : "Search";
  elements.refreshButton.textContent = isLoading ? "Loading..." : "Refresh";

  if (message) {
    showMessage(message, "loading");
  }
}

function showError(error) {
  const message = error.status === 429
    ? "Rate limit reached. Please wait a minute before trying again."
    : getErrorMessage(error);

  showMessage(message, "error");
}

function showMessage(message, type = "") {
  elements.messageBox.textContent = message;
  elements.messageBox.className = `message ${type}`.trim();
}

function rowMessage(message, colspan) {
  return `
    <tr>
      <td colspan="${colspan}">${message}</td>
    </tr>
  `;
}

function getBadgeClass(source) {
  const classes = {
    cache_hit: "badge-hit",
    cache_miss: "badge-miss",
    fresh_fetch: "badge-fresh",
    stale_cache: "badge-stale",
    redis: "badge-redis",
    memory: "badge-memory",
    real_api: "badge-real",
    mock_data: "badge-mock",
  };

  return classes[source] || "badge-muted";
}

function formatSource(source) {
  if (!source) return "Unknown";
  return String(source)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatMetricValue(value) {
  if (typeof value === "string" && value.endsWith(" ms")) {
    return value;
  }

  return formatNumber(value);
}

function getLatestPlatformUpdate(platforms) {
  return platforms
    .map((platform) => platform.lastUpdated)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function getErrorMessage(error) {
  if (error.code && error.message) {
    return `${error.code}: ${error.message}`;
  }

  return error.message || "Something went wrong.";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
