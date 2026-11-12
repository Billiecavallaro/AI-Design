// billie.mcp homepage: hotspots, live demo and copy button. No build step, no dependencies.
(() => {
  const MCP_URL = `${location.origin}/mcp`;

  // ---------- Hotspots over the garage illustration ----------
  // x/y are in the illustration's 1600×900 coordinate space.
  const SPOTS = [
    { id: "monitor", x: 806, y: 430, kicker: "01 · The client", title: "Any AI agent", body: "Claude, ChatGPT, a recruiter’s sourcing bot. It asks a question in plain English and lets the protocol handle the rest." },
    { id: "cable", x: 1150, y: 760, kicker: "02 · The protocol", title: "MCP, the universal plug", body: "Model Context Protocol is an open standard for connecting AI to tools and data. One plug works with every compatible agent." },
    { id: "rack", x: 1318, y: 420, kicker: "03 · The server", title: "billie.mcp", body: "My server. It’s always on, it tells agents what it can do, and it answers them directly." },
    { id: "peg", x: 800, y: 230, kicker: "04 · Tools", title: "Things agents can do", body: "Actions an agent can take on your behalf.", code: "get_fit_for_role\nrequest_full_access\nbook_intro\nlist_products" },
    { id: "cabinet", x: 470, y: 548, kicker: "05 · Resources", title: "Things agents can read", body: "Case study summaries, my bio and my résumé. Full case studies stay gated, so agents request access the same way people do." },
    { id: "shelf", x: 466, y: 206, kicker: "06 · Products", title: "The shop door", body: "Vibe Lab and my Claude skills bundle for designers. Agents can find them, compare them and return a checkout link." },
    { id: "billie", x: 1088, y: 372, kicker: "07 · The designer", title: "Billie Cavallaro", body: "Principal product designer who shipped Capital One’s first AI risk product. Former founder of Space Shake, as seen on Shark Tank." },
    { id: "dog", x: 892, y: 650, kicker: "08 · Head of QA", title: "Cash", body: "Reviews every release from the dog bed. Approval rating: pending treats." },
  ];

  const stage = document.getElementById("top");
  const md = { kicker: document.getElementById("md-kicker"), title: document.getElementById("md-title"), body: document.getElementById("md-body") };
  let active = null;

  const setActive = (id) => {
    active = id;
    stage.querySelectorAll(".spot").forEach((el) => {
      const on = el.dataset.id === id;
      el.classList.toggle("active", on);
      el.querySelector("button").setAttribute("aria-expanded", String(on));
    });
    const s = SPOTS.find((x) => x.id === id);
    if (s) { md.kicker.textContent = s.kicker; md.title.textContent = s.title; md.body.textContent = s.body; }
  };

  for (const s of SPOTS) {
    const left = (s.x / 1600) * 100, top = (s.y / 900) * 100;
    const wrap = document.createElement("div");
    wrap.className = "spot";
    wrap.dataset.id = s.id;
    wrap.style.left = `${left}%`;
    wrap.style.top = `${top}%`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hs";
    btn.setAttribute("aria-label", `${s.kicker}: ${s.title}`);
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="ring"></span><span class="dot"></span>';

    const card = document.createElement("div");
    card.className = "float-card";
    card.setAttribute("role", "tooltip");
    Object.assign(card.style, left > 58 ? { right: "30px" } : { left: "30px" }, top > 62 ? { bottom: "0" } : { top: "-24px" });
    card.innerHTML = '<div class="card-kicker"></div><div class="card-title"></div><div class="card-body"></div>';
    card.children[0].textContent = s.kicker;
    card.children[1].textContent = s.title;
    card.children[2].textContent = s.body;
    if (s.code) { const c = document.createElement("div"); c.className = "card-code"; c.textContent = s.code; card.appendChild(c); }

    btn.addEventListener("mouseenter", () => setActive(s.id));
    btn.addEventListener("focus", () => setActive(s.id));
    btn.addEventListener("mouseleave", () => active === s.id && setActive(null));
    btn.addEventListener("blur", () => active === s.id && setActive(null));
    btn.addEventListener("click", () => setActive(active === s.id ? null : s.id));

    wrap.append(btn, card);
    stage.appendChild(wrap);
  }
  document.addEventListener("keydown", (e) => e.key === "Escape" && setActive(null));

  // ---------- Live demo: real MCP calls ----------
  const out = document.getElementById("try-out");
  const callLabel = document.getElementById("try-call");
  const status = document.getElementById("try-status");
  const jd = document.getElementById("jd");
  let rpcId = 1;

  async function callTool(name, args) {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method: "tools/call", params: { name, arguments: args } }),
    });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const msg = await res.json();
    if (msg.error) throw new Error(msg.error.message);
    const text = msg.result?.content?.[0]?.text ?? "";
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
  }

  document.querySelectorAll(".try-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const name = btn.dataset.tool;
      const args =
        name === "get_fit_for_role" ? { job_description: jd.value.trim() || "Product design leader for AI products" }
        : name === "book_intro" ? { purpose: "Intro from billie.mcp" }
        : {};
      callLabel.textContent = `tools/call · ${name}`;
      status.textContent = "calling…";
      out.style.color = "#b5f25a";
      out.textContent = `→ ${name}(${Object.keys(args).length ? JSON.stringify(args).slice(0, 120) + (JSON.stringify(args).length > 120 ? "…" : "") : ""})\n`;
      try {
        out.textContent += `\n${await callTool(name, args)}`;
        status.textContent = "200 OK";
      } catch (err) {
        out.style.color = "#ffb4b4";
        out.textContent += `\nCouldn’t reach the server: ${err.message}`;
        status.textContent = "error";
      }
      out.scrollTop = 0;
    }),
  );

  // ---------- Connect section ----------
  document.querySelectorAll(".mcp-url").forEach((el) => (el.textContent = MCP_URL));
  const copyBtn = document.getElementById("copy-url");
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(MCP_URL); copyBtn.textContent = "Copied!"; }
    catch { copyBtn.textContent = MCP_URL; }
    setTimeout(() => (copyBtn.textContent = "Copy server URL"), 1800);
  });
})();
