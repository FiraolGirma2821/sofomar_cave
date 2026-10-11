/* =================================================================
   1. LANGUAGE SWITCHER
   ================================================================= */
function setLang(event, lang) {
  document.querySelectorAll("[data-en]").forEach(el => {
    const text = el.getAttribute("data-" + lang);
    if (text) el.textContent = text;
  });
  document.querySelectorAll(".lang-switch button").forEach(b => b.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");
  document.documentElement.lang = lang;
  renderVisitors();
  renderAdminVisitors();
  renderMessages();
}

/* =================================================================
   2. TRAVEL TIPS
   ================================================================= */
const tips = {
  en: ["Bring a waterproof bag for your phone and camera.",
       "Wear shoes with good grip — the rocks are slippery.",
       "Go early in the morning to avoid heat and crowds.",
       "Respect local customs — it's a religious site.",
       "Carry a flashlight; some areas are very dark."],
  om: ["Bilbilaafi kaameraaf boorsaa bishaan hin dandeessisu fidi.",
       "Kophee qabannaa gaarii uffadhu — dhagaan mucucaawaa dha.",
       "Ganama ganama deemi, ho'aa fi namoota baay'ee darbi.",
       "Aadaa naannoo kabaji — iddoo amantii ti.",
       "Ibsaa harkaa fidi; iddoon tokko tokko baay'ee dukkanaa dha."],
  am: ["ለስልክዎና ካሜራዎ ውሃ የማያስገባ ቦርሳ ይያዙ።",
       "ጥሩ መያዣ ያለው ጫማ ይልበሱ — ድንጋዩ ይንሸራተታል።",
       "ሙቀትንና ሰዎችን ለማስወገድ ጠዋት ይሂዱ።",
       "የአካባቢውን ልማድ ያክብሩ — የእምነት ቦታ ነው።",
       "ሻማ ይያዙ፤ አንዳንድ ቦታዎች በጣም ጨለማ ናቸው።"]
};
document.getElementById("tipBtn").addEventListener("click", () => {
  const lang = document.documentElement.lang || "en";
  const arr = tips[lang] || tips.en;
  document.getElementById("tipText").textContent = arr[Math.floor(Math.random() * arr.length)];
});

/* =================================================================
   3. DARK MODE
   ================================================================= */
const themeBtn = document.getElementById("themeBtn");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

/* =================================================================
   4. GALLERY
   ================================================================= */
document.querySelectorAll(".gallery img").forEach(img => {
  img.addEventListener("click", () => window.open(img.src, "_blank"));
});

/* =================================================================
   5. VISITOR STORAGE (shared)
   ================================================================= */
const VISITOR_KEY = "sofOmarVisitors";
let visitors = JSON.parse(localStorage.getItem(VISITOR_KEY) || "[]");

function saveVisitors() {
  localStorage.setItem(VISITOR_KEY, JSON.stringify(visitors));
  renderVisitors();
  renderAdminVisitors();
}

/* Public add */
const visitorForm = document.getElementById("visitorForm");
if (visitorForm) {
  visitorForm.addEventListener("submit", e => {
    e.preventDefault();
    const name    = document.getElementById("visitorName").value.trim();
    const country = document.getElementById("visitorCountry").value;
    const date    = document.getElementById("visitorDate").value;
    if (!name || !date) return;
    visitors.push({ id: Date.now(), name, country, date });
    saveVisitors();
    visitorForm.reset();
  });
}

/* Public delete */
function deleteVisitor(id) {
  visitors = visitors.filter(v => v.id !== id);
  saveVisitors();
}

/* Public list render */
const visitorList = document.getElementById("visitorList");
function renderVisitors() {
  if (!visitorList) return;
  visitorList.innerHTML = "";
  if (visitors.length === 0) {
    visitorList.innerHTML = `<p style="opacity:.6">No visitors yet. Add one above.</p>`;
    return;
  }
  const grouped = {};
  visitors.forEach(v => (grouped[v.date] = grouped[v.date] || []).push(v));
  Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).forEach(date => {
    const g = document.createElement("div");
    g.className = "day-group";
    const nice = new Date(date).toLocaleDateString(undefined,
      { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    g.innerHTML = `<h4>📅 ${nice} — ${grouped[date].length} visitor(s)</h4>`;
    const ul = document.createElement("ul");
    grouped[date].forEach(v => {
      const li = document.createElement("li");
      li.innerHTML = `<span>👤 <strong>${escapeHtml(v.name)}</strong> — ${escapeHtml(v.country)}</span>`;
      const btn = document.createElement("button");
      btn.className = "delete-btn";
      btn.textContent = "✕";
      btn.onclick = () => deleteVisitor(v.id);
      li.appendChild(btn);
      ul.appendChild(li);
    });
    g.appendChild(ul);
    visitorList.appendChild(g);
  });
}

/* Public clear */
document.getElementById("clearVisitors")?.addEventListener("click", () => {
  if (confirm("Clear all visitors?")) {
    visitors = [];
    saveVisitors();
  }
});

/* =================================================================
   6. CONTACT FORM — store message locally as well
   ================================================================= */
const MSG_KEY = "sofOmarMessages";
let messages = JSON.parse(localStorage.getItem(MSG_KEY) || "[]");

const contactForm = document.querySelector('form[name="contact"]');
if (contactForm) {
  contactForm.addEventListener("submit", () => {
    // NOTE: this fires before Netlify posts.
    const name    = contactForm.querySelector('[name="name"]').value.trim();
    const email   = contactForm.querySelector('[name="email"]').value.trim();
    const message = contactForm.querySelector('[name="message"]').value.trim();
    messages.push({
      id: Date.now(),
      name, email, message,
      date: new Date().toISOString()
    });
    localStorage.setItem(MSG_KEY, JSON.stringify(messages));
  });
}

/* =================================================================
   7. ADMIN LOGIN
   ================================================================= */
const ADMIN_PASSWORD = "sofomar2026";  // ← change me
const loginBtn  = document.getElementById("loginBtn");
const loginMsg  = document.getElementById("loginMsg");
const adminLogin= document.getElementById("adminLogin");
const adminPanel= document.getElementById("adminPanel");

// Auto-login if session active
if (sessionStorage.getItem("adminLoggedIn") === "yes") {
  adminLogin.style.display = "none";
  adminPanel.style.display = "block";
}

loginBtn?.addEventListener("click", () => {
  const pass = document.getElementById("adminPass").value;
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminLoggedIn", "yes");
    adminLogin.style.display = "none";
    adminPanel.style.display = "block";
    loginMsg.textContent = "";
    renderMessages();
    renderAdminVisitors();
  } else {
    loginMsg.textContent = "❌ Wrong password.";
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  sessionStorage.removeItem("adminLoggedIn");
  adminPanel.style.display = "none";
  adminLogin.style.display = "block";
  document.getElementById("adminPass").value = "";
});

/* =================================================================
   8. ADMIN TABS
   ================================================================= */
document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
  });
});

/* =================================================================
   9. ADMIN — MESSAGES
   ================================================================= */
const messagesList = document.getElementById("messagesList");
function renderMessages() {
  if (!messagesList) return;
  messagesList.innerHTML = "";
  if (messages.length === 0) {
    messagesList.innerHTML = `<p style="opacity:.6">No messages yet.</p>`;
    return;
  }
  [...messages].reverse().forEach(m => {
    const card = document.createElement("div");
    card.className = "message-card";
    const nice = new Date(m.date).toLocaleString();
    card.innerHTML = `
      <span class="msg-date">📅 ${nice}</span>
      <strong>👤 ${escapeHtml(m.name)}</strong> — ✉️ ${escapeHtml(m.email)}
      <div class="msg-body">${escapeHtml(m.message)}</div>
    `;
    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "✕ Delete";
    del.style.marginTop = "8px";
    del.onclick = () => {
      messages = messages.filter(x => x.id !== m.id);
      localStorage.setItem(MSG_KEY, JSON.stringify(messages));
      renderMessages();
    };
    card.appendChild(del);
    messagesList.appendChild(card);
  });
}

document.getElementById("clearMessages")?.addEventListener("click", () => {
  if (confirm("Clear all messages?")) {
    messages = [];
    localStorage.setItem(MSG_KEY, JSON.stringify(messages));
    renderMessages();
  }
});

/* =================================================================
   10. ADMIN — VISITORS
   ================================================================= */
const adminVisitorList = document.getElementById("adminVisitorList");
const adminVisitorForm = document.getElementById("adminVisitorForm");

adminVisitorForm?.addEventListener("submit", e => {
  e.preventDefault();
  const name    = document.getElementById("adminName").value.trim();
  const country = document.getElementById("adminCountry").value;
  const date    = document.getElementById("adminDate").value;
  if (!name || !date) return;
  visitors.push({ id: Date.now(), name, country, date });
  saveVisitors();
  adminVisitorForm.reset();
});

function renderAdminVisitors() {
  if (!adminVisitorList) return;
  adminVisitorList.innerHTML = "";
  if (visitors.length === 0) {
    adminVisitorList.innerHTML = `<p style="opacity:.6">No visitors yet.</p>`;
    return;
  }
  const grouped = {};
  visitors.forEach(v => (grouped[v.date] = grouped[v.date] || []).push(v));
  Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).forEach(date => {
    const g = document.createElement("div");
    g.className = "day-group";
    const nice = new Date(date).toLocaleDateString();
    g.innerHTML = `<h4>📅 ${nice} (${grouped[date].length})</h4>`;
    const ul = document.createElement("ul");
    grouped[date].forEach(v => {
      const li = document.createElement("li");
      li.innerHTML = `<span>👤 <strong>${escapeHtml(v.name)}</strong> — ${escapeHtml(v.country)}</span>`;
      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "✕";
      del.onclick = () => deleteVisitor(v.id);
      li.appendChild(del);
      ul.appendChild(li);
    });
    g.appendChild(ul);
    adminVisitorList.appendChild(g);
  });
}

document.getElementById("clearAdminVisitors")?.addEventListener("click", () => {
  if (confirm("Clear all visitors?")) {
    visitors = [];
    saveVisitors();
  }
});

/* =================================================================
   11. EXPORT VISITORS TO CSV
   ================================================================= */
document.getElementById("exportCSV")?.addEventListener("click", () => {
  if (visitors.length === 0) return alert("No visitors to export.");
  const rows = [["Name","Country","Date"]];
  visitors.forEach(v => rows.push([v.name, v.country, v.date]));
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = "sof-omar-visitors.csv";
  a.click();
  URL.revokeObjectURL(url);
});

/* =================================================================
   12. HELPERS
   ================================================================= */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

/* =================================================================
   13. INITIAL RENDER
   ================================================================= */
renderVisitors();
renderAdminVisitors();
renderMessages();
/* =================================================================
   14. CUSTOMER LOG
   ================================================================= */
const CUST_KEY  = "sofOmarCustomers";
const VISIT_KEY = "sofOmarVisitLog";
const CUSTMSG_KEY = "sofOmarCustMessages";

let customers  = JSON.parse(localStorage.getItem(CUST_KEY)     || "[]");
let visitLog   = JSON.parse(localStorage.getItem(VISIT_KEY)    || "[]");
let custMessages = JSON.parse(localStorage.getItem(CUSTMSG_KEY) || "[]");

function saveCustomers() {
  localStorage.setItem(CUST_KEY, JSON.stringify(customers));
  renderCustomers();
  renderFirstVisitor();
}
function saveVisitLog() {
  localStorage.setItem(VISIT_KEY, JSON.stringify(visitLog));
  renderVisitLog();
}
function saveCustMessages() {
  localStorage.setItem(CUSTMSG_KEY, JSON.stringify(custMessages));
  renderCustomerMessages();
}

/* ---------- 1. FIRST VISITOR OF TODAY ---------- */
function todayISO() { return new Date().toISOString().slice(0,10); }

function getFirstVisitorToday() {
  const t = todayISO();
  const todayCust = customers.filter(c => c.date === t);
  if (todayCust.length === 0) return null;
  return todayCust.sort((a,b) => a.addedAt - b.addedAt)[0];
}

function renderFirstVisitor() {
  const box = document.getElementById("firstVisitor");
  if (!box) return;
  const first = getFirstVisitorToday();
  if (!first) {
    box.className = "first-visitor empty";
    box.textContent = "No customer yet today. Be the first! 🎉";
  } else {
    box.className = "first-visitor";
    box.innerHTML = `🥇 <strong>${escapeHtml(first.name)}</strong> was the first customer today — 
      📞 ${escapeHtml(first.phone || "N/A")} — 🎯 ${escapeHtml(first.purpose || "N/A")}`;
  }
}

/* ---------- 2. CUSTOMER FORM ---------- */
const customerForm = document.getElementById("customerForm");
customerForm?.addEventListener("submit", e => {
  e.preventDefault();
  const name    = document.getElementById("custName").value.trim();
  const phone   = document.getElementById("custPhone").value.trim();
  const purpose = document.getElementById("custPurpose").value.trim();
  const date    = document.getElementById("custDate").value;

  if (!name || !date) return;

  const customer = {
    id: Date.now(),
    name, phone, purpose, date,
    addedAt: Date.now()
  };
  customers.push(customer);
  saveCustomers();

  // Log who is visiting this customer (self-registered)
  logVisit(customer.id, name, "self-registered");

  customerForm.reset();
});

/* ---------- 3. CUSTOMER LIST ---------- */
function renderCustomers() {
  const box = document.getElementById("customerList");
  if (!box) return;
  box.innerHTML = "";

  if (customers.length === 0) {
    box.innerHTML = `<p style="opacity:.6">No customers yet.</p>`;
    return;
  }

  const first = getFirstVisitorToday();

  [...customers].reverse().forEach(c => {
    const div = document.createElement("div");
    div.className = "customer-card";

    const isFirst = first && first.id === c.id;
    div.innerHTML = `
      <h4>👤 ${escapeHtml(c.name)}
        ${isFirst ? '<span class="badge-first">🥇 FIRST TODAY</span>' : ''}
      </h4>
      <p>📞 ${escapeHtml(c.phone || "N/A")}</p>
      <p>🎯 ${escapeHtml(c.purpose || "N/A")}</p>
      <p>📅 ${escapeHtml(c.date)}</p>
      <div class="actions">
        <button class="btn-small send-msg-btn" data-id="${c.id}">📨 Send Message</button>
        <button class="btn-small visit-btn"    data-id="${c.id}">👀 Log Visitor</button>
        <button class="delete-btn delete-cust" data-id="${c.id}">✕ Delete</button>
      </div>
    `;
    box.appendChild(div);
  });

  // Wire buttons
  box.querySelectorAll(".send-msg-btn").forEach(b =>
    b.addEventListener("click", () => sendMessageToCustomer(+b.dataset.id)));
  box.querySelectorAll(".visit-btn").forEach(b =>
    b.addEventListener("click", () => promptLogVisit(+b.dataset.id)));
  box.querySelectorAll(".delete-cust").forEach(b =>
    b.addEventListener("click", () => deleteCustomer(+b.dataset.id)));
}

/* ---------- 4. MESSAGES RECEIVED FOR THE CUSTOMER ---------- */
function sendMessageToCustomer(custId) {
  const cust = customers.find(c => c.id === custId);
  if (!cust) return;
  const msg = prompt(`Message to send to ${cust.name}:`);
  if (!msg) return;

  custMessages.push({
    id: Date.now(),
    customerId: custId,
    customerName: cust.name,
    message: msg,
    from: "Admin",
    date: new Date().toISOString()
  });
  saveCustMessages();
  alert("✅ Message saved and received for " + cust.name);
}

function renderCustomerMessages() {
  const box = document.getElementById("customerMessages");
  if (!box) return;
  box.innerHTML = "";

  if (custMessages.length === 0) {
    box.innerHTML = `<p style="opacity:.6">No messages yet.</p>`;
    return;
  }
  
  <button class="btn-small send-msg-btn" data-id="${c.id}">📨 Send Message</button>
  

  [...custMessages].reverse().forEach(m => {
    const div = document.createElement("div");
    div.className = "cust-message";
    const nice = new Date(m.date).toLocaleString();
    div.innerHTML = `
      <strong>📨 To: ${escapeHtml(m.customerName)}</strong> — from ${escapeHtml(m.from)}
      <div>${escapeHtml(m.message)}</div>
      <small>📅 ${nice}</small>
    `;
    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "✕";
    del.style.marginTop = "6px";
    del.onclick = () => {
      custMessages = custMessages.filter(x => x.id !== m.id);
      saveCustMessages();
    };
    <button class="btn-small deposit-btn" data-id="${c.id}">💰 Deposit</button>
    div.appendChild(del);
    box.appendChild(div);
  });
  box.querySelectorAll(".deposit-btn").forEach(b =>
  b.addEventListener("click", () => depositForCustomer(+b.dataset.id)));
  <p>💰 Balance: <strong>${c.deposit || 0} ETB</strong></p>
}

/* ---------- 5. WHO VISITED THE CUSTOMER ---------- */
function promptLogVisit(custId) {
  const cust = customers.find(c => c.id === custId);
  if (!cust) return;
  const visitorName = prompt(`Who is visiting ${cust.name}?`);
  if (!visitorName) return;
  const note = prompt("Optional note:") || "";
  logVisit(custId, visitorName.trim(), note);
}

function logVisit(custId, visitorName, note = "") {
  const cust = customers.find(c => c.id === custId);
  visitLog.push({
    id: Date.now(),
    customerId: custId,
    customerName: cust ? cust.name : "Unknown",
    visitorName,
    note,
    time: new Date().toISOString()
  });
  saveVisitLog();
}

function renderVisitLog() {
  const box = document.getElementById("visitLog");
  if (!box) return;
  box.innerHTML = "";

  if (visitLog.length === 0) {
    box.innerHTML = `<p style="opacity:.6">No visits logged yet.</p>`;
    return;
  }

  [...visitLog].reverse().forEach(v => {
    const div = document.createElement("div");
    div.className = "visit-entry";
    const nice = new Date(v.time).toLocaleString();
    div.innerHTML = `
      👀 <strong>${escapeHtml(v.visitorName)}</strong> visited 
      👤 <strong>${escapeHtml(v.customerName)}</strong>
      ${v.note ? ` — <em>${escapeHtml(v.note)}</em>` : ""}
      <small style="display:block;opacity:.7;margin-top:4px;">📅 ${nice}</small>
    `;
    box.appendChild(div);
  });
}

/* ---------- 6. DELETE CUSTOMER ---------- */
function deleteCustomer(id) {
  if (!confirm("Delete this customer and their log?")) return;
  customers    = customers.filter(c => c.id !== id);
  visitLog     = visitLog.filter(v => v.customerId !== id);
  custMessages = custMessages.filter(m => m.customerId !== id);
  saveCustomers();
  saveVisitLog();
  saveCustMessages();
}

/* ---------- 7. INITIAL RENDER ---------- */
renderCustomers();
renderFirstVisitor();
renderCustomerMessages();
renderVisitLog();
/* =================================================================
   15. TELEBIRR DEPOSIT (via Chapa)
   ================================================================= */
const CHAPA_PUBLIC_KEY = "CHAPA_PUBLIC_KEY_HERE"; // ← get from chapa.co

function initChapa(amount, customerName) {
  const chapa = new ChapaCheckout({
    publicKey: CHAPA_PUBLIC_KEY,
    amount: String(amount),
    currency: "ETB",
    availablePaymentMethods: ["telebirr"], // only Telebirr
    customizations: {
      buttonText: "Pay with Telebirr",
      successMessage: "✅ Payment received!"
    },
    callbackUrl: "https://yourdomain.com/callback",
    returnUrl: "https://yourdomain.com/success",
    onSuccessfulPayment: (response) => {
      // Save the deposit to the customer's record
      const custId = +localStorage.getItem("currentDepositCustId");
      const cust = customers.find(c => c.id === custId);
      if (cust) {
        cust.deposit = (cust.deposit || 0) + amount;
        cust.lastPayment = new Date().toISOString();
        saveCustomers();
        alert(`✅ ${amount} ETB deposited for ${cust.name}`);
      }
    },
    onPaymentFailure: (err) => {
      alert("❌ Payment failed: " + (err.message || "Unknown error"));
    }
  });

  chapa.initialize("chapa-inline-form");
}

/* Add a "Deposit" button to each customer card */
function depositForCustomer(custId) {
  const cust = customers.find(c => c.id === custId);
  if (!cust) return;
  const amount = prompt(`Amount to deposit for ${cust.name} (ETB):`);
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  localStorage.setItem("currentDepositCustId", custId);
  initChapa(Number(amount), cust.name);
}