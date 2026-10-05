/* =========================================================
   MAA MANOKAMANA TEMPLE
   Main App JavaScript
   Firebase + Firestore Integration
   Donation Receipt System
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import firebaseConfig from "./firebase-config.js";


/* =========================================================
   FIREBASE INITIALIZATION
========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const menuBtn = $("menuBtn");
const navMenu = $("navMenu");

const yearEl = $("year");

const donationModal = $("donationModal");
const donateBtn = $("donateBtn");
const closeModal = $("closeModal");
const donationForm = $("donationForm");

const todayAartiTime = $("todayAartiTime");
const liveAartiTime = $("liveAartiTime");
const upiId = $("upiId");

const qrBox = $("qrBox");
const liveVideo = $("liveVideo");
const scheduleList = $("scheduleList");

/* Gallery */
const galleryGrid = $("galleryGrid");

/* Contact */
const contactPhone = $("contactPhone");

const mapBtn = $("mapBtn");
const languageBtn = $("languageBtn");


/* =========================================================
   TEMPLE SETTINGS
========================================================= */

let templeSettings = {
  upiId: "",
  aartiTime: "",
  liveUrl: "",
  qrUrl: "",
  contactNumber: ""
};


/* =========================================================
   PWA INSTALL
========================================================= */

let deferredInstallPrompt = null;
let installButton = null;


/* =========================================================
   YEAR
========================================================= */

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


/* =========================================================
   MOBILE MENU
========================================================= */

if (menuBtn && navMenu) {

  menuBtn.addEventListener("click", () => {

    navMenu.classList.toggle("active");

    const isOpen =
      navMenu.classList.contains("active");

    menuBtn.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );

  });

}


/* =========================================================
   CLOSE MOBILE MENU AFTER NAVIGATION
========================================================= */

document.querySelectorAll("#navMenu a").forEach(link => {

  link.addEventListener("click", () => {

    if (navMenu) {
      navMenu.classList.remove("active");
    }

  });

});


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);

}


/* =========================================================
   DONATION MODAL
========================================================= */

if (donateBtn && donationModal) {

  donateBtn.addEventListener("click", () => {

    donationModal.classList.add("active");

  });

}


if (closeModal && donationModal) {

  closeModal.addEventListener("click", () => {

    donationModal.classList.remove("active");

  });

}


/* Close modal when clicking outside */

if (donationModal) {

  donationModal.addEventListener("click", (event) => {

    if (event.target === donationModal) {

      donationModal.classList.remove("active");

    }

  });

}


/* Close modal with Escape */

document.addEventListener("keydown", (event) => {

  if (
    event.key === "Escape" &&
    donationModal &&
    donationModal.classList.contains("active")
  ) {

    donationModal.classList.remove("active");

  }

});


/* =========================================================
   DONATION RECEIPT
========================================================= */

/*
   Receipt number format:

   DPG-2026-XXXXXX

   Example:
   DPG-2026-482913
*/

function generateReceiptNumber() {

  const year = new Date().getFullYear();

  const randomNumber =
    Math.floor(
      100000 +
      Math.random() * 900000
    );

  return `DPG-${year}-${randomNumber}`;

}


/* =========================================================
   FORMAT RECEIPT DATE
========================================================= */

function formatReceiptDate(date = new Date()) {

  try {

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }
    );

  } catch {

    return String(date);

  }

}


/* =========================================================
   ESCAPE RECEIPT HTML
========================================================= */

function receiptEscape(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


/* =========================================================
   SHOW DONATION RECEIPT
========================================================= */

function showDonationReceipt(data) {

  const existingReceipt =
    $("donationReceiptModal");

  if (existingReceipt) {
    existingReceipt.remove();
  }


  const receiptModal =
    document.createElement("div");

  receiptModal.id =
    "donationReceiptModal";


  receiptModal.innerHTML = `

    <div class="donation-receipt-overlay">

      <div class="donation-receipt-card">

        <div class="receipt-top">

          <div class="receipt-temple-icon">
            🛕
          </div>

          <h2>
            श्री श्री 108 माँ मनोकामना
          </h2>

          <h3>
            छोटी दुर्गा पूजा समिति
          </h3>

          <p>
            चकशिवगंज, मौलानगर, सूर्यगढ़ा (लखीसराय), बिहार
          </p>

          <div class="receipt-puja-title">
            दुर्गा पूजा 2026
          </div>

        </div>


        <div class="receipt-status pending">
          ✓ Donation Submitted
        </div>


        <div class="receipt-number-row">

          <span>
            Receipt No.
          </span>

          <strong>
            ${receiptEscape(data.receiptNumber)}
          </strong>

        </div>


        <div class="receipt-divider"></div>


        <div class="receipt-details">

          <div class="receipt-row">

            <span>Donor Name</span>

            <strong>
              ${receiptEscape(data.donorName)}
            </strong>

          </div>


          <div class="receipt-row">

            <span>Donation Purpose</span>

            <strong>
              ${receiptEscape(data.purpose)}
            </strong>

          </div>


          <div class="receipt-row amount-row">

            <span>Donation Amount</span>

            <strong>
              ₹${receiptEscape(
                Number(data.amount).toLocaleString("en-IN")
              )}
            </strong>

          </div>


          <div class="receipt-row">

            <span>Transaction / UTR</span>

            <strong class="receipt-utr">
              ${receiptEscape(data.utr)}
            </strong>

          </div>


          <div class="receipt-row">

            <span>Date & Time</span>

            <strong>
              ${receiptEscape(data.dateTime)}
            </strong>

          </div>

        </div>


        <div class="receipt-note">

          <strong>धन्यवाद 🙏</strong>

          <p>
            माँ दुर्गा पूजा समिति में आपके सहयोग के लिए
            हृदय से धन्यवाद।
          </p>

          <small>
            यह receipt donation submission का acknowledgement है।
            Final verification committee द्वारा की जाएगी।
          </small>

        </div>


        <div class="receipt-actions">

          <button
            type="button"
            id="printDonationReceipt"
            class="receipt-print-btn"
          >
            🖨️ Print / Save PDF
          </button>

          <button
            type="button"
            id="closeDonationReceipt"
            class="receipt-close-btn"
          >
            बंद करें
          </button>

        </div>

      </div>

    </div>

  `;


  document.body.appendChild(receiptModal);


  /* Print button */

  const printBtn =
    $("printDonationReceipt");


  if (printBtn) {

    printBtn.addEventListener(
      "click",
      () => {

        printDonationReceipt(
          data
        );

      }
    );

  }


  /* Close button */

  const closeReceiptBtn =
    $("closeDonationReceipt");


  if (closeReceiptBtn) {

    closeReceiptBtn.addEventListener(
      "click",
      () => {

        receiptModal.remove();

      }
    );

  }


  /* Click outside receipt */

  const overlay =
    receiptModal.querySelector(
      ".donation-receipt-overlay"
    );


  if (overlay) {

    overlay.addEventListener(
      "click",
      (event) => {

        if (
          event.target === overlay
        ) {

          receiptModal.remove();

        }

      }
    );

  }

}


/* =========================================================
   PRINT DONATION RECEIPT
========================================================= */

function printDonationReceipt(data) {

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=800,height=900"
    );


  if (!printWindow) {

    showToast(
      "Print window open नहीं हो सकी। Browser popup allow करें।"
    );

    return;

  }


  const amount =
    Number(data.amount)
      .toLocaleString("en-IN");


  printWindow.document.write(`

    <!DOCTYPE html>

    <html lang="hi">

    <head>

      <meta charset="UTF-8">

      <title>
        Donation Receipt - ${receiptEscape(data.receiptNumber)}
      </title>

      <style>

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 30px;
          background: #f5f5f5;
          font-family:
            Arial,
            "Noto Sans Devanagari",
            sans-serif;
          color: #24120f;
        }

        .receipt {
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          background: #ffffff;
          border: 2px solid #7f1111;
          border-radius: 18px;
          overflow: hidden;
        }

        .header {
          text-align: center;
          padding: 28px 25px 20px;
          border-bottom: 1px solid #ead6d0;
        }

        .icon {
          font-size: 42px;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0;
          font-size: 25px;
          color: #7f1111;
        }

        h2 {
          margin: 6px 0;
          font-size: 18px;
        }

        .address {
          margin: 8px 0 0;
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }

        .puja {
          display: inline-block;
          margin-top: 15px;
          padding: 8px 16px;
          border-radius: 30px;
          background: #fff3e5;
          color: #7f1111;
          font-weight: 800;
        }

        .status {
          margin: 22px 25px 10px;
          padding: 10px;
          text-align: center;
          border-radius: 8px;
          background: #fff8df;
          color: #765600;
          font-weight: 800;
        }

        .receipt-no {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 12px 25px;
          font-size: 14px;
        }

        .divider {
          height: 1px;
          background: #ead6d0;
          margin: 5px 25px;
        }

        .details {
          padding: 12px 25px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 13px 0;
          border-bottom: 1px dashed #ddd;
        }

        .row:last-child {
          border-bottom: 0;
        }

        .row span {
          color: #666;
        }

        .row strong {
          text-align: right;
          word-break: break-word;
        }

        .amount {
          font-size: 22px;
          color: #7f1111;
        }

        .note {
          margin: 10px 25px 25px;
          padding: 18px;
          background: #fffaf4;
          border-radius: 12px;
          text-align: center;
          line-height: 1.6;
        }

        .note strong {
          display: block;
          color: #7f1111;
          font-size: 18px;
          margin-bottom: 5px;
        }

        .note p {
          margin: 5px 0;
        }

        .note small {
          display: block;
          margin-top: 10px;
          color: #777;
        }

        @media print {

          body {
            background: #ffffff;
            padding: 0;
          }

          .receipt {
            max-width: none;
            border: 2px solid #7f1111;
          }

        }

      </style>

    </head>

    <body>

      <div class="receipt">

        <div class="header">

          <div class="icon">
            🛕
          </div>

          <h1>
            श्री श्री 108 माँ मनोकामना
          </h1>

          <h2>
            छोटी दुर्गा पूजा समिति
          </h2>

          <div class="address">
            चकशिवगंज, मौलानगर, सूर्यगढ़ा (लखीसराय), बिहार
          </div>

          <div class="puja">
            दुर्गा पूजा 2026
          </div>

        </div>


        <div class="status">
          ✓ Donation Submitted — Verification Pending
        </div>


        <div class="receipt-no">

          <span>
            Receipt No.
          </span>

          <strong>
            ${receiptEscape(data.receiptNumber)}
          </strong>

        </div>


        <div class="divider"></div>


        <div class="details">

          <div class="row">

            <span>
              Donor Name
            </span>

            <strong>
              ${receiptEscape(data.donorName)}
            </strong>

          </div>


          <div class="row">

            <span>
              Donation Purpose
            </span>

            <strong>
              ${receiptEscape(data.purpose)}
            </strong>

          </div>


          <div class="row">

            <span>
              Donation Amount
            </span>

            <strong class="amount">
              ₹${receiptEscape(amount)}
            </strong>

          </div>


          <div class="row">

            <span>
              Transaction / UTR
            </span>

            <strong>
              ${receiptEscape(data.utr)}
            </strong>

          </div>


          <div class="row">

            <span>
              Date & Time
            </span>

            <strong>
              ${receiptEscape(data.dateTime)}
            </strong>

          </div>

        </div>


        <div class="note">

          <strong>
            धन्यवाद 🙏
          </strong>

          <p>
            माँ दुर्गा पूजा समिति में आपके सहयोग के लिए
            हृदय से धन्यवाद।
          </p>

          <small>
            यह receipt donation submission का acknowledgement है।
            Final verification committee द्वारा की जाएगी।
          </small>

        </div>

      </div>


      <script>

        window.onload = function() {
          window.print();
        };

      <\/script>

    </body>

    </html>

  `);


  printWindow.document.close();

}


/* =========================================================
   DONATION SUBMISSION
========================================================= */

if (donationForm) {

  donationForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const donorName =
      $("donorName")?.value.trim() || "Anonymous";

    const amountValue =
      $("donationAmount")?.value.trim() || "";

    const purpose =
      $("donationPurpose")?.value ||
      "दुर्गा पूजा सेवा";

    const utr =
      $("utr")?.value.trim() || "";


    if (!amountValue) {

      showToast(
        "कृपया Donation Amount भरें।"
      );

      return;

    }


    const amount =
      Number(amountValue);


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      showToast(
        "कृपया सही Donation Amount डालें।"
      );

      return;

    }


    if (!utr) {

      showToast(
        "कृपया UTR / Transaction ID भरें।"
      );

      return;

    }


    if (utr.length < 4) {

      showToast(
        "कृपया सही UTR / Transaction ID डालें।"
      );

      return;

    }


    const submitBtn =
      donationForm.querySelector(
        'button[type="submit"]'
      );


    const oldButtonText =
      submitBtn
        ? submitBtn.textContent
        : "";


    if (submitBtn) {

      submitBtn.disabled =
        true;

      submitBtn.textContent =
        "Submitting...";

    }


    try {

      const receiptNumber =
        generateReceiptNumber();


      const now =
        new Date();


      /*
        Donation Firestore में save.
      */

      const donationRef =
        await addDoc(
          collection(
            db,
            "donations"
          ),
          {
            donorName:
              donorName,

            amount:
              amount,

            purpose:
              purpose,

            utr:
              utr,

            receiptNumber:
              receiptNumber,

            status:
              "pending",

            createdAt:
              serverTimestamp()
          }
        );


      console.log(
        "Donation saved:",
        donationRef.id
      );


      /*
        Receipt data
      */

      const receiptData = {

        receiptNumber:
          receiptNumber,

        donorName:
          donorName,

        amount:
          amount,

        purpose:
          purpose,

        utr:
          utr,

        dateTime:
          formatReceiptDate(now),

        status:
          "pending"

      };


      /*
        Modal close
      */

      if (donationModal) {

        donationModal.classList.remove(
          "active"
        );

      }


      /*
        Form reset
      */

      donationForm.reset();


      /*
        Success message
      */

      showToast(
        "Donation submit हो गई। आपकी receipt तैयार है।"
      );


      /*
        Receipt दिखाएँ
      */

      setTimeout(() => {

        showDonationReceipt(
          receiptData
        );

      }, 250);


    } catch (error) {

      console.error(
        "Donation submission error:",
        error
      );


      showToast(
        "Donation submit नहीं हो सकी। कृपया थोड़ी देर बाद फिर प्रयास करें।"
      );


    } finally {

      if (submitBtn) {

        submitBtn.disabled =
          false;

        submitBtn.textContent =
          oldButtonText;

      }

    }

  });

}


/* =========================================================
   LOAD TEMPLE SETTINGS
========================================================= */

async function loadTempleSettings() {

  try {

    const settingsRef =
      doc(
        db,
        "temple",
        "settings"
      );


    const settingsSnap =
      await getDoc(
        settingsRef
      );


    if (settingsSnap.exists()) {

      const data =
        settingsSnap.data();


      templeSettings = {

        upiId:
          data.upiId || "",

        aartiTime:
          data.aartiTime || "",

        liveUrl:
          data.liveUrl || "",

        qrUrl:
          data.qrUrl || "",

        contactNumber:
          data.contactNumber || ""

      };

    }


    applyTempleSettings();


  } catch (error) {

    console.error(
      "Settings loading error:",
      error
    );

    applyTempleSettings();

  }

}


/* =========================================================
   REALTIME TEMPLE SETTINGS
========================================================= */

function listenToTempleSettings() {

  try {

    const settingsRef =
      doc(
        db,
        "temple",
        "settings"
      );


    onSnapshot(
      settingsRef,

      (snapshot) => {

        if (!snapshot.exists()) {
          return;
        }


        const data =
          snapshot.data();


        templeSettings = {

          upiId:
            data.upiId || "",

          aartiTime:
            data.aartiTime || "",

          liveUrl:
            data.liveUrl || "",

          qrUrl:
            data.qrUrl || "",

          contactNumber:
            data.contactNumber || ""

        };


        applyTempleSettings();

      },

      (error) => {

        console.error(
          "Realtime settings error:",
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


/* =========================================================
   APPLY TEMPLE SETTINGS
========================================================= */

function applyTempleSettings() {

  const aartiTime =
    templeSettings.aartiTime ||
    "समय जल्द अपडेट होगा";


  if (todayAartiTime) {

    todayAartiTime.textContent =
      aartiTime;

  }


  if (liveAartiTime) {

    liveAartiTime.textContent =
      aartiTime;

  }


  if (upiId) {

    upiId.textContent =
      templeSettings.upiId ||
      "Admin Panel से अपडेट होगा";

  }


  renderQRCode();

  renderLiveVideo();

  renderContactNumber();

}


/* =========================================================
   CONTACT NUMBER
========================================================= */

function renderContactNumber() {

  if (!contactPhone) {
    return;
  }


  const number =
    templeSettings.contactNumber?.trim();


  if (!number) {

    contactPhone.textContent =
      "संपर्क नंबर जल्द अपडेट होगा।";

    contactPhone.removeAttribute(
      "href"
    );

    contactPhone.style.pointerEvents =
      "none";

    return;

  }


  contactPhone.textContent =
    number;


  const cleanNumber =
    number.replace(
      /[^\d+]/g,
      ""
    );


  if (cleanNumber) {

    contactPhone.href =
      `tel:${cleanNumber}`;

    contactPhone.style.pointerEvents =
      "auto";

  }

}


/* =========================================================
   QR CODE
========================================================= */

function renderQRCode() {

  if (!qrBox) {
    return;
  }


  const qrUrl =
    templeSettings.qrUrl?.trim();


  if (!qrUrl) {

    qrBox.innerHTML = `

      <span>
        QR
      </span>

      <small>
        QR Code यहाँ दिखेगा
      </small>

    `;

    return;

  }


  const img =
    document.createElement(
      "img"
    );


  img.src =
    qrUrl;

  img.alt =
    "माँ मनोकामना मंदिर Donation QR Code";

  img.loading =
    "lazy";

  img.style.width =
    "100%";

  img.style.height =
    "100%";

  img.style.objectFit =
    "contain";

  img.style.display =
    "block";


  img.onerror = () => {

    qrBox.innerHTML = `

      <span>
        QR
      </span>

      <small>
        QR Code load नहीं हो सका
      </small>

    `;

  };


  qrBox.innerHTML = "";

  qrBox.appendChild(
    img
  );

}


/* =========================================================
   LIVE AARTI
========================================================= */

function renderLiveVideo() {

  if (!liveVideo) {
    return;
  }


  const liveUrl =
    templeSettings.liveUrl?.trim();


  if (!liveUrl) {

    liveVideo.innerHTML = `

      <div class="play-icon">
        ▶
      </div>

      <h3>
        Live Aarti
      </h3>

      <p>
        आरती शुरू होने पर यहाँ Live दिखाई देगा।
      </p>

    `;

    return;

  }


  const embedUrl =
    getYouTubeEmbedUrl(
      liveUrl
    );


  if (embedUrl) {

    liveVideo.innerHTML = `

      <iframe
        src="${escapeHtml(embedUrl)}"
        title="माँ मनोकामना Live Aarti"
        width="100%"
        height="100%"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        style="border:0; width:100%; height:100%; display:block;"
      ></iframe>

    `;

    return;

  }


  liveVideo.innerHTML = `

    <div class="play-icon">
      ▶
    </div>

    <h3>
      Live Aarti
    </h3>

    <p>
      Live Aarti देखने के लिए नीचे दिए बटन पर जाएँ।
    </p>

    <a
      href="${escapeHtml(liveUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-primary"
      style="margin-top:12px; display:inline-block;"
    >
      🔴 Open Live
    </a>

  `;

}


/* =========================================================
   YOUTUBE URL → EMBED URL
========================================================= */

function getYouTubeEmbedUrl(url) {

  if (!url) {
    return "";
  }


  try {

    const parsed =
      new URL(url);


    if (
      parsed.hostname.includes(
        "youtube.com"
      ) &&
      parsed.pathname ===
        "/watch"
    ) {

      const videoId =
        parsed.searchParams.get(
          "v"
        );


      if (videoId) {

        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

      }

    }


    if (
      parsed.hostname ===
        "youtu.be" ||
      parsed.hostname ===
        "www.youtu.be"
    ) {

      const videoId =
        parsed.pathname.replace(
          "/",
          ""
        );


      if (videoId) {

        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

      }

    }


    if (
      parsed.hostname.includes(
        "youtube.com"
      ) &&
      parsed.pathname.startsWith(
        "/live/"
      )
    ) {

      const videoId =
        parsed.pathname.split(
          "/"
        )[2];


      if (videoId) {

        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

      }

    }


    if (
      parsed.hostname.includes(
        "youtube.com"
      ) &&
      parsed.pathname.startsWith(
        "/embed/"
      )
    ) {

      return url;

    }


  } catch (error) {

    console.warn(
      "Invalid live URL:",
      error
    );

  }


  return "";

}


/* =========================================================
   LOAD SCHEDULE
========================================================= */

async function loadSchedule() {

  if (!scheduleList) {
    return;
  }


  try {

    const scheduleQuery =
      query(
        collection(
          db,
          "schedule"
        ),
        orderBy(
          "date",
          "asc"
        ),
        limit(30)
      );


    const snapshot =
      await getDocs(
        scheduleQuery
      );


    if (snapshot.empty) {

      renderEmptySchedule();

      return;

    }


    const schedules = [];


    snapshot.forEach(
      (scheduleDoc) => {

        schedules.push({

          id:
            scheduleDoc.id,

          ...scheduleDoc.data()

        });

      }
    );


    renderSchedule(
      schedules
    );


  } catch (error) {

    console.error(
      "Schedule loading error:",
      error
    );


    renderEmptySchedule(
      "कार्यक्रम अभी उपलब्ध नहीं हैं।"
    );

  }

}


/* =========================================================
   REALTIME SCHEDULE
========================================================= */

function listenToSchedule() {

  if (!scheduleList) {
    return;
  }


  try {

    const scheduleQuery =
      query(
        collection(
          db,
          "schedule"
        ),
        orderBy(
          "date",
          "asc"
        ),
        limit(30)
      );


    onSnapshot(
      scheduleQuery,

      (snapshot) => {

        const schedules = [];


        snapshot.forEach(
          (scheduleDoc) => {

            schedules.push({

              id:
                scheduleDoc.id,

              ...scheduleDoc.data()

            });

          }
        );


        if (
          schedules.length === 0
        ) {

          renderEmptySchedule();

          return;

        }


        renderSchedule(
          schedules
        );

      },

      (error) => {

        console.error(
          "Realtime schedule error:",
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


/* =========================================================
   RENDER SCHEDULE
========================================================= */

function renderSchedule(
  schedules
) {

  if (!scheduleList) {
    return;
  }


  scheduleList.innerHTML =
    "";


  schedules.forEach(
    (item) => {

      const scheduleItem =
        document.createElement(
          "div"
        );


      scheduleItem.className =
        "schedule-item";


      const dateInfo =
        formatScheduleDate(
          item.date
        );


      scheduleItem.innerHTML = `

        <div class="schedule-date">

          <strong>
            ${escapeHtml(
              dateInfo.day
            )}
          </strong>

          <span>
            ${escapeHtml(
              dateInfo.month
            )}
          </span>

        </div>


        <div class="schedule-info">

          <h3>
            ${escapeHtml(
              item.title ||
              "कार्यक्रम"
            )}
          </h3>

          <p>
            ${escapeHtml(
              item.description ||
              ""
            )}
          </p>

          ${
            item.time
              ? `
                <small>
                  🕐 ${escapeHtml(
                    item.time
                  )}
                </small>
              `
              : ""
          }

        </div>

      `;


      scheduleList.appendChild(
        scheduleItem
      );

    }
  );

}


/* =========================================================
   EMPTY SCHEDULE
========================================================= */

function renderEmptySchedule(
  message =
    "कार्यक्रम जल्द अपडेट होगा।"
) {

  if (!scheduleList) {
    return;
  }


  scheduleList.innerHTML = `

    <div class="schedule-item">

      <div class="schedule-date">

        <strong>
          —
        </strong>

        <span>
          DATE
        </span>

      </div>


      <div class="schedule-info">

        <h3>
          ${escapeHtml(
            message
          )}
        </h3>

        <p>
          Admin Panel से कार्यक्रम जोड़े जाएंगे।
        </p>

      </div>

    </div>

  `;

}


/* =========================================================
   FORMAT SCHEDULE DATE
========================================================= */

function formatScheduleDate(
  dateValue
) {

  if (!dateValue) {

    return {
      day: "—",
      month: "DATE"
    };

  }


  try {

    const date =
      new Date(
        dateValue
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return {

        day:
          dateValue,

        month:
          "DATE"

      };

    }


    const months = [

      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC"

    ];


    return {

      day:
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        ),

      month:
        months[
          date.getMonth()
        ]

    };


  } catch {

    return {

      day:
        String(
          dateValue
        ),

      month:
        "DATE"

    };

  }

}


/* =========================================================
   GALLERY
========================================================= */

async function loadGallery() {

  if (!galleryGrid) {
    return;
  }


  try {

    const galleryQuery =
      query(
        collection(
          db,
          "gallery"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(30)
      );


    const snapshot =
      await getDocs(
        galleryQuery
      );


    const items = [];


    snapshot.forEach(
      (galleryDoc) => {

        items.push({

          id:
            galleryDoc.id,

          ...galleryDoc.data()

        });

      }
    );


    renderGallery(
      items
    );


  } catch (error) {

    console.error(
      "Gallery loading error:",
      error
    );


    renderEmptyGallery(
      "Photos अभी load नहीं हो पाईं।"
    );

  }

}


/* =========================================================
   REALTIME GALLERY
========================================================= */

function listenToGallery() {

  if (!galleryGrid) {
    return;
  }


  try {

    const galleryQuery =
      query(
        collection(
          db,
          "gallery"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(30)
      );


    onSnapshot(
      galleryQuery,

      (snapshot) => {

        const items = [];


        snapshot.forEach(
          (galleryDoc) => {

            items.push({

              id:
                galleryDoc.id,

              ...galleryDoc.data()

            });

          }
        );


        renderGallery(
          items
        );

      },

      (error) => {

        console.error(
          "Realtime gallery error:",
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


/* =========================================================
   RENDER GALLERY
========================================================= */

function renderGallery(
  items
) {

  if (!galleryGrid) {
    return;
  }


  if (
    !items ||
    items.length === 0
  ) {

    renderEmptyGallery();

    return;

  }


  galleryGrid.innerHTML =
    "";


  items.forEach(
    (item) => {

      const galleryItem =
        document.createElement(
          "article"
        );


      galleryItem.className =
        "gallery-item";


      const image =
        document.createElement(
          "img"
        );


      image.src =
        item.imageUrl || "";


      image.alt =
        item.title ||
        "माँ मनोकामना मंदिर";


      image.loading =
        "lazy";


      image.decoding =
        "async";


      image.onerror = () => {

        image.style.display =
          "none";

      };


      const caption =
        document.createElement(
          "div"
        );


      caption.className =
        "gallery-caption";


      const title =
        document.createElement(
          "h3"
        );


      title.textContent =
        item.title ||
        "मंदिर दर्शन";


      const category =
        document.createElement(
          "span"
        );


      category.textContent =
        item.category ||
        "मंदिर";


      caption.appendChild(
        title
      );

      caption.appendChild(
        category
      );


      galleryItem.appendChild(
        image
      );

      galleryItem.appendChild(
        caption
      );


      galleryGrid.appendChild(
        galleryItem
      );

    }
  );

}


/* =========================================================
   EMPTY GALLERY
========================================================= */

function renderEmptyGallery(
  message =
    "अभी कोई फोटो उपलब्ध नहीं है।"
) {

  if (!galleryGrid) {
    return;
  }


  galleryGrid.innerHTML = `

    <div class="gallery-placeholder">

      <span>
        📸
      </span>

      <p>
        ${escapeHtml(
          message
        )}
      </p>

    </div>

  `;

}


/* =========================================================
   GOOGLE MAPS
========================================================= */

if (mapBtn) {

  mapBtn.addEventListener(
    "click",
    () => {

      const address =
        encodeURIComponent(
          "श्री श्री 108 माँ मनोकामना छोटी दुर्गा पूजा समिति, चकशिवगंज, मौलानगर, सूर्यगढ़ा, लखीसराय, बिहार"
        );


      const mapsUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        address;


      window.open(
        mapsUrl,
        "_blank",
        "noopener,noreferrer"
      );

    }
  );

}


/* =========================================================
   LANGUAGE BUTTON
========================================================= */

let englishMode =
  false;


if (languageBtn) {

  languageBtn.addEventListener(
    "click",
    () => {

      englishMode =
        !englishMode;


      if (englishMode) {

        languageBtn.textContent =
          "English | हिंदी";


        showToast(
          "English interface जल्द पूरी तरह उपलब्ध होगा।"
        );

      } else {

        languageBtn.textContent =
          "हिंदी | English";


        showToast(
          "हिंदी भाषा चयनित है।"
        );

      }

    }
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   PWA SERVICE WORKER
========================================================= */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker

        .register(
          "./sw.js"
        )

        .then(
          (registration) => {

            console.log(
              "Service Worker registered successfully.",
              registration
            );

          }
        )

        .catch(
          (error) => {

            console.error(
              "Service Worker registration failed:",
              error
            );

          }
        );

    }
  );

}


/* =========================================================
   PWA INSTALL BUTTON
========================================================= */

function createInstallButton() {

  const existingButton =
    $("installAppBtn");


  if (existingButton) {

    installButton =
      existingButton;

  } else {

    installButton =
      document.createElement(
        "button"
      );

    installButton.id =
      "installAppBtn";

    installButton.type =
      "button";

    installButton.innerHTML =
      "📱 Install App";

    document.body.appendChild(
      installButton
    );

  }


  installButton.style.position =
    "fixed";

  installButton.style.right =
    "18px";

  installButton.style.bottom =
    "18px";

  installButton.style.zIndex =
    "99999";

  installButton.style.display =
    "flex";

  installButton.style.alignItems =
    "center";

  installButton.style.justifyContent =
    "center";

  installButton.style.gap =
    "7px";

  installButton.style.border =
    "0";

  installButton.style.borderRadius =
    "999px";

  installButton.style.padding =
    "12px 18px";

  installButton.style.background =
    "#7f1111";

  installButton.style.color =
    "#ffffff";

  installButton.style.fontSize =
    "14px";

  installButton.style.fontWeight =
    "800";

  installButton.style.cursor =
    "pointer";

  installButton.style.boxShadow =
    "0 8px 25px rgba(0,0,0,.25)";

  installButton.style.transition =
    "transform .2s ease, opacity .2s ease";


  installButton.setAttribute(
    "aria-label",
    "Install App"
  );


  if (
    !installButton.dataset.installListener
  ) {

    installButton.addEventListener(
      "click",
      installApp
    );

    installButton.dataset.installListener =
      "true";

  }


  if (
    !installButton.dataset.hoverListener
  ) {

    installButton.addEventListener(
      "mouseenter",
      () => {

        installButton.style.transform =
          "translateY(-2px)";

      }
    );


    installButton.addEventListener(
      "mouseleave",
      () => {

        installButton.style.transform =
          "translateY(0)";

      }
    );


    installButton.dataset.hoverListener =
      "true";

  }

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    createInstallButton,
    {
      once: true
    }
  );

} else {

  createInstallButton();

}


/* =========================================================
   BEFORE INSTALL PROMPT
========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  (event) => {

    event.preventDefault();

    deferredInstallPrompt =
      event;


    console.log(
      "PWA install prompt is ready."
    );


    createInstallButton();

  }
);


/* =========================================================
   INSTALL APP
========================================================= */

async function installApp() {

  if (!deferredInstallPrompt) {

    showToast(
      "Install option अभी browser से available नहीं है। Chrome में थोड़ी देर बाद फिर Install App दबाएँ।"
    );

    return;

  }


  try {

    deferredInstallPrompt.prompt();


    const choice =
      await deferredInstallPrompt.userChoice;


    console.log(
      "Install choice:",
      choice.outcome
    );


    if (
      choice.outcome ===
      "accepted"
    ) {

      showToast(
        "App install हो रहा है..."
      );

    }


  } catch (error) {

    console.error(
      "PWA install error:",
      error
    );

  } finally {

    deferredInstallPrompt =
      null;

  }

}


/* =========================================================
   APP INSTALLED
========================================================= */

window.addEventListener(
  "appinstalled",
  () => {

    console.log(
      "PWA successfully installed."
    );


    deferredInstallPrompt =
      null;


    if (installButton) {

      installButton.style.display =
        "none";

    }


    showToast(
      "माँ मनोकामना App successfully install हो गया।"
    );

  }
);


/* =========================================================
   CHECK IF APP IS ALREADY INSTALLED
========================================================= */

function checkIfAppIsInstalled() {

  if (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches
  ) {

    return true;

  }


  if (
    window.navigator.standalone === true
  ) {

    return true;

  }


  return false;

}


if (
  checkIfAppIsInstalled()
) {

  if (installButton) {

    installButton.style.display =
      "none";

  }

}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function initializeTempleApp() {

  console.log(
    "🙏 माँ मनोकामना Temple App initializing..."
  );


  await loadTempleSettings();

  await loadSchedule();

  await loadGallery();


  listenToTempleSettings();

  listenToSchedule();

  listenToGallery();


  console.log(
    "🙏 माँ मनोकामना Temple App ready."
  );

}


/* =========================================================
   START APP
========================================================= */

initializeTempleApp();
