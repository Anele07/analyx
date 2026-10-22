const tabs = [
  { button: document.querySelector("#single-tab"), panel: document.querySelector("#single-panel") },
  { button: document.querySelector("#link-tab"), panel: document.querySelector("#link-panel") },
  { button: document.querySelector("#dataset-tab"), panel: document.querySelector("#dataset-panel") },
];

for (const tab of tabs) {
  tab.button.addEventListener("click", () => {
    for (const item of tabs) {
      const selected = item === tab;
      item.button.classList.toggle("is-active", selected);
      item.button.setAttribute("aria-selected", String(selected));
      item.panel.hidden = !selected;
    }
  });
}

for (const button of document.querySelectorAll("[data-example]")) {
  button.addEventListener("click", () => {
    document.querySelector("#text-input").value = button.dataset.example;
    document.querySelector("#text-input").focus();
  });
}

function showError(target, message) {
  target.textContent = message;
  target.hidden = false;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function signed(value) {
  return `${value >= 0 ? "+" : ""}${Number(value).toFixed(2)}`;
}

function scorePosition(value) {
  return `${((Math.max(-1, Math.min(1, Number(value))) + 1) / 2) * 100}%`;
}

function renderSingleResult(result) {
  const vader = result.vader;
  const distilbert = result.distilbert;
  const tone = result.verdict.toLowerCase() === "mixed" ? "neutral" : result.verdict.toLowerCase();
  const agreement = vader.sentiment === distilbert.sentiment
    ? "Both models agree"
    : `Models disagree: VADER reads ${vader.sentiment}, DistilBERT reads ${distilbert.sentiment}`;
  const vaderScore = Number(vader.score);
  const distilbertScore = Number(distilbert.signed_score);
  const verdict = escapeHtml(result.verdict);
  const root = document.querySelector("#single-result");

  root.innerHTML = `
    <div class="verdict-row">
      <h2 class="verdict verdict--${tone}">${verdict}</h2>
      <p class="agreement">${escapeHtml(agreement)}</p>
    </div>
    ${result.highlighted_text}
    <div class="scale" role="img" aria-label="VADER ${signed(vaderScore)}, DistilBERT ${signed(distilbertScore)}, on a scale from -1 to +1">
      <div class="scale-track"></div>
      <div class="marker marker-top" style="left:${scorePosition(vaderScore)}"><span>VADER ${signed(vaderScore)}</span></div>
      <div class="marker marker-bottom" style="left:${scorePosition(distilbertScore)}"><span>DistilBERT ${signed(distilbertScore)}</span></div>
    </div>
    <div class="scale-ends"><span>Negative</span><span>Positive</span></div>
    <details class="details">
      <summary>How each model scored this</summary>
      <p><strong>VADER:</strong> ${escapeHtml(vader.reason)}</p>
      <p><strong>DistilBERT:</strong> ${escapeHtml(distilbert.reason)}</p>
      ${Array.from(result.text).some((character) => character.charCodeAt(0) > 127 && /\p{L}/u.test(character)) && vader.sentiment === "neutral" && distilbert.sentiment !== "neutral"
        ? '<p class="muted">This text may not be in English. VADER only understands English, so DistilBERT’s result may be more reliable here.</p>'
        : ""}
    </details>`;
  root.hidden = false;
}

document.querySelector("#text-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = document.querySelector("#text-input").value.trim();
  const status = document.querySelector("#text-status");
  const error = document.querySelector("#single-error");
  const result = document.querySelector("#single-result");
  error.hidden = true;
  result.hidden = true;
  if (!text) {
    showError(error, "Paste some text above to see the result.");
    return;
  }

  status.textContent = "Analyzing…";
  const button = event.currentTarget.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Analysis failed. Please try again.");
    renderSingleResult(payload);
  } catch (cause) {
    showError(error, cause.message || "Could not reach the analysis service.");
  } finally {
    status.textContent = "";
    button.disabled = false;
  }
});

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows) {
  const columns = ["Text", "Verdict", "VADER", "VADER score", "DistilBERT", "DistilBERT score"];
  const csv = [
    columns.map(csvValue).join(","),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(",")),
  ].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "analyx_results.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function sentimentDistribution(rows) {
  const counts = { Positive: 0, Neutral: 0, Negative: 0 };
  for (const row of rows) {
    if (Object.hasOwn(counts, row.DistilBERT)) counts[row.DistilBERT] += 1;
  }
  return counts;
}

function renderSentimentChart(rows, chartId) {
  const counts = sentimentDistribution(rows);
  const total = rows.length;
  const categories = [
    { label: "Positive", key: "Positive", tone: "positive" },
    { label: "Neutral", key: "Neutral", tone: "neutral" },
    { label: "Negative", key: "Negative", tone: "negative" },
  ];
  let offset = 0;
  const stops = categories.map((category) => {
    const start = offset;
    offset += total ? counts[category.key] / total * 100 : 0;
    return `var(--${category.tone}) ${start}% ${offset}%`;
  });
  const agreement = total
    ? Math.round(rows.filter((row) => row.VADER === row.DistilBERT).length / total * 100)
    : 0;
  const dominant = categories.reduce((current, category) =>
    counts[category.key] > counts[current.key] ? category : current
  );
  const titleId = `${chartId}-chart-title`;
  const legend = categories.map((category) => {
    const count = counts[category.key];
    const percent = total ? Math.round(count / total * 100) : 0;
    return `
      <li class="chart-legend__item">
        <span class="chart-legend__label"><span class="legend-dot legend-dot--${category.tone}"></span>${category.label}</span>
        <strong>${count.toLocaleString()}</strong>
        <span class="chart-legend__percent">${percent}%</span>
      </li>`;
  }).join("");

  return `
    <div class="analytics-grid">
      <section class="chart-card" aria-labelledby="${titleId}">
        <div class="chart-card__heading">
          <div>
            <p class="eyebrow">AUDIENCE SENTIMENT</p>
            <h3 id="${titleId}">Sentiment split</h3>
          </div>
          <span class="chart-caption">DistilBERT</span>
        </div>
        <div class="chart-layout">
          <div class="pie-chart" role="img" aria-label="Sentiment distribution: ${counts.Positive} positive, ${counts.Neutral} neutral, ${counts.Negative} negative" style="background: conic-gradient(${stops.join(", ")})">
            <span class="pie-chart__total">${total.toLocaleString()}<small>comments</small></span>
          </div>
          <ul class="chart-legend">${legend}</ul>
        </div>
      </section>
      <section class="insight-card" aria-label="Analysis highlights">
        <p class="eyebrow">AT A GLANCE</p>
        <div class="insight">
          <span>Most common sentiment</span>
          <strong class="insight__sentiment insight__sentiment--${dominant.tone}">${dominant.label}</strong>
        </div>
        <div class="insight">
          <span>Model agreement</span>
          <strong>${agreement}%</strong>
        </div>
        <p class="insight-card__note">Sentiment split uses the multilingual DistilBERT result. Agreement compares it with VADER.</p>
      </section>
    </div>`;
}

function renderDatasetResult(result, rootSelector = "#dataset-result") {
  const notes = [`Read from ${escapeHtml(result.source)}.`];
  const mixed = result.rows.filter((row) => row.Verdict === "Mixed").length;
  if (mixed) notes.push(`The models disagree on ${mixed.toLocaleString()} of ${result.rows.length.toLocaleString()} analyzed comments (marked Mixed).`);
  if (result.truncated) {
    notes.push(result.is_link
      ? `More items are available; only the first ${result.rows.length.toLocaleString()} were analyzed.`
      : `Only the first ${result.rows.length.toLocaleString()} of ${result.total.toLocaleString()} rows were analyzed.`);
  }
  const rows = result.rows.map((row) => `
    <tr>
      <td class="text-cell">${escapeHtml(row.Text)}</td>
      <td><span class="badge badge-${row.Verdict.toLowerCase()}">${escapeHtml(row.Verdict)}</span></td>
      <td>${escapeHtml(row.VADER)}</td>
      <td>${signed(row["VADER score"])}</td>
      <td>${escapeHtml(row.DistilBERT)}</td>
      <td>${signed(row["DistilBERT score"])}</td>
    </tr>`).join("");

  const root = document.querySelector(rootSelector);
  root.innerHTML = `
    ${renderSentimentChart(result.rows, rootSelector.slice(1))}
    <p class="dataset-note">${notes.join(" ")}</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Text</th><th>Verdict</th><th>VADER</th><th>VADER score</th><th>DistilBERT</th><th>DistilBERT score</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <button id="download-results" class="button button-primary" type="button">Download results</button>`;
  root.querySelector("#download-results").addEventListener("click", () => downloadCsv(result.rows));
  root.hidden = false;
}

document.querySelector("#link-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = document.querySelector("#link-url").value.trim();
  const status = document.querySelector("#link-status");
  const error = document.querySelector("#link-error");
  const result = document.querySelector("#link-result");
  error.hidden = true;
  result.hidden = true;
  if (!url) {
    showError(error, "Paste a social post or product-review link to continue.");
    return;
  }

  status.textContent = "Checking link and analyzing available comments…";
  const button = event.currentTarget.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const response = await fetch("/api/analyze-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Link analysis failed. Please try again.");
    renderDatasetResult(payload, "#link-result");
  } catch (cause) {
    showError(error, cause.message || "Could not reach the analysis service.");
  } finally {
    status.textContent = "";
    button.disabled = false;
  }
});

document.querySelector("#file-input").addEventListener("change", (event) => {
  const file = event.target.files[0];
  document.querySelector("#file-name").textContent = file ? file.name : "Choose a CSV, XLSX, or PDF file";
});

document.querySelector("#file-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = document.querySelector("#file-input").files[0];
  const status = document.querySelector("#file-status");
  const error = document.querySelector("#file-error");
  const result = document.querySelector("#dataset-result");
  error.hidden = true;
  result.hidden = true;
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) {
    showError(error, "Files must be 4 MB or smaller on this deployment.");
    return;
  }

  status.textContent = "Analyzing dataset…";
  const button = event.currentTarget.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/analyze-file", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Dataset analysis failed. Please try again.");
    renderDatasetResult(payload);
  } catch (cause) {
    showError(error, cause.message || "Could not reach the analysis service.");
  } finally {
    status.textContent = "";
    button.disabled = false;
  }
});
