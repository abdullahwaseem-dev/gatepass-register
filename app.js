// ============================================================================
// Registration app logic.
// Runs against real Firebase + EmailJS once config.js is filled in; until then
// it transparently falls back to browser localStorage and skips real email
// sending (clearly labeled), so the form always works end-to-end.
// ============================================================================

const cfg = window.APP_CONFIG;

let db = null;
let fs = null; // firestore module functions, once loaded

// Same category colours as the kiosk (KioskColors) and style.css.
const catColors = { VIP: "#b7791f", Visitors: "#0e8a9a", Sponsors: "#6d4fc2" };

// Category values stored in Firestore stay canonical English ("VIP" etc.) so
// they match firestore.rules and the kiosk app regardless of display
// language — only the label shown to the visitor is translated.
const catKeys = { VIP: "vip", Visitors: "visitors", Sponsors: "sponsors" };
function categoryLabel(category) {
  return t(catKeys[category] || "visitors");
}
function categoryLabelAr(category) {
  return (window.I18N.ar && window.I18N.ar[catKeys[category]]) || category;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function initFirebase() {
  if (!cfg.isLive) return;
  try {
    const [{ initializeApp }, fsMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
    ]);
    const app = initializeApp(cfg.firebase);
    db = fsMod.getFirestore(app);
    fs = fsMod;
    console.info("[app] Firebase connected:", cfg.firebase.projectId);
  } catch (e) {
    console.error("[app] Firebase init failed — falling back to local demo mode.", e);
    db = null;
    fs = null;
  }
}

function initEmail() {
  if (cfg.emailIsLive && window.emailjs) {
    // The @3 CDN build uses the old positional signature: init(publicKey).
    // The newer init({ publicKey }) object form is a v4 API and silently
    // sends the whole object as the key on this version, which is what
    // caused "Public Key is invalid" even with a correct key.
    emailjs.init(cfg.emailjs.publicKey.trim());
  }
}

function applyBranding() {
  document.getElementById("orgName").textContent = cfg.orgName();
  document.title = `${cfg.eventNameText()} — Registration`;
}

function updateModeIndicators() {
  const isFullyLive = cfg.isLive && db;
  document.getElementById("demoBanner").hidden = isFullyLive;
  document.getElementById("footerMode").textContent = isFullyLive
    ? `${t("footerLive")} "${cfg.firebase.projectId}" · ${cfg.emailIsLive ? t("footerEmailLive") : t("footerEmailOff")}`
    : t("footerDemo");
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

async function saveRegistration(regId, data) {
  if (db && fs) {
    const ref = fs.doc(db, "registrations", regId);
    await fs.setDoc(ref, data);
    return;
  }
  const all = JSON.parse(localStorage.getItem("registrations") || "{}");
  all[regId] = data;
  localStorage.setItem("registrations", JSON.stringify(all));
}

async function updateRegistration(regId, patch) {
  if (db && fs) {
    const ref = fs.doc(db, "registrations", regId);
    await fs.updateDoc(ref, patch);
    return;
  }
  const all = JSON.parse(localStorage.getItem("registrations") || "{}");
  if (all[regId]) {
    Object.assign(all[regId], patch);
    localStorage.setItem("registrations", JSON.stringify(all));
  }
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

async function sendConfirmationEmail(data, regId) {
  if (!cfg.emailIsLive || !window.emailjs) {
    return { sent: false, reason: "not-configured" };
  }
  try {
    await emailjs.send(cfg.emailjs.serviceId.trim(), cfg.emailjs.templateId.trim(), {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company || "—",
      category: data.category,
      reg_id: regId,
      qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(regId)}`,
      event_name: cfg.org.eventName.en,
      org_name: cfg.org.name.en,
      event_name_ar: cfg.org.eventName.ar,
      org_name_ar: cfg.org.name.ar,
      category_ar: categoryLabelAr(data.category),
    });
    return { sent: true };
  } catch (e) {
    console.error("[app] EmailJS send failed", e);
    return { sent: false, reason: (e && e.text) || (e && e.message) || "unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Registration ID
// ---------------------------------------------------------------------------

function genRegId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EVT-${ts}-${rand}`;
}

// ---------------------------------------------------------------------------
// Form validation
// ---------------------------------------------------------------------------

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^\+?[0-9\s-]{7,16}$/;

function setError(field, message) {
  const el = document.getElementById(`err-${field}`);
  const input = document.getElementById(field);
  if (el) el.textContent = message || "";
  if (input) input.classList.toggle("invalid", !!message);
}

function validateForm(data, selectedCategory) {
  let ok = true;
  if (!data.name.trim()) { setError("name", t("nameRequired")); ok = false; } else setError("name", "");

  if (!data.phone.trim()) { setError("phone", t("phoneRequired")); ok = false; }
  else if (!phoneRe.test(data.phone.trim())) { setError("phone", t("phoneInvalid")); ok = false; }
  else setError("phone", "");

  setError("company", "");

  if (!data.email.trim()) { setError("email", t("emailRequired")); ok = false; }
  else if (!emailRe.test(data.email.trim())) { setError("email", t("emailInvalid")); ok = false; }
  else setError("email", "");

  const catErr = document.getElementById("err-category");
  if (!selectedCategory) { catErr.textContent = t("categoryRequired"); ok = false; }
  else catErr.textContent = "";

  return ok;
}

// ---------------------------------------------------------------------------
// QR + badge rendering
// ---------------------------------------------------------------------------

function renderQrCode(regId) {
  const holder = document.getElementById("qrcode");
  holder.innerHTML = "";
  // eslint-disable-next-line no-undef
  new QRCode(holder, {
    text: regId,
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });
  // qrcodejs renders to <canvas> in modern browsers, but falls back to an
  // <img> in some environments — drawImage() accepts either.
  return holder.querySelector("canvas, img");
}

function buildBadgeCanvas(qrCanvas, data, regId) {
  const w = 480, h = 700;
  const isAr = window.currentLang === "ar";
  const font = isAr ? "Tajawal, Arial" : "Arial";
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  // Canvas text direction — supported in current Chrome/Edge/Firefox, shapes
  // Arabic glyphs correctly instead of rendering isolated letterforms.
  ctx.direction = isAr ? "rtl" : "ltr";

  // ATC light theme (see style.css): white card, logo blue/charcoal.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const catColor = catColors[data.category] || "#0e8a9a";
  ctx.strokeStyle = catColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Logo is preloaded in boot() — skipped if it failed to load.
  const logoH = 40;
  if (logoImg && logoImg.complete && logoImg.naturalWidth) {
    const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
    ctx.drawImage(logoImg, (w - logoW) / 2, 26, logoW, logoH);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = catColor;
  ctx.font = `bold 18px ${font}`;
  ctx.fillText(categoryLabel(data.category).toUpperCase(), w / 2, 92);

  ctx.fillStyle = "#353535";
  ctx.font = `bold 20px ${font}`;
  ctx.fillText(cfg.eventNameText() || "Event Registration", w / 2, 118);

  const qrSize = 290;
  const qrX = (w - qrSize) / 2;
  const qrY = 140;
  ctx.strokeStyle = "#4161ac";
  ctx.lineWidth = 3;
  ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
  if (qrCanvas) ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Detail lines anchor to whichever side reads "first" in the current
  // language — right edge for Arabic, left edge for English — so the QR
  // code and text block keep a natural reading order either way.
  const anchorX = isAr ? w - 40 : 40;
  ctx.textAlign = isAr ? "right" : "left";
  ctx.fillStyle = "#353535";
  ctx.font = `bold 22px ${font}`;
  ctx.fillText(data.name, anchorX, qrY + qrSize + 55);

  ctx.font = `14px ${font}`;
  ctx.fillStyle = "#6b7280";
  let y = qrY + qrSize + 85;
  const lines = [
    data.company ? `${t("company")}: ${data.company}` : null,
    `${t("email")}: ${data.email}`,
    `${t("phone")}: ${data.phone}`,
    `${t("id") || "ID"}: ${regId}`,
  ].filter(Boolean);
  lines.forEach((line) => {
    ctx.fillText(line, anchorX, y);
    y += 24;
  });

  return canvas;
}

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------

let selectedCategory = null;
let logoImg = null;
let currentBadgeCanvas = null;
let currentRegId = null;

function initCategoryPicker() {
  document.querySelectorAll(".category-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-card").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedCategory = btn.dataset.category;
      document.getElementById("err-category").textContent = "";
    });
  });
}

function setSummary(data, regId) {
  const summary = document.getElementById("summaryCard");
  summary.innerHTML = `
    <div class="summary-row"><span class="k">${t("name")}</span><span class="v">${escapeHtml(data.name)}</span></div>
    <div class="summary-row"><span class="k">${t("company")}</span><span class="v">${escapeHtml(data.company || "—")}</span></div>
    <div class="summary-row"><span class="k">${t("email")}</span><span class="v">${escapeHtml(data.email)}</span></div>
    <div class="summary-row"><span class="k">${t("phone")}</span><span class="v">${escapeHtml(data.phone)}</span></div>
    <div class="summary-row"><span class="k">${t("category")}</span><span class="v"><span class="badge ${data.category}">${escapeHtml(categoryLabel(data.category))}</span></span></div>
  `;
  document.getElementById("regIdLabel").textContent = regId;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function resetForm() {
  document.getElementById("regForm").reset();
  document.querySelectorAll(".category-card").forEach((b) => b.classList.remove("selected"));
  selectedCategory = null;
  ["name", "phone", "company", "email"].forEach((f) => setError(f, ""));
  document.getElementById("err-category").textContent = "";
}

async function handleSubmit(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    company: document.getElementById("company").value,
    email: document.getElementById("email").value,
    category: selectedCategory,
  };

  if (!validateForm(data, selectedCategory)) return;

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-label").textContent = t("registering");
  submitBtn.querySelector(".btn-spinner").hidden = false;

  const regId = genRegId();
  currentRegId = regId;

  const record = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    company: data.company.trim(),
    email: data.email.trim(),
    category: data.category,
    entryType: "online",
    checkedIn: false,
    checkInTime: null,
    wristbandPrinted: false,
    emailSent: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveRegistration(regId, record);
  } catch (err) {
    console.error("[app] Failed to save registration", err);
    alert(t("registrationFailed"));
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-label").textContent = t("completeRegistration");
    submitBtn.querySelector(".btn-spinner").hidden = true;
    return;
  }

  document.getElementById("registerView").hidden = true;
  const successView = document.getElementById("successView");
  successView.hidden = false;

  const qrCanvas = renderQrCode(regId);
  setSummary(record, regId);
  // Wait for the Arabic webfont to finish loading before drawing to canvas —
  // unlike DOM text, canvas fillText() doesn't wait for web fonts on its
  // own, so drawing too early silently and permanently falls back to the
  // default font for this canvas.
  await document.fonts.ready;
  currentBadgeCanvas = buildBadgeCanvas(qrCanvas, record, regId);

  const emailStatusEl = document.getElementById("emailStatus");
  if (cfg.emailIsLive) {
    emailStatusEl.textContent = t("sendingEmail");
    emailStatusEl.className = "email-status";
    const result = await sendConfirmationEmail(record, regId);
    if (result.sent) {
      emailStatusEl.textContent = `${t("emailSent")} ${record.email}`;
      emailStatusEl.className = "email-status ok";
      await updateRegistration(regId, { emailSent: true });
    } else {
      emailStatusEl.textContent = `${t("emailFailed")} (${result.reason}) — ${t("saveQrNow")}`;
      emailStatusEl.className = "email-status err";
    }
  } else {
    emailStatusEl.textContent = t("emailNotConfigured");
    emailStatusEl.className = "email-status warn";
  }

  submitBtn.disabled = false;
  submitBtn.querySelector(".btn-label").textContent = t("completeRegistration");
  submitBtn.querySelector(".btn-spinner").hidden = true;
}

function downloadPng() {
  if (!currentBadgeCanvas) return;
  const link = document.createElement("a");
  link.download = `registration-${currentRegId}.png`;
  link.href = currentBadgeCanvas.toDataURL("image/png");
  link.click();
}

function downloadPdf() {
  if (!currentBadgeCanvas || !window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "px", format: [currentBadgeCanvas.width, currentBadgeCanvas.height] });
  pdf.addImage(currentBadgeCanvas.toDataURL("image/png"), "PNG", 0, 0, currentBadgeCanvas.width, currentBadgeCanvas.height);
  pdf.save(`registration-${currentRegId}.pdf`);
}

function registerAnother() {
  resetForm();
  document.getElementById("successView").hidden = true;
  document.getElementById("registerView").hidden = false;
  currentBadgeCanvas = null;
  currentRegId = null;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  logoImg = new Image();
  logoImg.src = "assets/app_logo.png";
  applyBranding();
  initCategoryPicker();
  document.getElementById("regForm").addEventListener("submit", handleSubmit);
  document.getElementById("downloadPngBtn").addEventListener("click", downloadPng);
  document.getElementById("downloadPdfBtn").addEventListener("click", downloadPdf);
  document.getElementById("registerAnotherBtn").addEventListener("click", registerAnother);
  // Org name and the "connected/demo mode" footer wording aren't covered by
  // i18n.js's data-i18n sweep (they're computed, not static markup) — redo
  // them whenever the visitor switches language.
  document.addEventListener("langchange", () => {
    applyBranding();
    updateModeIndicators();
  });

  await initFirebase();
  initEmail();
  updateModeIndicators();
}

boot();
