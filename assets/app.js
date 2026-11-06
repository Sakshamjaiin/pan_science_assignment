/* PRD to Sprint Backlog
   The AI drafts the backlog. Everything after that (readiness checks, sprint allocation, exports) is plain code,
   so results are repeatable and easy to audit. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PRIORITY_RANK = { Must: 0, Should: 1, Could: 2 };
  const FIB = [1, 2, 3, 5, 8, 13, 21];
  const VAGUE = ["fast", "quick", "quickly", "easy", "easily", "user friendly", "user-friendly", "intuitive", "seamless",
    "seamlessly", "robust", "simple", "simply", "efficient", "efficiently", "appropriate", "as needed", "etc", "and so on",
    "flexible", "nice", "good", "better", "best", "optimal", "minimal", "soon", "asap", "several", "some"];
  const DEFAULT_MODELS = { claude: "claude-sonnet-5-5", gemini: "gemini-2.5-flash" };

  let current = null; // { data, plan, issues, settings }

  // ---------- helpers ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let toastTimer = null;
  const toast = (msg) => { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800); };
  const setStatus = (msg, isErr) => { const s = $("status"); s.textContent = msg || ""; s.classList.toggle("err", !!isErr); };
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

  // Read a number input, keep it inside the input's own min and max, and write the used value back,
  // so the plan always matches what the screen shows.
  function numInput(id, fallback) {
    const el = $(id);
    let v = parseInt(el.value, 10);
    if (isNaN(v)) v = fallback;
    v = Math.min(Number(el.max), Math.max(Number(el.min), v));
    if (String(v) !== el.value) el.value = v;
    return v;
  }

  function settings() {
    return {
      sprints: numInput("sprints", 6),
      velocity: numInput("velocity", 32),
      weeks: numInput("sprintWeeks", 2),
      start: $("startDate").value || "2026-11-16",
      mode: document.querySelector('input[name="mode"]:checked').value,
      provider: $("provider").value,
      model: $("model").value.trim(),
      key: $("apiKey").value.trim(),
    };
  }

  function fmtDate(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function sprintDates(i, s) {
    const start = new Date(s.start + "T00:00:00");
    if (isNaN(start)) return "";
    const a = new Date(start); a.setDate(a.getDate() + i * s.weeks * 7);
    const b = new Date(a); b.setDate(b.getDate() + s.weeks * 7 - 3);
    return fmtDate(a) + " to " + fmtDate(b);
  }

  // ---------- flatten ----------
  // Every story needs a unique id for the plan, the detail view and the exports. A missing id is filled in,
  // and a repeated id is renamed (the readiness checks report both).
  function flatten(data) {
    const stories = [];
    const used = new Set();
    (data.epics || []).forEach((e, ei) => {
      if (!e.id) e.id = "E" + (ei + 1);
      (e.stories || []).forEach((st, si) => {
        let id = String(st.id || "").trim();
        let idNote = null;
        if (!id) { id = e.id + "-S" + (si + 1); idNote = "missing"; }
        if (used.has(id)) {
          let n = 2; while (used.has(id + "-" + n)) n++;
          idNote = { duplicateOf: id }; id = id + "-" + n;
        }
        used.add(id);
        if (idNote) st.id = id; // keep the JSON export in step with the plan
        stories.push(Object.assign({
          type: "Story", acceptance_criteria: [], depends_on: [], labels: [], points: 0, priority: "Should"
        }, st, { id, idNote, epicId: e.id, epicName: e.name, order: ei * 1000 + si }));
      });
    });
    return stories;
  }

  // ---------- readiness checks (Definition of Ready) ----------
  function checkStories(stories) {
    const ids = new Set(stories.map((s) => s.id));
    const byId = Object.fromEntries(stories.map((s) => [s.id, s]));
    const issues = [];
    const add = (s, rule, detail, level) => issues.push({ id: s.id, title: s.title, rule, detail, level: level || "medium" });

    stories.forEach((s) => {
      if (s.idNote === "missing") add(s, "Story id", "The story had no id. It was given " + s.id + ".", "medium");
      else if (s.idNote) add(s, "Story id", "The id " + s.idNote.duplicateOf + " is used by more than one story. This one was renamed " + s.id + ". Check which story its dependants mean.", "high");
      const story = norm(s.story);
      if (!/^as (a|an|the) .+?, (i|we) (want|need) .+?, so that .+/i.test(story)) {
        add(s, "Story format", "Write it as: As a user, I want a capability, so that a benefit.", "medium");
      }
      const ac = s.acceptance_criteria || [];
      if (ac.length < 2) add(s, "Acceptance criteria", "Needs at least 2 testable acceptance criteria. Found " + ac.length + ".", "high");
      if (ac.length > 5) add(s, "Story size", ac.length + " acceptance criteria suggests the story is too big. Consider splitting.", "medium");
      ac.forEach((c, i) => {
        if (!/^given\b/i.test(norm(c))) add(s, "Testable criteria", "Criterion " + (i + 1) + " is not in Given / When / Then form.", "medium");
        const low = " " + norm(c).toLowerCase().replace(/[.,;:()]/g, " ") + " ";
        const hits = VAGUE.filter((w) => low.includes(" " + w + " "));
        if (hits.length) add(s, "Vague wording", 'Criterion ' + (i + 1) + ' uses "' + hits.join('", "') + '". Replace with a number or a clear state.', "medium");
      });
      const p = Number(s.points);
      if (!FIB.includes(p)) add(s, "Estimate", "Points (" + s.points + ") are not on the Fibonacci scale.", "medium");
      if (p > 8) add(s, "Story size", p + " points is too big for one sprint item. Split it below 8.", "high");
      if (!PRIORITY_RANK.hasOwnProperty(s.priority)) add(s, "Priority", "Priority must be Must, Should or Could.", "medium");
      (s.depends_on || []).forEach((d) => {
        if (!ids.has(d)) add(s, "Dependency", "Depends on " + d + ", which is not in the backlog.", "high");
        else if (s.priority === "Must" && byId[d].priority !== "Must") {
          add(s, "Priority conflict", "This Must story depends on " + d + " (" + byId[d].priority + "). Raise " + d + " to Must or remove the dependency.", "high");
        }
      });
    });

    // cycles
    const state = {};
    const visit = (id, path) => {
      if (state[id] === 1) { const s = byId[id]; if (s) add(s, "Dependency", "Circular dependency: " + path.concat(id).join(" > "), "high"); return; }
      if (state[id] === 2 || !byId[id]) return;
      state[id] = 1;
      (byId[id].depends_on || []).forEach((d) => visit(d, path.concat(id)));
      state[id] = 2;
    };
    stories.forEach((s) => visit(s.id, []));
    return issues;
  }

  // ---------- sprint allocation ----------
  function allocate(stories, s) {
    const byId = Object.fromEntries(stories.map((x) => [x.id, x]));
    const indeg = {}; const children = {};
    stories.forEach((x) => { indeg[x.id] = 0; children[x.id] = []; });
    stories.forEach((x) => (x.depends_on || []).forEach((d) => { if (byId[d]) { indeg[x.id]++; children[d].push(x.id); } }));
    const rank = (x) => [PRIORITY_RANK[x.priority] ?? 1, x.order];
    const cmp = (a, b) => { const ra = rank(byId[a]), rb = rank(byId[b]); return ra[0] - rb[0] || ra[1] - rb[1]; };
    let ready = stories.filter((x) => indeg[x.id] === 0).map((x) => x.id).sort(cmp);
    const order = [];
    while (ready.length) {
      const id = ready.shift(); order.push(id);
      children[id].forEach((c) => { indeg[c]--; if (indeg[c] === 0) { ready.push(c); ready.sort(cmp); } });
    }
    stories.forEach((x) => { if (!order.includes(x.id)) order.push(x.id); }); // cycles go last

    const load = Array(s.sprints).fill(0);
    const sprintOf = {};
    const reason = {};
    const seen = {};
    // Place one story, placing its dependencies first. A dependency is pulled forward with the story that needs it,
    // whatever its own priority (the readiness checks flag that as a priority conflict).
    const place = (id) => {
      if (seen[id]) return;
      seen[id] = true;
      const x = byId[id];
      (x.depends_on || []).forEach((d) => { if (byId[d]) place(d); });
      const pts = Number(x.points) || 0;
      let min = 0; let blocked = false;
      (x.depends_on || []).forEach((d) => {
        if (!byId[d]) return;
        if (sprintOf[d] == null) { blocked = true; return; }
        min = Math.max(min, sprintOf[d] + (byId[d].type === "Spike" ? 1 : 0));
      });
      if (blocked) { sprintOf[id] = null; reason[id] = "A dependency is not planned"; return; }
      if (pts > s.velocity) { sprintOf[id] = null; reason[id] = "Bigger than one sprint's velocity"; return; }
      let placed = null;
      for (let i = min; i < s.sprints; i++) { if (load[i] + pts <= s.velocity) { placed = i; break; } }
      if (placed == null) { sprintOf[id] = null; reason[id] = "No capacity left in the planned sprints"; return; }
      load[placed] += pts; sprintOf[id] = placed;
    };
    // Fill capacity tier by tier: all Must stories first, then Should, then Could. So when capacity is tight,
    // Could items drop out first, then Should, and Must stories are never pushed out by lower priority work.
    const tierOf = (x) => PRIORITY_RANK[x.priority] ?? 1;
    [0, 1, 2].forEach((tier) => order.forEach((id) => { if (tierOf(byId[id]) === tier) place(id); }));
    const sprints = Array.from({ length: s.sprints }, (_, i) => ({ index: i, name: "Sprint " + (i + 1), dates: sprintDates(i, s), load: load[i], items: [] }));
    const overflow = [];
    order.forEach((id) => { const i = sprintOf[id]; if (i == null) overflow.push(Object.assign({ reason: reason[id] }, byId[id])); else sprints[i].items.push(byId[id]); });    return { sprints, overflow, sprintOf };
  }

  // ---------- rendering ----------
  function render() {
    const { data, stories, plan, issues, s } = current;
    $("empty").hidden = true; $("out").hidden = false;
    const total = stories.reduce((a, x) => a + (Number(x.points) || 0), 0);
    const capacity = s.sprints * s.velocity;
    const plannedPts = plan.sprints.reduce((a, x) => a + x.load, 0);
    const highIssues = issues.filter((i) => i.level === "high").length;
    const fits = plan.overflow.length === 0;
    const lastUsed = plan.sprints.reduce((m, sp) => (sp.items.length ? sp.index + 1 : m), 0);
    const mustPts = stories.filter((x) => x.priority === "Must").reduce((a, x) => a + (Number(x.points) || 0), 0);

    // overview
    const epicRows = (data.epics || []).map((e) => {
      const pts = (e.stories || []).reduce((a, x) => a + (Number(x.points) || 0), 0);
      return { name: e.id + " " + e.name, pts };
    });
    const maxE = Math.max(1, ...epicRows.map((r) => r.pts));
    const prio = ["Must", "Should", "Could"].map((p) => ({ p, pts: stories.filter((x) => x.priority === p).reduce((a, x) => a + (Number(x.points) || 0), 0) }));
    const maxP = Math.max(1, ...prio.map((r) => r.pts));
    $("tab-overview").innerHTML =
      '<div class="stats">' +
      stat("Epics", (data.epics || []).length, "capability groups") +
      stat("Stories", stories.length, stories.filter((x) => x.type !== "Story").length + " spikes and enablers") +
      stat("Total points", total, mustPts + " Must") +
      stat("Capacity", capacity, s.sprints + " sprints x " + s.velocity, plannedPts / capacity > 0.9 ? "warn" : "") +
      stat("Fits the plan", fits ? "Yes" : "No", fits ? "Uses " + lastUsed + " of " + s.sprints + " sprints" : plan.overflow.length + " items not planned", fits ? "good" : "bad") +
      stat("Readiness issues", issues.length, highIssues + " high", issues.length ? (highIssues ? "bad" : "warn") : "good") +
      "</div>" +
      '<div class="two"><div class="card"><h2>Points by epic</h2><div class="bars">' +
      epicRows.map((r) => '<div class="row"><span>' + esc(r.name) + '</span><div class="bar"><i style="width:' + (100 * r.pts / maxE) + '%"></i></div><span class="num">' + r.pts + "</span></div>").join("") +
      '</div></div><div class="card"><h2>Points by priority</h2><div class="bars">' +
      prio.map((r) => '<div class="row"><span>' + r.p + '</span><div class="bar ' + r.p.toLowerCase() + '"><i style="width:' + (100 * r.pts / maxP) + '%"></i></div><span class="num">' + r.pts + "</span></div>").join("") +
      '</div><p class="hint">Must is the minimum for launch. If capacity is tight, Could items move out first, then Should.</p></div></div>';

    // plan
    const cols = plan.sprints.map((sp) => {
      const pct = Math.min(100, 100 * sp.load / s.velocity);
      return '<div class="col"><h3>' + sp.name + '</h3><div class="dates">' + esc(sp.dates) + '</div>' +
        '<div class="load"><div class="bar"><i style="width:' + pct + '%"></i></div><div class="txt">' + sp.load + " of " + s.velocity + " points</div></div>" +
        sp.items.map(card).join("") + "</div>";
    });
    if (plan.overflow.length) {
      cols.push('<div class="col over"><h3>Not yet planned</h3><div class="dates">Needs more capacity or a scope decision</div><div class="load"></div>' +
        plan.overflow.map((x) => card(x) .replace("</div></div>", '</div><div class="hint">' + esc(x.reason) + "</div></div>")).join("") + "</div>");
    }
    $("tab-plan").innerHTML = '<p class="hint" style="margin:0 0 10px">Must stories are placed first, then Should, then Could. Each story goes after its dependencies (one sprint after a spike), without going over the sprint velocity. Click a card for details.</p><div class="board">' + cols.join("") + "</div>";

    // backlog
    let rows = "";
    (data.epics || []).forEach((e) => {
      rows += '<tr class="epic"><td colspan="6">' + esc(e.id + " " + e.name) + ' <span class="hint" style="font-weight:400">' + esc(e.goal || "") + "</span></td></tr>";
      stories.filter((x) => x.epicId === e.id).forEach((x) => {
        const sp = plan.sprintOf[x.id];
        rows += '<tr class="story" tabindex="0" aria-expanded="false" data-id="' + esc(x.id) + '"><td>' + esc(x.id) + "</td><td><b>" + esc(x.title) + '</b><div class="hint">' + esc(x.story) + '</div></td><td><span class="chip type">' + esc(x.type) + '</span></td><td><span class="chip ' + esc(x.priority) + '">' + esc(x.priority) + '</span></td><td class="pts">' + esc(x.points) + "</td><td>" + (sp == null ? "Not planned" : "Sprint " + (sp + 1)) + "</td></tr>";
      });
    });
    $("tab-backlog").innerHTML = '<p class="hint" style="margin:0 0 10px">Click a story to see acceptance criteria, dependencies and to copy it as a build spec for a developer or Claude Code.</p><div class="table-wrap"><table><thead><tr><th>ID</th><th>Story</th><th>Type</th><th>Priority</th><th>Points</th><th>Sprint</th></tr></thead><tbody>' + rows + "</tbody></table></div>";

    // checks
    const count = $("checkCount"); count.textContent = issues.length; count.classList.toggle("zero", issues.length === 0);
    const rules = '<div class="rules"><b>Definition of Ready rules checked by code</b><ol>' +
      "<li>Story is written as As a, I want, so that.</li><li>2 to 5 acceptance criteria, each in Given / When / Then form.</li>" +
      "<li>No vague words in acceptance criteria (fast, easy, intuitive, seamless and similar).</li>" +
      "<li>Estimate on the Fibonacci scale and not above 8 points.</li><li>Priority is Must, Should or Could.</li>" +
      "<li>Every dependency exists, there are no cycles, and a Must story never depends on a Should or Could story.</li>" +
      "<li>Every story has a unique id.</li></ol></div>";
    $("tab-checks").innerHTML = rules + (issues.length
      ? issues.sort((a, b) => (a.level === "high" ? 0 : 1) - (b.level === "high" ? 0 : 1)).map((i) => '<div class="issue ' + (i.level === "high" ? "high" : "") + '"><div class="h">' + esc(i.id + " " + i.title) + " : " + esc(i.rule) + '</div><div class="d">' + esc(i.detail) + "</div></div>").join("")
      : '<div class="ok-box">Every story passes the Definition of Ready checks.</div>');

    // questions
    const li = (arr) => (arr && arr.length ? "<ol>" + arr.map((q) => "<li>" + esc(q) + "</li>").join("") + "</ol>" : '<p class="hint">None.</p>');
    $("tab-questions").innerHTML = '<div class="list"><h3>Open questions for the client or Product Manager</h3>' + li(data.open_questions) +
      '</div><div class="list"><h3>Assumptions made</h3>' + li(data.assumptions) + "</div>" +
      '<p class="hint">Take these to the next client call. A requirement is complete only when its open questions are answered.</p>';

    // export
    $("tab-export").innerHTML = '<div class="exp">' +
      expCard("Jira CSV", "In Jira Cloud: Settings, System, External system import, CSV. Map Issue Id and Parent Id so stories link to their epics. The Sprint column only matches sprints that already exist on your board.", "dlCsv", "Download CSV") +
      expCard("Markdown", "Sprint plan and full backlog for Confluence, Notion or a client email.", "dlMd", "Download Markdown") +
      expCard("JSON", "The raw backlog, for other tools or to load back later.", "dlJson", "Download JSON") +
      '</div><div class="card"><h2>CSV preview</h2><pre id="csvPreview"></pre></div>';
    const csv = toCsv(); $("csvPreview").textContent = csv.split("\n").slice(0, 8).join("\n");
    $("dlCsv").onclick = () => download("backlog_jira_import.csv", csv, "text/csv");
    $("dlMd").onclick = () => download("backlog_and_sprint_plan.md", toMarkdown(), "text/markdown");
    $("dlJson").onclick = () => download("backlog.json", JSON.stringify(current.data, null, 2), "application/json");

    // interactions (mouse, and Enter or Space for keyboard users)
    document.querySelectorAll("#tab-backlog tr.story").forEach((tr) => onActivate(tr, () => toggleDetail(tr)));
    document.querySelectorAll(".scard").forEach((c) => onActivate(c, () => {
      showTab("backlog");
      const tr = document.querySelector('#tab-backlog tr.story[data-id="' + CSS.escape(c.dataset.id) + '"]');
      if (tr) { if (!tr.nextElementSibling || !tr.nextElementSibling.classList.contains("detail")) toggleDetail(tr); tr.scrollIntoView({ behavior: "smooth", block: "center" }); tr.focus({ preventScroll: true }); }
    }));
    updateStale();
  }

  function onActivate(el, fn) {
    el.addEventListener("click", fn);
    el.addEventListener("keydown", (ev) => { if (ev.target === el && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); fn(); } });
  }

  function stat(k, v, sub, cls) { return '<div class="stat ' + (cls || "") + '"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div><div class="s">' + esc(sub) + "</div></div>"; }
  function card(x) { return '<div class="scard" tabindex="0" role="button" data-id="' + esc(x.id) + '"><div class="top"><span>' + esc(x.id) + " · " + esc(x.type) + '</span><span class="pts">' + esc(x.points) + ' pts</span></div><div class="t">' + esc(x.title) + '</div><div style="margin-top:4px"><span class="chip ' + esc(x.priority) + '">' + esc(x.priority) + "</span></div></div>"; }
  function expCard(t, d, id, b) { return '<div class="card"><h2>' + t + "</h2><p>" + d + '</p><button class="btn" id="' + id + '" type="button">' + b + "</button></div>"; }

  function toggleDetail(tr) {
    const next = tr.nextElementSibling;
    if (next && next.classList.contains("detail")) { next.remove(); tr.setAttribute("aria-expanded", "false"); return; }
    tr.setAttribute("aria-expanded", "true");
    const x = current.stories.find((s) => s.id === tr.dataset.id);
    const iss = current.issues.filter((i) => i.id === x.id);
    const d = document.createElement("tr"); d.className = "detail";
    d.innerHTML = '<td></td><td colspan="5"><div class="detail-box"><b>Acceptance criteria</b><ul>' +
      (x.acceptance_criteria || []).map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>" +
      '<div class="meta">Depends on: ' + esc((x.depends_on || []).join(", ") || "none") + " &nbsp;|&nbsp; Labels: " + esc((x.labels || []).join(", ") || "none") + "</div>" +
      (iss.length ? '<div class="meta" style="color:var(--bad)">Readiness: ' + esc(iss.map((i) => i.rule).join("; ")) + "</div>" : '<div class="meta" style="color:var(--ok)">Passes Definition of Ready</div>') +
      '<button class="btn" type="button">Copy as build spec</button></div></td>';
    d.querySelector("button").addEventListener("click", (ev) => { ev.stopPropagation(); copy(buildSpec(x)); });
    tr.after(d);
  }

  function buildSpec(x) {
    const sp = current.plan.sprintOf[x.id];
    return [
      "# " + x.id + ": " + x.title,
      "",
      "Epic: " + x.epicId + " " + x.epicName + " | Type: " + x.type + " | Priority: " + x.priority + " | Estimate: " + x.points + " points | Sprint: " + (sp == null ? "not planned" : sp + 1),
      "",
      "## User story",
      x.story,
      "",
      "## Acceptance criteria",
      ...(x.acceptance_criteria || []).map((c, i) => (i + 1) + ". " + c),
      "",
      "## Dependencies",
      (x.depends_on || []).length ? x.depends_on.join(", ") : "None",
      "",
      "## Definition of Done",
      "1. All acceptance criteria pass and are covered by tests.",
      "2. Code reviewed and merged; pipeline green.",
      "3. Deployed to staging and verified by QA.",
      "4. No open Sev 1 or Sev 2 bugs on this story.",
      "5. Product Manager accepted.",
      "",
      "## Notes for the builder",
      "Build only what the acceptance criteria describe. If anything is unclear, stop and ask instead of guessing.",
    ].join("\n");
  }

  function copy(text) {
    const done = () => toast("Copied to clipboard");
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => fallback());
    else fallback();
    function fallback() { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("Copy failed"); } ta.remove(); }
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type: type + ";charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- exports ----------
  function csvCell(v) { const s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function toCsv() {
    const { data, stories, plan } = current;
    const head = ["Issue Id", "Issue Type", "Summary", "Description", "Priority", "Story Points", "Sprint", "Labels", "Parent Id"];
    const pmap = { Must: "High", Should: "Medium", Could: "Low" };
    const lines = [head.join(",")];
    const epicNum = {};
    (data.epics || []).forEach((e, i) => {
      epicNum[e.id] = i + 1;
      lines.push([i + 1, "Epic", e.id + " " + e.name, e.goal || "", "", "", "", "", ""].map(csvCell).join(","));
    });
    stories.forEach((x, i) => {
      const sp = plan.sprintOf[x.id];
      const desc = x.story + "\n\nAcceptance criteria:\n" + (x.acceptance_criteria || []).map((c) => "* " + c).join("\n") +
        ((x.depends_on || []).length ? "\n\nDepends on: " + x.depends_on.join(", ") : "") + "\n\nBacklog id: " + x.id;
      const labels = (x.labels || []).concat(x.type !== "Story" ? [x.type.toLowerCase()] : []).map((l) => String(l).replace(/\s+/g, "_")).join(" ");
      lines.push([100 + i, x.type === "Story" ? "Story" : "Task", x.id + " " + x.title, desc, pmap[x.priority] || "Medium", x.points,
        sp == null ? "" : "Sprint " + (sp + 1), labels, epicNum[x.epicId] || ""].map(csvCell).join(","));
    });
    return lines.join("\n");
  }

  function toMarkdown() {
    const { data, stories, plan, issues, s } = current;
    const out = ["# " + (data.product || "Backlog") + ": backlog and sprint plan", "",
      "Sprints: " + s.sprints + " x " + s.weeks + " weeks, velocity " + s.velocity + " points. Generated with PRD to Sprint Backlog.", "", "## Sprint plan", ""];
    plan.sprints.forEach((sp) => {
      out.push("### " + sp.name + " (" + sp.dates + "), " + sp.load + " of " + s.velocity + " points");
      sp.items.forEach((x) => out.push("1. " + x.id + " " + x.title + " (" + x.points + " pts, " + x.priority + ")"));
      out.push("");
    });
    if (plan.overflow.length) { out.push("### Not yet planned"); plan.overflow.forEach((x) => out.push("1. " + x.id + " " + x.title + ": " + x.reason)); out.push(""); }
    out.push("## Backlog", "");
    (data.epics || []).forEach((e) => {
      out.push("### " + e.id + " " + e.name, e.goal || "", "");
      stories.filter((x) => x.epicId === e.id).forEach((x) => {
        out.push("#### " + x.id + " " + x.title + " (" + x.type + ", " + x.priority + ", " + x.points + " pts)", x.story, "", "Acceptance criteria:");
        (x.acceptance_criteria || []).forEach((c) => out.push("1. " + c));
        out.push("", "Depends on: " + ((x.depends_on || []).join(", ") || "none"), "");
      });
    });
    out.push("## Readiness issues", "");
    if (!issues.length) out.push("None."); else issues.forEach((i) => out.push("1. " + i.id + " " + i.rule + ": " + i.detail));
    out.push("", "## Open questions", "");
    (data.open_questions || []).forEach((q) => out.push("1. " + q));
    out.push("", "## Assumptions", "");
    (data.assumptions || []).forEach((q) => out.push("1. " + q));
    return out.join("\n");
  }

  // ---------- AI calls ----------
  function userMessage(prd, s) {
    return "Team context: " + s.sprints + " sprints of " + s.weeks + " weeks, planned velocity " + s.velocity +
      " story points per sprint. Size the backlog so the Must stories fit this capacity if the PRD allows it; if not, say so in open_questions.\n\nPRD:\n\"\"\"\n" + prd + "\n\"\"\"";
  }

  async function callClaude(prd, s) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": s.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: s.model || DEFAULT_MODELS.claude, max_tokens: 16000, system: window.BACKLOG_PROMPT, messages: [{ role: "user", content: userMessage(prd, s) }] }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body.error && body.error.message) || "Claude API error " + res.status);
    if (body.stop_reason === "max_tokens") throw new Error(CUT_OFF);
    return (body.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  }

  async function callGemini(prd, s) {
    const model = s.model || DEFAULT_MODELS.gemini;
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": s.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: window.BACKLOG_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userMessage(prd, s) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 16384 },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body.error && body.error.message) || "Gemini API error " + res.status);
    const cand = (body.candidates || [])[0] || {};
    if (cand.finishReason === "MAX_TOKENS") throw new Error(CUT_OFF);
    if (!cand.content && body.promptFeedback && body.promptFeedback.blockReason) throw new Error("Gemini blocked the request (" + body.promptFeedback.blockReason + ").");
    const parts = (cand.content || {}).parts || [];
    return parts.map((p) => p.text || "").join("");
  }

  const CUT_OFF = "The model's answer was cut off before the backlog was complete. Try again, or shorten the PRD.";

  function parseJson(text) {
    let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b < a) throw new Error("The model did not return JSON. Try again.");
    let data;
    try { data = JSON.parse(t.slice(a, b + 1)); } catch (e) { throw new Error("The model returned incomplete or invalid JSON. Try again."); }
    if (!Array.isArray(data.epics) || !data.epics.length) throw new Error("The response has no epics. Try again or use a longer PRD.");
    return data;
  }

  // ---------- main ----------
  async function generate() {
    const s = settings();
    const prd = $("prd").value.trim();
    if (!prd) { setStatus("Paste a PRD or load the sample first.", true); return; }
    const btn = $("generate");
    let data;
    try {
      if (s.mode === "demo") {
        if (norm(prd) !== norm(window.SAMPLE_PRD)) {
          setStatus("Demo mode only has saved output for the sample PRD. Switch to Live and add an API key to run your own document.", true);
          return;
        }
        data = JSON.parse(JSON.stringify(window.DEMO_OUTPUT));
        setStatus("Loaded saved output for the sample PRD.");
      } else {
        if (!s.key) { setStatus("Add an API key for live mode.", true); return; }
        btn.disabled = true; setStatus("Drafting the backlog with " + (s.provider === "claude" ? "Claude" : "Gemini") + ". This can take up to a minute.");
        const text = s.provider === "claude" ? await callClaude(prd, s) : await callGemini(prd, s);
        data = parseJson(text);
        setStatus("Done. Review every story before it goes into a sprint.");
      }
      const stories = flatten(data);
      const issues = checkStories(stories);
      const plan = allocate(stories, s);
      current = { data, stories, issues, plan, s, source: { prd: norm(prd), mode: s.mode } };
      render(); showTab("overview");
    } catch (e) {
      setStatus(e.message || String(e), true);
    } finally { btn.disabled = false; }
  }

  function showTab(name) {
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("active", on); t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".tabpane").forEach((p) => (p.hidden = p.id !== "tab-" + name));
  }

  // Show a notice when the results no longer match the document or mode on screen.
  function updateStale() {
    if (!current) return;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    $("staleNote").hidden = norm($("prd").value) === current.source.prd && mode === current.source.mode;
  }

  function updateMode() {
    const s = settings();
    $("liveFields").hidden = s.mode !== "live";
    $("demoNote").hidden = s.mode === "live";
    const b = $("modeBadge");
    b.textContent = s.mode === "live" ? "Live mode" : "Demo mode";
    b.className = "badge " + (s.mode === "live" ? "badge-live" : "badge-demo");
    updateStale();
  }

  function updateMeta() {
    const t = $("prd").value;
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    $("prdMeta").textContent = words ? words + " words" : "";
    updateStale();
  }

  // wire up
  $("loadSample").onclick = () => { $("prd").value = window.SAMPLE_PRD; updateMeta(); setStatus("Sample PRD loaded."); };
  // Two separate clears: "Clear" empties only the document text; "Clear results" removes the generated backlog
  // and returns the results area to its starting state. Team setup and mode are kept either way.
  $("clearPrd").onclick = () => { $("prd").value = ""; updateMeta(); setStatus(""); $("prd").focus(); };
  function clearResults() {
    current = null;
    document.querySelectorAll(".tabpane").forEach((p) => (p.innerHTML = ""));
    const count = $("checkCount"); count.textContent = ""; count.classList.remove("zero");
    $("staleNote").hidden = true;
    showTab("overview");
    $("out").hidden = true; $("empty").hidden = false;
    setStatus("Results cleared.");
  }
  $("clearResults").onclick = clearResults;
  $("fileInput").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { $("prd").value = r.result; updateMeta(); setStatus("Loaded " + f.name + "."); }; r.readAsText(f);
    e.target.value = "";
  };
  $("uploadBtn").addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); $("fileInput").click(); } });
  $("prd").addEventListener("input", updateMeta);
  document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener("change", updateMode));
  $("provider").onchange = () => { $("model").value = DEFAULT_MODELS[$("provider").value]; };
  $("generate").onclick = generate;
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  ["sprints", "velocity", "sprintWeeks", "startDate"].forEach((id) => $(id).addEventListener("change", () => {
    if (!current) return;
    current.s = Object.assign(current.s, settings());
    current.plan = allocate(current.stories, current.s);
    render();
  }));

  updateMode();
  // expose pure functions for tests
  window.__backlog = { flatten, checkStories, allocate };
})();
