// ============================================================
// MAA MANOKAMANA TEMPLE - APP.JS
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// ============================================================
// FIREBASE
// ============================================================

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);


// ============================================================
// GLOBAL SETTINGS
// ============================================================

let templeSettings = {
  upiId: "",
  aartiTime: "",
  liveUrl: "",
  qrUrl: "",
  contactNumber: ""
};

let deferredInstallPrompt = null;
let installButton = null;


// ============================================================
// BASIC HELPERS
// ============================================================

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "success") {
  let toast = document.getElementById("appToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:24px;
      transform:translateX(-50%) translateY(20px);
      z-index:99999;
      max-width:calc(100vw - 32px);
      padding:13px 18px;
      border-radius:14px;
      background:#111827;
      color:#fff;
      font-size:14px;
      font-weight:700;
      line-height:1.4;
      box-shadow:0 15px 40px rgba(0,0,0,.25);
      opacity:0;
      pointer-events:none;
      transition:.3s ease;
      text-align:center;
    `;

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  if (type === "error") {
    toast.style.background = "#991b1b";
  } else {
    toast.style.background = "#166534";
  }

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, 3200);
}


// ============================================================
// MOBILE MENU
// ============================================================

function initMobileMenu() {
  const menuBtn =
    document.querySelector("#menuBtn") ||
    document.querySelector(".menu-toggle") ||
    document.querySelector("[data-menu-toggle]");

  const nav =
    document.querySelector("#mainNav") ||
    document.querySelector(".main-nav") ||
    document.querySelector("nav");

  if (!menuBtn || !nav) return;

  menuBtn.addEventListener("click", () => {
    nav.classList.toggle("active");
    menuBtn.classList.toggle("active");
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      menuBtn.classList.remove("active");
    });
  });
}


// ============================================================
// DONATION MODAL
// ============================================================

function getDonationModal() {
  return (
    document.getElementById("donationModal") ||
    document.querySelector(".donation-modal")
  );
}

function openDonationModal() {
  const modal = getDonationModal();

  if (!modal) {
    showToast("Donation section उपलब्ध नहीं है।", "error");
    return;
  }

  modal.style.display = "flex";
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  updateDonationUPI();
  renderDonationQR();
}

function closeDonationModal() {
  const modal = getDonationModal();

  if (!modal) return;

  modal.classList.remove("active");
  modal.style.display = "none";
  document.body.style.overflow = "";
}

function initDonationModal() {
  const openButtons = document.querySelectorAll(
    "#donateBtn, [data-donate], .donate-btn"
  );

  openButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      openDonationModal();
    });
  });

  const closeButtons = document.querySelectorAll(
    "#closeDonationModal, .close-donation-modal, [data-close-donation]"
  );

  closeButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      closeDonationModal();
    });
  });

  const modal = getDonationModal();

  if (modal) {
    modal.addEventListener("click", event => {
      if (
        event.target === modal ||
        event.target.classList.contains("donation-modal-overlay")
      ) {
        closeDonationModal();
      }
    });
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeDonationModal();
      closeDonationReceipt();
    }
  });
}


// ============================================================
// UPI
// ============================================================

function updateDonationUPI() {
  const upiElements = document.querySelectorAll(
    "#donationUPI, [data-upi-id], .donation-upi"
  );

  upiElements.forEach(element => {
    if (templeSettings.upiId) {
      element.textContent = templeSettings.upiId;
    }
  });
}


// ============================================================
// QR CODE
// ============================================================

function renderDonationQR() {
  const qrContainers = document.querySelectorAll(
    "#donationQR, [data-donation-qr], .donation-qr"
  );

  qrContainers.forEach(container => {
    container.innerHTML = "";

    if (!templeSettings.qrUrl) {
      container.innerHTML = `
        <div style="
          padding:20px;
          border-radius:14px;
          background:#f8fafc;
          color:#64748b;
          font-size:13px;
          text-align:center;
        ">
          QR Code जल्द अपडेट होगा।
        </div>
      `;
      return;
    }

    const img = document.createElement("img");

    img.src = templeSettings.qrUrl;
    img.alt = "Donation QR Code";
    img.loading = "lazy";

    img.style.cssText = `
      width:min(260px,100%);
      height:auto;
      display:block;
      margin:auto;
      border-radius:16px;
      background:#fff;
      padding:10px;
      box-shadow:0 8px 30px rgba(0,0,0,.10);
    `;

    img.onerror = () => {
      container.innerHTML = `
        <div style="
          padding:20px;
          border-radius:14px;
          background:#fef2f2;
          color:#991b1b;
          font-size:13px;
          text-align:center;
        ">
          QR Code load नहीं हो पाया।
        </div>
      `;
    };

    container.appendChild(img);
  });
}


// ============================================================
// RECEIPT NUMBER
// ============================================================

function generateReceiptNumber() {
  const now = new Date();

  const year = now.getFullYear();

  const timestampPart = String(Date.now()).slice(-7);

  const randomPart = Math.floor(100 + Math.random() * 900);

  return `DPG-${year}-${timestampPart}${randomPart}`;
}


// ============================================================
// RECEIPT DATE
// ============================================================

function formatReceiptDate(dateValue) {
  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(dateValue || Date.now());

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}


// ============================================================
// RECEIPT STYLES
// ============================================================

function injectReceiptStyles() {
  if (document.getElementById("donationReceiptStyles")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "donationReceiptStyles";

  style.textContent = `
    .donation-receipt-overlay {
      position:fixed;
      inset:0;
      z-index:100000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
      background:rgba(15,23,42,.72);
      backdrop-filter:blur(8px);
      overflow:auto;
    }

    .donation-receipt-card {
      width:min(560px,100%);
      max-height:calc(100vh - 36px);
      overflow:auto;
      background:#fff;
      color:#1f2937;
      border-radius:22px;
      box-shadow:0 30px 80px rgba(0,0,0,.30);
      animation:receiptCardIn .3s ease both;
    }

    @keyframes receiptCardIn {
      from {
        opacity:0;
        transform:translateY(20px) scale(.97);
      }
      to {
        opacity:1;
        transform:translateY(0) scale(1);
      }
    }

    .receipt-top {
      background:linear-gradient(135deg,#7f1111,#991b1b);
      color:#fff;
      padding:28px 24px 24px;
      text-align:center;
      position:relative;
    }

    .receipt-top::after {
      content:"";
      position:absolute;
      left:0;
      right:0;
      bottom:-8px;
      height:16px;
      background:
        radial-gradient(circle at 10px 0, transparent 9px, #fff 10px)
        repeat-x;
      background-size:20px 16px;
    }

    .receipt-logo {
      width:72px;
      height:72px;
      object-fit:cover;
      border-radius:50%;
      background:#fff;
      padding:4px;
      margin:0 auto 12px;
      display:block;
      box-shadow:0 8px 20px rgba(0,0,0,.20);
    }

    .receipt-title {
      font-size:22px;
      font-weight:900;
      margin:0 0 4px;
    }

    .receipt-subtitle {
      font-size:13px;
      opacity:.92;
      margin:0;
      line-height:1.5;
    }

    .receipt-address {
      font-size:11px;
      opacity:.82;
      margin-top:7px;
    }

    .receipt-status {
      display:inline-flex;
      align-items:center;
      gap:7px;
      margin-top:17px;
      padding:8px 14px;
      border-radius:999px;
      background:rgba(255,255,255,.15);
      border:1px solid rgba(255,255,255,.25);
      font-size:12px;
      font-weight:800;
    }

    .receipt-body {
      padding:28px 24px 24px;
    }

    .receipt-event {
      text-align:center;
      margin-bottom:20px;
    }

    .receipt-event strong {
      display:block;
      font-size:17px;
      color:#7f1111;
    }

    .receipt-event span {
      display:block;
      font-size:12px;
      color:#64748b;
      margin-top:4px;
    }

    .receipt-info {
      border:1px solid #e5e7eb;
      border-radius:16px;
      overflow:hidden;
    }

    .receipt-row {
      display:flex;
      justify-content:space-between;
      gap:16px;
      padding:12px 14px;
      border-bottom:1px solid #eef2f7;
      font-size:13px;
    }

    .receipt-row:last-child {
      border-bottom:0;
    }

    .receipt-label {
      color:#64748b;
      font-weight:600;
    }

    .receipt-value {
      color:#111827;
      font-weight:800;
      text-align:right;
      word-break:break-word;
    }

    .receipt-amount {
      margin:18px 0;
      padding:18px;
      border-radius:16px;
      background:#fff7ed;
      border:1px solid #fed7aa;
      text-align:center;
    }

    .receipt-amount-label {
      font-size:11px;
      color:#9a3412;
      font-weight:800;
      text-transform:uppercase;
      letter-spacing:.5px;
    }

    .receipt-amount-value {
      font-size:30px;
      line-height:1.1;
      font-weight:950;
      color:#9a3412;
      margin-top:5px;
    }

    .receipt-note {
      margin-top:18px;
      padding:14px;
      border-radius:14px;
      background:#f8fafc;
      color:#475569;
      font-size:11px;
      line-height:1.65;
      text-align:center;
    }

    .receipt-footer {
      margin-top:18px;
      text-align:center;
      color:#94a3b8;
      font-size:10px;
      line-height:1.5;
    }

    .receipt-actions {
      display:flex;
      gap:10px;
      padding:0 24px 24px;
    }

    .receipt-action-btn {
      flex:1;
      min-height:46px;
      border:0;
      border-radius:12px;
      cursor:pointer;
      font-size:13px;
      font-weight:800;
      transition:.2s ease;
    }

    .receipt-action-btn:hover {
      transform:translateY(-1px);
    }

    .receipt-print-btn {
      background:#7f1111;
      color:#fff;
    }

    .receipt-close-btn {
      background:#f1f5f9;
      color:#334155;
    }

    @media(max-width:520px) {
      .donation-receipt-overlay {
        padding:10px;
        align-items:flex-start;
      }

      .donation-receipt-card {
        margin-top:10px;
        border-radius:18px;
        max-height:calc(100vh - 20px);
      }

      .receipt-top {
        padding:22px 16px 20px;
      }

      .receipt-body {
        padding:24px 16px 18px;
      }

      .receipt-actions {
        padding:0 16px 16px;
        flex-direction:column;
      }

      .receipt-row {
        padding:11px 12px;
        font-size:12px;
      }

      .receipt-title {
        font-size:19px;
      }

      .receipt-amount-value {
        font-size:27px;
      }
    }

    @media print {
      .donation-receipt-overlay {
        position:static;
        background:#fff;
        padding:0;
        display:block;
      }

      .donation-receipt-card {
        width:100%;
        max-height:none;
        overflow:visible;
        box-shadow:none;
        border-radius:0;
      }

      .receipt-actions {
        display:none !important;
      }
    }
  `;

  document.head.appendChild(style);
}


// ============================================================
// RECEIPT ESCAPE
// ============================================================

function receiptEscape(value) {
  return escapeHtml(value);
}


// ============================================================
// SHOW DONATION RECEIPT
// ============================================================

function showDonationReceipt(data) {
  injectReceiptStyles();

  closeDonationReceipt();

  const overlay = document.createElement("div");

  overlay.className = "donation-receipt-overlay";
  overlay.id = "donationReceiptModal";

  const logoSrc =
    document.querySelector('link[rel="icon"]')?.href ||
    "./logo.png";

  const templeName =
    "श्री श्री १०८ माँ मनोकामना छोटी दुर्गा पूजा समिति";

  const address =
    "चकशिवगंज, मौलानगर, सूर्यगढ़ा (लखीसराय)";

  const currentYear = new Date().getFullYear();

  overlay.innerHTML = `
    <div class="donation-receipt-card" role="dialog" aria-modal="true">

      <div class="receipt-top">

        <img
          class="receipt-logo"
          src="${receiptEscape(logoSrc)}"
          alt="Temple Logo"
          onerror="this.style.display='none';"
        >

        <h2 class="receipt-title">
          ${receiptEscape(templeName)}
        </h2>

        <p class="receipt-subtitle">
          Donation Acknowledgement
        </p>

        <div class="receipt-address">
          ${receiptEscape(address)}
        </div>

        <div class="receipt-status">
          ✓ Donation Submitted
        </div>

      </div>


      <div class="receipt-body">

        <div class="receipt-event">
          <strong>दुर्गा पूजा ${currentYear}</strong>
          <span>Donation Receipt / Acknowledgement</span>
        </div>


        <div class="receipt-amount">

          <div class="receipt-amount-label">
            Donation Amount
          </div>

          <div class="receipt-amount-value">
            ₹${receiptEscape(
              Number(data.amount || 0).toLocaleString("en-IN")
            )}
          </div>

        </div>


        <div class="receipt-info">

          <div class="receipt-row">
            <span class="receipt-label">
              Receipt No.
            </span>

            <span class="receipt-value">
              ${receiptEscape(data.receiptNumber)}
            </span>
          </div>


          <div class="receipt-row">
            <span class="receipt-label">
              Donor Name
            </span>

            <span class="receipt-value">
              ${receiptEscape(data.donorName)}
            </span>
          </div>


          <div class="receipt-row">
            <span class="receipt-label">
              Purpose
            </span>

            <span class="receipt-value">
              ${receiptEscape(data.purpose || "General Donation")}
            </span>
          </div>


          <div class="receipt-row">
            <span class="receipt-label">
              UTR / Transaction ID
            </span>

            <span class="receipt-value">
              ${receiptEscape(data.utr)}
            </span>
          </div>


          <div class="receipt-row">
            <span class="receipt-label">
              Date & Time
            </span>

            <span class="receipt-value">
              ${receiptEscape(data.dateTime)}
            </span>
          </div>


          <div class="receipt-row">
            <span class="receipt-label">
              Status
            </span>

            <span class="receipt-value">
              Pending Verification
            </span>
          </div>

        </div>


        <div class="receipt-note">
          धन्यवाद! आपकी donation details सफलतापूर्वक submit हो गई हैं।
          यह acknowledgement है। UTR / transaction की final verification
          समिति द्वारा की जाएगी।
        </div>


        <div class="receipt-footer">
          ${receiptEscape(templeName)}<br>
          Digital Donation Receipt • ${currentYear}
        </div>

      </div>


      <div class="receipt-actions">

        <button
          type="button"
          class="receipt-action-btn receipt-print-btn"
          id="printDonationReceiptBtn"
        >
          🖨️ Print / Save PDF
        </button>

        <button
          type="button"
          class="receipt-action-btn receipt-close-btn"
          id="closeDonationReceiptBtn"
        >
          बंद करें
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";


  const printButton =
    document.getElementById("printDonationReceiptBtn");

  if (printButton) {
    printButton.addEventListener("click", () => {
      printDonationReceipt(data);
    });
  }


  const closeButton =
    document.getElementById("closeDonationReceiptBtn");

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeDonationReceipt();
    });
  }


  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeDonationReceipt();
    }
  });
}


// ============================================================
// CLOSE RECEIPT
// ============================================================

function closeDonationReceipt() {
  const modal =
    document.getElementById("donationReceiptModal");

  if (modal) {
    modal.remove();
  }

  document.body.style.overflow = "";
}


// ============================================================
// PRINT / SAVE PDF
// ============================================================

function printDonationReceipt(data) {
  const printWindow = window.open(
    "",
    "_blank",
    "width=800,height=900"
  );

  if (!printWindow) {
    showToast(
      "Print window blocked है। Browser में pop-up allow करें।",
      "error"
    );
    return;
  }

  const logoSrc =
    document.querySelector('link[rel="icon"]')?.href ||
    "./logo.png";

  const currentYear = new Date().getFullYear();

  const templeName =
    "श्री श्री १०८ माँ मनोकामना छोटी दुर्गा पूजा समिति";

  const address =
    "चकशिवगंज, मौलानगर, सूर्यगढ़ा (लखीसराय)";


  printWindow.document.open();

  printWindow.document.write(`
<!DOCTYPE html>

<html lang="hi">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>
Donation Receipt - ${receiptEscape(data.receiptNumber)}
</title>

<style>

* {
  box-sizing:border-box;
}

body {
  margin:0;
  padding:25px;
  background:#f1f5f9;
  font-family:
    Arial,
    "Noto Sans Devanagari",
    sans-serif;
  color:#1f2937;
}

.receipt {
  width:100%;
  max-width:650px;
  margin:0 auto;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:18px;
  overflow:hidden;
}

.header {
  text-align:center;
  background:#7f1111;
  color:#fff;
  padding:28px 20px;
}

.logo {
  width:76px;
  height:76px;
  object-fit:cover;
  border-radius:50%;
  background:#fff;
  padding:4px;
  margin-bottom:12px;
}

h1 {
  margin:0;
  font-size:22px;
}

.subtitle {
  margin:7px 0 0;
  font-size:13px;
}

.address {
  margin-top:6px;
  font-size:11px;
  opacity:.9;
}

.event {
  text-align:center;
  padding:22px 20px 8px;
}

.event strong {
  display:block;
  color:#7f1111;
  font-size:18px;
}

.event span {
  color:#64748b;
  font-size:12px;
}

.amount {
  margin:18px 25px;
  padding:18px;
  background:#fff7ed;
  border:1px solid #fed7aa;
  border-radius:14px;
  text-align:center;
}

.amount-label {
  color:#9a3412;
  font-size:11px;
  font-weight:bold;
}

.amount-value {
  color:#9a3412;
  font-size:32px;
  font-weight:900;
  margin-top:4px;
}

.info {
  margin:20px 25px;
  border:1px solid #e5e7eb;
  border-radius:14px;
  overflow:hidden;
}

.row {
  display:flex;
  justify-content:space-between;
  gap:20px;
  padding:12px 14px;
  border-bottom:1px solid #eef2f7;
  font-size:13px;
}

.row:last-child {
  border-bottom:0;
}

.label {
  color:#64748b;
  font-weight:bold;
}

.value {
  text-align:right;
  font-weight:bold;
  word-break:break-word;
}

.note {
  margin:20px 25px;
  padding:14px;
  background:#f8fafc;
  border-radius:12px;
  color:#475569;
  font-size:11px;
  line-height:1.6;
  text-align:center;
}

.footer {
  padding:0 25px 25px;
  text-align:center;
  color:#94a3b8;
  font-size:10px;
  line-height:1.5;
}

@media print {

  body {
    padding:0;
    background:#fff;
  }

  .receipt {
    border:0;
    border-radius:0;
    max-width:none;
  }

}

</style>

</head>


<body>

<div class="receipt">

  <div class="header">

    <img
      class="logo"
      src="${receiptEscape(logoSrc)}"
      alt="Temple Logo"
      onerror="this.style.display='none';"
    >

    <h1>
      ${receiptEscape(templeName)}
    </h1>

    <div class="subtitle">
      Donation Acknowledgement
    </div>

    <div class="address">
      ${receiptEscape(address)}
    </div>

  </div>


  <div class="event">

    <strong>
      दुर्गा पूजा ${currentYear}
    </strong>

    <span>
      Donation Receipt / Acknowledgement
    </span>

  </div>


  <div class="amount">

    <div class="amount-label">
      DONATION AMOUNT
    </div>

    <div class="amount-value">
      ₹${receiptEscape(
        Number(data.amount || 0).toLocaleString("en-IN")
      )}
    </div>

  </div>


  <div class="info">

    <div class="row">
      <span class="label">Receipt No.</span>
      <span class="value">
        ${receiptEscape(data.receiptNumber)}
      </span>
    </div>


    <div class="row">
      <span class="label">Donor Name</span>
      <span class="value">
        ${receiptEscape(data.donorName)}
      </span>
    </div>


    <div class="row">
      <span class="label">Purpose</span>
      <span class="value">
        ${receiptEscape(data.purpose || "General Donation")}
      </span>
    </div>


    <div class="row">
      <span class="label">UTR / Transaction ID</span>
      <span class="value">
        ${receiptEscape(data.utr)}
      </span>
    </div>


    <div class="row">
      <span class="label">Date & Time</span>
      <span class="value">
        ${receiptEscape(data.dateTime)}
      </span>
    </div>


    <div class="row">
      <span class="label">Status</span>
      <span class="value">
        Pending Verification
      </span>
    </div>

  </div>


  <div class="note">

    धन्यवाद! आपकी donation details सफलतापूर्वक submit हो गई हैं।
    यह acknowledgement है। UTR / transaction की final verification
    समिति द्वारा की जाएगी।

  </div>


  <div class="footer">

    ${receiptEscape(templeName)}<br>

    Digital Donation Receipt • ${currentYear}

  </div>

</div>

<script>

window.onload = function() {

  setTimeout(function() {
    window.print();
  }, 400);

};

window.onafterprint = function() {

  setTimeout(function() {
    window.close();
  }, 300);

};

</script>

</body>

</html>
  `);

  printWindow.document.close();
}


// ============================================================
// DONATION FORM
// ============================================================

function getDonationForm() {
  return (
    document.getElementById("donationForm") ||
    document.querySelector("form[data-donation-form]") ||
    document.querySelector(".donation-form")
  );
}


function initDonationForm() {
  const form = getDonationForm();

  if (!form) {
    console.warn("Donation form not found.");
    return;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton =
      form.querySelector(
        'button[type="submit"], input[type="submit"]'
      );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText =
        submitButton.textContent;

      submitButton.textContent =
        "Submitting...";
    }


    try {

      const formData = new FormData(form);

      const donorName = String(
        formData.get("donorName") ||
        formData.get("name") ||
        ""
      ).trim();

      const amount = Number(
        formData.get("amount") || 0
      );

      const purpose = String(
        formData.get("purpose") ||
        "General Donation"
      ).trim();

      const utr = String(
        formData.get("utr") ||
        formData.get("transactionId") ||
        formData.get("transaction") ||
        ""
      ).trim();


      if (!donorName) {
        throw new Error("कृपया donor name भरें।");
      }


      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          "कृपया सही donation amount डालें।"
        );
      }


      if (!utr) {
        throw new Error(
          "कृपया UTR / Transaction ID डालें।"
        );
      }


      const receiptNumber =
        generateReceiptNumber();

      const now = new Date();

      const receiptData = {

        donorName,

        amount,

        purpose:
          purpose || "General Donation",

        utr,

        receiptNumber,

        status:
          "pending",

        createdAt:
          serverTimestamp()

      };


      await addDoc(
        collection(db, "donations"),
        receiptData
      );


      const displayData = {

        ...receiptData,

        dateTime:
          formatReceiptDate(now)

      };


      form.reset();

      closeDonationModal();

      showDonationReceipt(
        displayData
      );


      showToast(
        "Donation successfully submit हो गई।"
      );

    } catch (error) {

      console.error(
        "Donation submission error:",
        error
      );

      showToast(
        error?.message ||
        "Donation submit नहीं हो पाई।",
        "error"
      );

    } finally {

      if (submitButton) {

        submitButton.disabled = false;

        submitButton.textContent =
          submitButton.dataset.originalText ||
          "Submit";

      }

    }

  });
}


// ============================================================
// TEMPLE SETTINGS
// ============================================================

async function loadTempleSettings() {
  try {

    const settingsRef =
      doc(db, "temple", "settings");

    const snapshot =
      await getDoc(settingsRef);

    if (!snapshot.exists()) {
      return;
    }

    templeSettings = {
      ...templeSettings,
      ...snapshot.data()
    };

    applyTempleSettings();

  } catch (error) {

    console.error(
      "Temple settings load error:",
      error
    );

  }
}


function applyTempleSettings() {

  // UPI
  updateDonationUPI();

  // QR
  renderDonationQR();

  // Aarti
  const aartiElements =
    document.querySelectorAll(
      "#aartiTime, [data-aarti-time]"
    );

  aartiElements.forEach(element => {

    if (templeSettings.aartiTime) {
      element.textContent =
        templeSettings.aartiTime;
    }

  });


  // Contact
  const contactElements =
    document.querySelectorAll(
      "#contactPhone, [data-contact-phone]"
    );

  contactElements.forEach(element => {

    if (templeSettings.contactNumber) {

      const cleanNumber =
        String(
          templeSettings.contactNumber
        ).replace(/[^\d+]/g, "");

      element.textContent =
        templeSettings.contactNumber;

      element.href =
        `tel:${cleanNumber}`;

      element.style.pointerEvents =
        "auto";

    } else {

      element.textContent =
        "संपर्क नंबर जल्द अपडेट होगा।";

      element.removeAttribute("href");

      element.style.pointerEvents =
        "none";

    }

  });


  // Live URL
  if (templeSettings.liveUrl) {

    renderLiveVideo(
      templeSettings.liveUrl
    );

  }

}


// ============================================================
// REALTIME TEMPLE SETTINGS
// ============================================================

function listenTempleSettings() {

  try {

    const settingsRef =
      doc(db, "temple", "settings");

    onSnapshot(
      settingsRef,
      snapshot => {

        if (!snapshot.exists()) {
          return;
        }

        templeSettings = {
          ...templeSettings,
          ...snapshot.data()
        };

        applyTempleSettings();

      },
      error => {

        console.error(
          "Temple settings realtime error:",
          error
        );

      }
    );

  } catch (error) {

    console.error(
      "Settings listener error:",
      error
    );

  }

}


// ============================================================
// LIVE VIDEO
// ============================================================

function getYouTubeEmbedUrl(url) {

  if (!url) return "";

  try {

    const parsed =
      new URL(url);

    let videoId = "";

    if (
      parsed.hostname.includes(
        "youtube.com"
      )
    ) {

      videoId =
        parsed.searchParams.get(
          "v"
        ) || "";

      if (
        parsed.pathname.startsWith(
          "/live/"
        )
      ) {

        videoId =
          parsed.pathname
            .split("/live/")[1]
            ?.split("/")[0] || "";

      }

    } else if (
      parsed.hostname === "youtu.be"
    ) {

      videoId =
        parsed.pathname
          .replace("/", "")
          .split("/")[0];

    }

    if (!videoId) {
      return "";
    }

    return (
      `https://www.youtube.com/embed/` +
      `${encodeURIComponent(videoId)}`
    );

  } catch {

    return "";

  }

}


function renderLiveVideo(url) {

  const container =
    document.querySelector(
      "#liveVideo"
    ) ||
    document.querySelector(
      "[data-live-video]"
    );

  if (!container) {
    return;
  }

  const embedUrl =
    getYouTubeEmbedUrl(url);

  if (!embedUrl) {

    container.innerHTML = `
      <div style="
        padding:20px;
        text-align:center;
        color:#64748b;
      ">
        Live video जल्द उपलब्ध होगा।
      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div style="
      position:relative;
      width:100%;
      padding-bottom:56.25%;
      height:0;
      overflow:hidden;
      border-radius:16px;
    ">

      <iframe
        src="${escapeHtml(embedUrl)}"
        title="Temple Live"
        style="
          position:absolute;
          inset:0;
          width:100%;
          height:100%;
          border:0;
        "
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
          web-share
        "
        allowfullscreen
        loading="lazy"
      ></iframe>

    </div>
  `;

}


// ============================================================
// SCHEDULE
// ============================================================

async function loadSchedule() {

  const container =
    document.querySelector(
      "#scheduleList"
    ) ||
    document.querySelector(
      "[data-schedule-list]"
    );

  if (!container) {
    return;
  }

  try {

    const scheduleRef =
      collection(
        db,
        "schedule"
      );

    const scheduleQuery =
      query(
        scheduleRef,
        orderBy(
          "date",
          "asc"
        )
      );

    const snapshot =
      await getDocs(
        scheduleQuery
      );

    if (snapshot.empty) {

      container.innerHTML = `
        <div style="
          padding:20px;
          text-align:center;
          color:#64748b;
        ">
          कार्यक्रम की जानकारी जल्द अपडेट होगी।
        </div>
      `;

      return;
    }


    container.innerHTML = "";

    snapshot.forEach(
      documentSnapshot => {

        const data =
          documentSnapshot.data();

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "schedule-item";

        item.innerHTML = `
          <div>
            <strong>
              ${escapeHtml(
                data.title ||
                data.name ||
                "कार्यक्रम"
              )}
            </strong>

            <div>
              ${escapeHtml(
                data.date || ""
              )}
              ${
                data.time
                  ? ` • ${escapeHtml(data.time)}`
                  : ""
              }
            </div>
          </div>
        `;

        container.appendChild(
          item
        );

      }
    );

  } catch (error) {

    console.error(
      "Schedule load error:",
      error
    );

  }

}


function listenSchedule() {

  try {

    const scheduleRef =
      collection(
        db,
        "schedule"
      );

    const scheduleQuery =
      query(
        scheduleRef,
        orderBy(
          "date",
          "asc"
        )
      );

    onSnapshot(
      scheduleQuery,
      () => {
        loadSchedule();
      },
      error => {
        console.error(
          "Schedule realtime error:",
          error
        );
      }
    );

  } catch (error) {

    console.error(
      "Schedule listener error:",
      error
    );

  }

}


// ============================================================
// GALLERY
// ============================================================

async function loadGallery() {

  const container =
    document.querySelector(
      "#galleryGrid"
    ) ||
    document.querySelector(
      "[data-gallery]"
    );

  if (!container) {
    return;
  }

  try {

    const galleryRef =
      collection(
        db,
        "gallery"
      );

    const snapshot =
      await getDocs(
        galleryRef
      );

    if (snapshot.empty) {

      container.innerHTML = `
        <div style="
          padding:20px;
          text-align:center;
          color:#64748b;
          grid-column:1/-1;
        ">
          Gallery photos जल्द अपडेट होंगी।
        </div>
      `;

      return;
    }


    container.innerHTML = "";


    snapshot.forEach(
      documentSnapshot => {

        const data =
          documentSnapshot.data();

        const imageUrl =
          data.imageUrl ||
          data.url ||
          data.photoUrl ||
          "";

        if (!imageUrl) {
          return;
        }


        const item =
          document.createElement(
            "div"
          );

        item.className =
          "gallery-item";


        item.innerHTML = `

          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(
              data.title ||
              "Temple Gallery"
            )}"
            loading="lazy"
          >

          ${
            data.title
              ? `
                <div>
                  ${escapeHtml(
                    data.title
                  )}
                </div>
              `
              : ""
          }

        `;


        container.appendChild(
          item
        );

      }
    );


  } catch (error) {

    console.error(
      "Gallery load error:",
      error
    );

  }

}


function listenGallery() {

  try {

    const galleryRef =
      collection(
        db,
        "gallery"
      );

    onSnapshot(
      galleryRef,
      () => {
        loadGallery();
      },
      error => {
        console.error(
          "Gallery realtime error:",
          error
        );
      }
    );

  } catch (error) {

    console.error(
      "Gallery listener error:",
      error
    );

  }

}


// ============================================================
// GOOGLE MAPS
// ============================================================

function initGoogleMap() {

  const mapElements =
    document.querySelectorAll(
      "[data-map-link], #mapLink"
    );

  mapElements.forEach(
    element => {

      element.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const destination =
            "Maa Manokamana Temple, Chakshivganj, Maulanagar, Suryagarha, Lakhisarai, Bihar";

          const url =
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

          window.open(
            url,
            "_blank",
            "noopener"
          );

        }
      );

    }
  );

}


// ============================================================
// LANGUAGE TOGGLE
// ============================================================

function initLanguageToggle() {

  const buttons =
    document.querySelectorAll(
      "[data-language], #languageToggle"
    );

  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document.documentElement.classList.toggle(
            "english-mode"
          );

        }
      );

    }
  );

}


// ============================================================
// PWA INSTALL
// ============================================================

function createInstallButton() {

  if (document.getElementById("installAppBtn")) {

    installButton =
      document.getElementById(
        "installAppBtn"
      );

    installButton.style.display =
      "inline-flex";

    return;
  }


  installButton =
    document.createElement(
      "button"
    );

  installButton.id =
    "floatingInstallAppBtn";

  installButton.type =
    "button";

  installButton.innerHTML =
    "📱 App Install करें";


  installButton.style.cssText = `
    position:fixed;
    right:18px;
    bottom:18px;
    z-index:9998;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    min-height:48px;
    padding:12px 18px;
    border:0;
    border-radius:14px;
    background:#7f1111;
    color:#fff;
    font-size:13px;
    font-weight:800;
    box-shadow:0 10px 30px rgba(127,17,17,.30);
    cursor:pointer;
  `;


  document.body.appendChild(
    installButton
  );


  installButton.addEventListener(
    "click",
    installApp
  );

}


function isAppInstalled() {

  return (
    window.matchMedia &&
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches
  ) ||
  window.navigator.standalone === true;

}


async function installApp() {

  if (isAppInstalled()) {

    showToast(
      "App पहले से installed है।"
    );

    return;

  }


  if (!deferredInstallPrompt) {

    showToast(
      "Install option अभी browser द्वारा available नहीं है। Chrome menu में Install app / Add to Home screen देखें।"
    );

    return;

  }


  try {

    deferredInstallPrompt.prompt();

    const choice =
      await deferredInstallPrompt.userChoice;

    if (
      choice &&
      choice.outcome === "accepted"
    ) {

      showToast(
        "App installation शुरू हो गई।"
      );

    }


    deferredInstallPrompt =
      null;

  } catch (error) {

    console.error(
      "PWA install error:",
      error
    );

  }

}


function initPWA() {

  createInstallButton();


  window.addEventListener(
    "beforeinstallprompt",
    event => {

      event.preventDefault();

      deferredInstallPrompt =
        event;

      if (installButton) {
        installButton.style.display =
          "inline-flex";
      }

    }
  );


  window.addEventListener(
    "appinstalled",
    () => {

      deferredInstallPrompt =
        null;

      if (installButton) {

        installButton.style.display =
          "none";

      }

      showToast(
        "App successfully installed 🎉"
      );

    }
  );


  if (isAppInstalled()) {

    if (installButton) {

      installButton.style.display =
        "none";

    }

  }

}


// ============================================================
// SERVICE WORKER
// ============================================================

function registerServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {
    return;
  }


  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .then(
          registration => {

            console.log(
              "Service Worker registered:",
              registration.scope
            );

          }
        )
        .catch(
          error => {

            console.error(
              "Service Worker registration failed:",
              error
            );

          }
        );

    }
  );

}


// ============================================================
// INITIALIZE APP
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "Maa Manokamana Temple app starting..."
    );


    // Mobile menu
    initMobileMenu();


    // Donation
    initDonationModal();

    initDonationForm();


    // PWA
    initPWA();


    // Language
    initLanguageToggle();


    // Map
    initGoogleMap();


    // Firebase settings
    await loadTempleSettings();


    // Realtime settings
    listenTempleSettings();


    // Schedule
    await loadSchedule();

    listenSchedule();


    // Gallery
    await loadGallery();

    listenGallery();


    // Service worker
    registerServiceWorker();


    console.log(
      "Maa Manokamana Temple app ready."
    );

  }
);
