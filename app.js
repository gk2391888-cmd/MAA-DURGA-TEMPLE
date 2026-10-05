/* =========================================================
   MAA MANOKAMANA TEMPLE
   PUBLIC WEBSITE APP.JS
   FINAL COMPLETE VERSION
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import firebaseConfig from "./firebase-config.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase initialized");
console.log("🔥 Firebase project:", firebaseConfig?.projectId);


/* =========================================================
   GLOBAL SETTINGS
   ========================================================= */

let templeSettings = {
  upiId: "",
  aartiTime: "",
  liveUrl: "",
  qrUrl: "",
  contactNumber: ""
};

let deferredInstallPrompt = null;
let installButton = null;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value).trim();
}

function cleanUrl(url) {
  if (!url) return "";

  let value = String(url).trim();

  if (value.startsWith("http://res.cloudinary.com/")) {
    value = value.replace(
      "http://res.cloudinary.com/",
      "https://res.cloudinary.com/"
    );
  }

  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "info") {

  let toast = document.getElementById("appToast");

  if (!toast) {

    toast = document.createElement("div");
    toast.id = "appToast";

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:24px;
      transform:translateX(-50%);
      z-index:99999;
      max-width:90%;
      padding:13px 18px;
      border-radius:14px;
      background:#7f1111;
      color:#fff;
      font-size:14px;
      font-weight:700;
      text-align:center;
      box-shadow:0 10px 30px rgba(0,0,0,.22);
      opacity:0;
      pointer-events:none;
      transition:.25s ease;
    `;

    document.body.appendChild(toast);
  }

  if (type === "success") {
    toast.style.background = "#166534";
  } else if (type === "error") {
    toast.style.background = "#991b1b";
  } else {
    toast.style.background = "#7f1111";
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform =
    "translateX(-50%) translateY(0)";

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {

    toast.style.opacity = "0";

    toast.style.transform =
      "translateX(-50%) translateY(10px)";

  }, 3200);
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initMobileMenu() {

  const menuBtn =
    $("#menuBtn") ||
    $("#mobileMenuBtn") ||
    document.querySelector(".menu-btn") ||
    document.querySelector(".hamburger");

  const nav =
    $("#mainNav") ||
    $("#navMenu") ||
    document.querySelector(".nav-menu") ||
    document.querySelector("nav");

  if (!menuBtn || !nav) return;

  menuBtn.addEventListener("click", () => {

    nav.classList.toggle("active");
    menuBtn.classList.toggle("active");

    const expanded =
      menuBtn.getAttribute("aria-expanded") === "true";

    menuBtn.setAttribute(
      "aria-expanded",
      expanded ? "false" : "true"
    );
  });

  nav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

      nav.classList.remove("active");
      menuBtn.classList.remove("active");

      menuBtn.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });
}


/* =========================================================
   TEMPLE SETTINGS
   ========================================================= */

async function loadTempleSettings() {

  try {

    const settingsRef =
      doc(db, "temple", "settings");

    const snapshot =
      await getDoc(settingsRef);

    if (!snapshot.exists()) {

      console.warn(
        "⚠️ temple/settings document not found"
      );

      applyTempleSettings();
      return;
    }

    const data = snapshot.data();

    console.log(
      "✅ temple/settings:",
      data
    );

    templeSettings = {
      ...templeSettings,
      ...data
    };

    applyTempleSettings();

  } catch (error) {

    console.error(
      "❌ Settings loading error:",
      error
    );

    applyTempleSettings();
  }
}


/* =========================================================
   REALTIME SETTINGS
   ========================================================= */

function listenTempleSettings() {

  const settingsRef =
    doc(db, "temple", "settings");

  onSnapshot(
    settingsRef,

    snapshot => {

      if (!snapshot.exists()) {
        console.warn(
          "⚠️ temple/settings does not exist"
        );
        return;
      }

      const data =
        snapshot.data();

      console.log(
        "🔄 Settings updated:",
        data
      );

      templeSettings = {
        ...templeSettings,
        ...data
      };

      applyTempleSettings();

    },

    error => {

      console.error(
        "❌ Settings realtime error:",
        error
      );

    }
  );
}


/* =========================================================
   APPLY ALL TEMPLE SETTINGS
   ========================================================= */

function applyTempleSettings() {

  const aartiTime =
    safeText(
      templeSettings.aartiTime,
      "समय जल्द अपडेट होगा"
    );

  const upiId =
    safeText(
      templeSettings.upiId
    );

  const contactNumber =
    safeText(
      templeSettings.contactNumber
    );

  const liveUrl =
    cleanUrl(
      templeSettings.liveUrl
    );

  const qrUrl =
    cleanUrl(
      templeSettings.qrUrl
    );


  console.log("🎨 Applying settings:", {
    aartiTime,
    upiId,
    contactNumber,
    liveUrl,
    qrUrl
  });


  /* =======================================================
     AARTI TIME
     ======================================================= */

  const aartiElements = [
    ...Array.from($$(
      "#aartiTime"
    )),
    ...Array.from($$(
      "#todayAartiTime"
    )),
    ...Array.from($$(
      "#liveAartiTime"
    )),
    ...Array.from($$(
      "[data-aarti-time]"
    ))
  ];

  aartiElements.forEach(element => {
    element.textContent = aartiTime;
  });


  /* =======================================================
     UPI ID
     ======================================================= */

  const upiElements = [
    ...Array.from($$(
      "#upiId"
    )),
    ...Array.from($$(
      "[data-upi-id]"
    )),
    ...Array.from($$(
      ".upi-id"
    ))
  ];

  upiElements.forEach(element => {

    element.textContent =
      upiId ||
      "UPI ID जल्द अपडेट होगा";

  });


  /* =======================================================
     UPI COPY BUTTON
     ======================================================= */

  const copyButtons = [
    ...Array.from($$(
      "#copyUpiBtn"
    )),
    ...Array.from($$(
      "[data-copy-upi]"
    ))
  ];

  copyButtons.forEach(button => {

    button.onclick = async () => {

      if (!upiId) {

        showToast(
          "UPI ID अभी उपलब्ध नहीं है।",
          "error"
        );

        return;
      }

      try {

        await navigator.clipboard.writeText(
          upiId
        );

        showToast(
          "UPI ID copy हो गई।",
          "success"
        );

      } catch (error) {

        showToast(
          "UPI ID copy नहीं हो पाई।",
          "error"
        );

      }

    };

  });


  /* =======================================================
     CONTACT
     ======================================================= */

  renderContactNumber(
    contactNumber
  );


  /* =======================================================
     QR
     ======================================================= */

  renderQR(
    qrUrl
  );


  /* =======================================================
     LIVE
     ======================================================= */

  renderLiveVideo(
    liveUrl
  );
}


/* =========================================================
   CONTACT NUMBER
   ========================================================= */

function renderContactNumber(number) {

  const cleanNumber =
    safeText(number);

  const selectors = [
    "#contactPhone",
    "[data-contact-phone]",
    ".contact-phone"
  ];

  selectors.forEach(selector => {

    $$(selector).forEach(element => {

      if (!cleanNumber) {

        element.textContent =
          "संपर्क नंबर जल्द अपडेट होगा।";

        if (element.tagName === "A") {
          element.removeAttribute("href");
        }

        return;
      }

      element.textContent =
        cleanNumber;

      if (element.tagName === "A") {

        const digits =
          cleanNumber.replace(/[^\d+]/g, "");

        if (digits) {

          element.href =
            `tel:${digits}`;

        }

      }

    });

  });


  /* Contact buttons */

  const contactButtons = [
    ...Array.from($$(
      "#callBtn"
    )),
    ...Array.from($$(
      "[data-call]"
    ))
  ];

  contactButtons.forEach(button => {

    if (!cleanNumber) {
      button.style.display = "";
      button.removeAttribute("href");
      return;
    }

    const digits =
      cleanNumber.replace(/[^\d+]/g, "");

    if (button.tagName === "A") {
      button.href =
        `tel:${digits}`;
    }

    button.onclick = () => {

      if (digits) {
        window.location.href =
          `tel:${digits}`;
      }

    };

  });
}


/* =========================================================
   QR CODE
   ========================================================= */

function renderQR(url) {

  const qrUrl =
    cleanUrl(url);

  console.log(
    "🧾 QR:",
    qrUrl
  );


  /* -------------------------------------------------------
     Existing QR image
     ------------------------------------------------------- */

  const qrImages = [
    ...Array.from($$(
      "#qrImage"
    )),
    ...Array.from($$(
      "[data-qr-image]"
    )),
    ...Array.from($$(
      ".qr-image"
    ))
  ];


  qrImages.forEach(img => {

    if (!qrUrl) {

      img.removeAttribute("src");
      img.style.display = "none";

      return;
    }

    img.src = qrUrl;
    img.style.display = "block";

    img.onerror = () => {

      console.error(
        "❌ QR image failed:",
        qrUrl
      );

      img.style.display = "none";
    };

  });


  /* -------------------------------------------------------
     QR container
     ------------------------------------------------------- */

  const qrContainers = [
    ...Array.from($$(
      "#qrContainer"
    )),
    ...Array.from($$(
      "[data-qr-container]"
    )),
    ...Array.from($$(
      ".qr-container"
    ))
  ];


  qrContainers.forEach(container => {

    if (!qrUrl) {

      container.innerHTML = `
        <div style="
          padding:20px;
          text-align:center;
          color:#777;
        ">
          QR Code जल्द अपडेट होगा।
        </div>
      `;

      return;
    }


    container.innerHTML = `
      <div style="
        text-align:center;
      ">

        <img
          src="${escapeHtml(qrUrl)}"
          alt="Donation QR Code"
          style="
            width:min(280px,100%);
            height:auto;
            display:block;
            margin:0 auto;
            border-radius:16px;
            background:#fff;
          "
        >

        <div style="
          margin-top:10px;
          font-size:12px;
          color:#777;
        ">
          Scan करके Donation करें
        </div>

      </div>
    `;

  });
}


/* =========================================================
   YOUTUBE URL
   ========================================================= */

function getYouTubeEmbedUrl(url) {

  if (!url) return "";

  try {

    const parsed =
      new URL(url);

    const hostname =
      parsed.hostname.toLowerCase();


    if (
      hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    ) {

      const id =
        parsed.pathname
          .split("/embed/")[1]
          ?.split("/")[0];

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }


    if (
      hostname.includes("youtube.com") &&
      parsed.pathname === "/watch"
    ) {

      const id =
        parsed.searchParams.get("v");

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }


    if (
      hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/live/")
    ) {

      const id =
        parsed.pathname
          .split("/live/")[1]
          ?.split("/")[0];

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }


    if (
      hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/shorts/")
    ) {

      const id =
        parsed.pathname
          .split("/shorts/")[1]
          ?.split("/")[0];

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }


    if (
      hostname === "youtu.be"
    ) {

      const id =
        parsed.pathname
          .replace(/^\/+/, "")
          .split("/")[0];

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

  } catch (error) {

    console.warn(
      "Invalid YouTube URL:",
      url
    );

  }

  return "";
}


/* =========================================================
   LIVE VIDEO
   ========================================================= */

function renderLiveVideo(url) {

  const containers = [
    ...Array.from($$(
      "#liveVideo"
    )),
    ...Array.from($$(
      "[data-live-video]"
    ))
  ];

  if (!containers.length) {
    return;
  }

  const cleanLiveUrl =
    cleanUrl(url);

  const embedUrl =
    getYouTubeEmbedUrl(
      cleanLiveUrl
    );


  containers.forEach(container => {

    if (!cleanLiveUrl) {

      container.innerHTML = `
        <div style="
          min-height:220px;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          padding:30px;
          border-radius:18px;
          background:#fff8ed;
          color:#7f1111;
          font-weight:700;
        ">
          🔴 Live Aarti link जल्द अपडेट होगा।
        </div>
      `;

      return;
    }


    if (!embedUrl) {

      container.innerHTML = `
        <div style="
          padding:25px;
          text-align:center;
          border-radius:18px;
          background:#fff8ed;
        ">

          <div style="
            font-size:30px;
            margin-bottom:10px;
          ">
            🔴
          </div>

          <strong>
            Live Aarti
          </strong>

          <p style="
            color:#666;
            margin:10px 0;
          ">
            Live देखने के लिए नीचे button दबाएँ।
          </p>

          <a
            href="${escapeHtml(cleanLiveUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display:inline-block;
              padding:11px 18px;
              border-radius:12px;
              background:#7f1111;
              color:#fff;
              text-decoration:none;
              font-weight:700;
            "
          >
            ▶️ Live देखें
          </a>

        </div>
      `;

      return;
    }


    container.innerHTML = `
      <div style="
        position:relative;
        width:100%;
        aspect-ratio:16/9;
        overflow:hidden;
        border-radius:18px;
        background:#000;
      ">

        <iframe
          src="${escapeHtml(embedUrl)}"
          title="माँ मनोकामना मंदिर Live Aarti"
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

  });
}


/* =========================================================
   GALLERY
   ========================================================= */

function renderGallery(snapshot) {

  const grids = [
    ...Array.from($$(
      "#galleryGrid"
    )),
    ...Array.from($$(
      "[data-gallery]"
    ))
  ];

  if (!grids.length) {
    return;
  }


  const items = [];


  snapshot.forEach(docSnap => {

    const data =
      docSnap.data();

    const rawImageUrl =
      data.secure_url ||
      data.secureUrl ||
      data.imageUrl ||
      data.url ||
      data.photoUrl ||
      data.image ||
      "";

    const imageUrl =
      cleanUrl(rawImageUrl);

    if (!imageUrl) {
      return;
    }

    items.push({

      id:
        docSnap.id,

      imageUrl,

      title:
        safeText(
          data.title,
          "माँ मनोकामना मंदिर"
        ),

      category:
        safeText(
          data.category,
          "मंदिर"
        ),

      createdAt:
        data.createdAt?.toMillis?.() ||
        0

    });

  });


  items.sort(
    (a, b) =>
      b.createdAt -
      a.createdAt
  );


  grids.forEach(grid => {

    if (!items.length) {

      grid.innerHTML = `
        <div style="
          grid-column:1/-1;
          padding:35px 20px;
          text-align:center;
          color:#777;
        ">
          अभी कोई फोटो उपलब्ध नहीं है।
        </div>
      `;

      return;
    }


    grid.innerHTML =
      items.map(item => `

        <article
          class="gallery-item"
          style="
            overflow:hidden;
            border-radius:18px;
            background:#fff;
            box-shadow:0 8px 25px rgba(0,0,0,.08);
          "
        >

          <div style="
            width:100%;
            aspect-ratio:4/3;
            overflow:hidden;
            background:#f5f5f5;
          ">

            <img
              src="${escapeHtml(item.imageUrl)}"
              alt="${escapeHtml(item.title)}"
              loading="lazy"
              style="
                width:100%;
                height:100%;
                object-fit:cover;
                display:block;
              "
            >

          </div>

          <div style="padding:14px;">

            <div style="
              font-size:12px;
              color:#9a5b00;
              font-weight:800;
              margin-bottom:5px;
            ">
              ${escapeHtml(item.category)}
            </div>

            <div style="
              font-weight:800;
              color:#40100d;
            ">
              ${escapeHtml(item.title)}
            </div>

          </div>

        </article>

      `).join("");

  });
}


/* =========================================================
   GALLERY REALTIME
   ========================================================= */

function listenGallery() {

  const galleryRef =
    collection(db, "gallery");

  onSnapshot(
    galleryRef,

    snapshot => {

      console.log(
        "📸 Gallery:",
        snapshot.size
      );

      renderGallery(snapshot);

    },

    error => {

      console.error(
        "❌ Gallery error:",
        error
      );

    }
  );
}


async function loadGallery() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "gallery")
      );

    renderGallery(snapshot);

  } catch (error) {

    console.error(
      "❌ Gallery initial error:",
      error
    );

  }
}


/* =========================================================
   SCHEDULE / CALENDAR
   ========================================================= */

function renderSchedule(snapshot) {

  const containers = [
    ...Array.from($$(
      "#scheduleList"
    )),
    ...Array.from($$(
      "[data-schedule]"
    )),
    ...Array.from($$(
      ".schedule-list"
    ))
  ];

  if (!containers.length) {
    console.warn(
      "⚠️ Schedule container not found"
    );
    return;
  }


  const items = [];


  snapshot.forEach(docSnap => {

    const data =
      docSnap.data();

    items.push({

      id:
        docSnap.id,

      date:
        safeText(data.date),

      day:
        safeText(data.day),

      month:
        safeText(data.month),

      time:
        safeText(
          data.time,
          "समय जल्द अपडेट होगा"
        ),

      title:
        safeText(
          data.title,
          "धार्मिक कार्यक्रम"
        ),

      description:
        safeText(
          data.description
        ),

      createdAt:
        data.createdAt?.toMillis?.() ||
        0

    });

  });


  /* -------------------------------------------------------
     DATE SORT
     ------------------------------------------------------- */

  items.sort((a, b) => {

    if (a.date && b.date) {

      const da =
        new Date(a.date);

      const dbDate =
        new Date(b.date);

      if (
        !isNaN(da.getTime()) &&
        !isNaN(dbDate.getTime())
      ) {

        return da - dbDate;

      }

      return a.date.localeCompare(
        b.date
      );
    }

    return (
      b.createdAt -
      a.createdAt
    );

  });


  containers.forEach(container => {

    if (!items.length) {

      container.innerHTML = `
        <div style="
          padding:25px;
          text-align:center;
          color:#777;
        ">
          अभी कोई कार्यक्रम उपलब्ध नहीं है।
        </div>
      `;

      return;
    }


    container.innerHTML =
      items.map(item => `

        <div
          class="schedule-item"
          data-schedule-id="${escapeHtml(item.id)}"
          style="
            display:flex;
            gap:15px;
            padding:16px;
            margin-bottom:12px;
            border-radius:16px;
            background:#fff;
            box-shadow:0 5px 18px rgba(0,0,0,.06);
          "
        >

          <div style="
            min-width:58px;
            text-align:center;
            padding:8px;
            border-radius:12px;
            background:#fff1d6;
            color:#7f1111;
            font-weight:800;
          ">

            <div>
              ${escapeHtml(item.day)}
            </div>

            <small>
              ${escapeHtml(item.month)}
            </small>

          </div>


          <div style="flex:1;">

            <div style="
              font-weight:800;
              color:#40100d;
              margin-bottom:5px;
            ">
              ${escapeHtml(item.title)}
            </div>

            <div style="
              font-size:13px;
              color:#8a5a00;
              font-weight:700;
              margin-bottom:5px;
            ">
              🕐 ${escapeHtml(item.time)}
            </div>

            ${
              item.description
                ? `
                  <div style="
                    font-size:13px;
                    color:#666;
                    line-height:1.5;
                  ">
                    ${escapeHtml(item.description)}
                  </div>
                `
                : ""
            }

          </div>

        </div>

      `).join("");

  });
}


/* =========================================================
   SCHEDULE REALTIME
   ========================================================= */

function listenSchedule() {

  const scheduleRef =
    collection(db, "schedule");

  onSnapshot(
    scheduleRef,

    snapshot => {

      console.log(
        "📅 Schedule:",
        snapshot.size
      );

      renderSchedule(snapshot);

    },

    error => {

      console.error(
        "❌ Schedule error:",
        error
      );

    }
  );
}


async function loadSchedule() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "schedule")
      );

    renderSchedule(snapshot);

  } catch (error) {

    console.error(
      "❌ Schedule initial error:",
      error
    );

  }
}


/* =========================================================
   GOOGLE MAP
   ========================================================= */

function initMapLinks() {

  const mapLinks =
    $$("[data-map-link], #mapLink");

  mapLinks.forEach(link => {

    if (link.tagName !== "A") {
      return;
    }

    if (!link.href.includes("google")) {

      link.href =
        "https://www.google.com/maps/search/?api=1&query=श्री+श्री+108+माँ+मनोकामना+छोटी+दुर्गा+पूजा+समिति+चकशिवगंज+मौलानगर+सूर्यगढ़ा";

      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

  });
}


/* =========================================================
   LANGUAGE
   ========================================================= */

function initLanguageToggle() {

  const buttons =
    $$("#languageToggle, [data-language-toggle]");

  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const current =
          document.documentElement.lang || "hi";

        if (current === "hi") {

          document.documentElement.lang = "en";
          button.textContent = "हिंदी";

        } else {

          document.documentElement.lang = "hi";
          button.textContent = "English";

        }

      }
    );

  });
}


/* =========================================================
   DONATION MODAL
   ========================================================= */

function initDonationModal() {

  const modal =
    $("#donationModal");

  if (!modal) return;

  $$(
    "#donateBtn, [data-open-donation]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        modal.style.display = "flex";
        document.body.style.overflow = "hidden";

      }
    );

  });


  $$(
    "#closeDonationModal, [data-close-donation]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        modal.style.display = "none";
        document.body.style.overflow = "";

      }
    );

  });


  modal.addEventListener(
    "click",
    event => {

      if (event.target === modal) {

        modal.style.display = "none";
        document.body.style.overflow = "";

      }

    }
  );
}


/* =========================================================
   RECEIPT
   ========================================================= */

function generateReceiptNumber() {

  const now = new Date();

  const year =
    now.getFullYear();

  const time =
    Date.now()
      .toString()
      .slice(-8);

  const random =
    Math.floor(
      100 +
      Math.random() * 900
    );

  return `DPG-${year}-${time}${random}`;
}


function formatReceiptDate(
  date = new Date()
) {

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }
  );
}


function receiptEscape(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   DONATION FORM
   ========================================================= */

function initDonationForm() {

  const form =
    $("#donationForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const donorName =
        safeText(
          form.querySelector(
            "#donorName, [name='donorName']"
          )?.value
        );


      const amount =
        Number(
          form.querySelector(
            "#donationAmount, [name='amount']"
          )?.value
        );


      const purpose =
        safeText(
          form.querySelector(
            "#donationPurpose, [name='purpose']"
          )?.value,
          "मंदिर सहयोग"
        );


      const utr =
        safeText(
          form.querySelector(
            "#utrNumber, [name='utr']"
          )?.value
        );


      if (!donorName) {

        showToast(
          "कृपया अपना नाम डालें।",
          "error"
        );

        return;
      }


      if (!amount || amount <= 0) {

        showToast(
          "कृपया सही donation amount डालें।",
          "error"
        );

        return;
      }


      if (!utr) {

        showToast(
          "कृपया UTR / Transaction Number डालें।",
          "error"
        );

        return;
      }


      const submitButton =
        form.querySelector(
          "button[type='submit']"
        );

      if (submitButton) {
        submitButton.disabled = true;
      }


      try {

        const receiptNumber =
          generateReceiptNumber();


        const donationData = {

          donorName,
          amount,
          purpose,
          utr,
          receiptNumber,
          status: "pending",
          createdAt: serverTimestamp()

        };


        await addDoc(
          collection(db, "donations"),
          donationData
        );


        showDonationReceipt({

          ...donationData,

          createdAt: new Date()

        });


        form.reset();


      } catch (error) {

        console.error(
          "❌ Donation error:",
          error
        );

        showToast(
          "Donation submit नहीं हो पाई।",
          "error"
        );

      } finally {

        if (submitButton) {
          submitButton.disabled = false;
        }

      }

    }
  );
}


/* =========================================================
   DONATION RECEIPT
   ========================================================= */

function showDonationReceipt(data) {

  const oldModal =
    document.getElementById(
      "donationReceiptModal"
    );

  if (oldModal) {
    oldModal.remove();
  }


  const modal =
    document.createElement("div");

  modal.id =
    "donationReceiptModal";


  modal.innerHTML = `

    <div style="
      position:fixed;
      inset:0;
      z-index:100000;
      background:rgba(0,0,0,.65);
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
    ">

      <div style="
        width:min(520px,100%);
        max-height:90vh;
        overflow:auto;
        background:white;
        border-radius:22px;
        padding:24px;
      ">

        <div style="
          text-align:center;
          color:#7f1111;
        ">

          <div style="font-size:30px;">
            🛕
          </div>

          <h2 style="margin:5px 0;">
            श्री श्री 108 माँ मनोकामना
          </h2>

          <div>
            छोटी दुर्गा पूजा समिति
          </div>

          <div style="
            font-size:12px;
            color:#777;
            margin-top:4px;
          ">
            चकशिवगंज, मौलानगर, सूर्यगढ़ा (लखीसराय)
          </div>

        </div>


        <hr style="
          margin:18px 0;
          border:0;
          border-top:1px solid #eee;
        ">


        <div style="
          text-align:center;
          color:#166534;
          font-weight:800;
          margin-bottom:15px;
        ">
          ✓ Donation Submitted
        </div>


        <div style="
          background:#fff8ed;
          border-radius:15px;
          padding:15px;
        ">

          <p>
            <strong>Receipt No.:</strong>
            ${receiptEscape(data.receiptNumber)}
          </p>

          <p>
            <strong>नाम:</strong>
            ${receiptEscape(data.donorName)}
          </p>

          <p>
            <strong>Amount:</strong>
            ₹${receiptEscape(data.amount)}
          </p>

          <p>
            <strong>Purpose:</strong>
            ${receiptEscape(data.purpose)}
          </p>

          <p>
            <strong>UTR:</strong>
            ${receiptEscape(data.utr)}
          </p>

          <p>
            <strong>Date:</strong>
            ${receiptEscape(
              formatReceiptDate(
                data.createdAt instanceof Date
                  ? data.createdAt
                  : new Date()
              )
            )}
          </p>

        </div>


        <p style="
          text-align:center;
          color:#777;
          font-size:12px;
          line-height:1.6;
        ">
          धन्यवाद। यह donation acknowledgement receipt है।
          अंतिम verification समिति द्वारा की जाएगी।
        </p>


        <div style="
          display:flex;
          gap:10px;
        ">

          <button
            type="button"
            id="printReceiptBtn"
            style="
              flex:1;
              border:0;
              border-radius:12px;
              padding:12px;
              background:#7f1111;
              color:white;
              font-weight:800;
              cursor:pointer;
            "
          >
            🖨️ Print / Save PDF
          </button>

          <button
            type="button"
            id="closeReceiptBtn"
            style="
              flex:1;
              border:1px solid #ddd;
              border-radius:12px;
              padding:12px;
              background:white;
              font-weight:800;
              cursor:pointer;
            "
          >
            बंद करें
          </button>

        </div>

      </div>

    </div>

  `;


  document.body.appendChild(modal);


  $("#printReceiptBtn")
    ?.addEventListener(
      "click",
      () => printDonationReceipt(data)
    );


  $("#closeReceiptBtn")
    ?.addEventListener(
      "click",
      () => modal.remove()
    );
}


/* =========================================================
   PRINT RECEIPT
   ========================================================= */

function printDonationReceipt(data) {

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=700,height=800"
    );

  if (!printWindow) {

    showToast(
      "Popup blocked है। Browser में popup allow करें।",
      "error"
    );

    return;
  }


  printWindow.document.write(`

    <!DOCTYPE html>

    <html lang="hi">

    <head>

      <meta charset="UTF-8">

      <title>Donation Receipt</title>

      <style>

        * {
          box-sizing:border-box;
        }

        body {
          margin:0;
          padding:30px;
          font-family:Arial,sans-serif;
        }

        .receipt {
          max-width:650px;
          margin:auto;
          border:2px solid #7f1111;
          border-radius:18px;
          padding:25px;
        }

        h1 {
          color:#7f1111;
          text-align:center;
        }

        .sub {
          text-align:center;
          color:#666;
        }

        .success {
          text-align:center;
          color:#166534;
          font-weight:800;
          margin:20px 0;
        }

        table {
          width:100%;
          border-collapse:collapse;
        }

        td {
          padding:11px 5px;
          border-bottom:1px solid #eee;
        }

        td:first-child {
          font-weight:700;
          width:40%;
        }

        .note {
          margin-top:20px;
          color:#666;
          font-size:12px;
          text-align:center;
        }

        @media print {
          body {
            padding:0;
          }
        }

      </style>

    </head>

    <body>

      <div class="receipt">

        <h1>
          श्री श्री 108 माँ मनोकामना
        </h1>

        <div class="sub">
          छोटी दुर्गा पूजा समिति
        </div>

        <div class="sub">
          चकशिवगंज, मौलानगर, सूर्यगढ़ा (लखीसराय)
        </div>

        <div class="success">
          ✓ Donation Submitted
        </div>

        <table>

          <tr>
            <td>Receipt No.</td>
            <td>${receiptEscape(data.receiptNumber)}</td>
          </tr>

          <tr>
            <td>Donor Name</td>
            <td>${receiptEscape(data.donorName)}</td>
          </tr>

          <tr>
            <td>Amount</td>
            <td>₹${receiptEscape(data.amount)}</td>
          </tr>

          <tr>
            <td>Purpose</td>
            <td>${receiptEscape(data.purpose)}</td>
          </tr>

          <tr>
            <td>UTR</td>
            <td>${receiptEscape(data.utr)}</td>
          </tr>

          <tr>
            <td>Date</td>
            <td>
              ${receiptEscape(
                formatReceiptDate(
                  data.createdAt instanceof Date
                    ? data.createdAt
                    : new Date()
                )
              )}
            </td>
          </tr>

        </table>

        <div class="note">
          धन्यवाद। यह donation acknowledgement receipt है।
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
   PWA INSTALL
   ========================================================= */

function createInstallButton() {

  if (installButton) return;

  installButton =
    document.getElementById(
      "installAppBtn"
    );


  if (!installButton) {

    installButton =
      document.createElement("button");

    installButton.id =
      "installAppBtn";

    installButton.type =
      "button";

    installButton.textContent =
      "📱 App Install करें";

    installButton.style.cssText = `
      position:fixed;
      right:18px;
      bottom:18px;
      z-index:99990;
      border:0;
      border-radius:14px;
      padding:13px 18px;
      background:#7f1111;
      color:#fff;
      font-weight:800;
      font-size:14px;
      box-shadow:0 10px 30px rgba(0,0,0,.22);
      cursor:pointer;
    `;

    document.body.appendChild(
      installButton
    );
  }


  installButton.style.display =
    "inline-flex";


  installButton.onclick =
    installApp;
}


async function installApp() {

  if (deferredInstallPrompt) {

    deferredInstallPrompt.prompt();

    const result =
      await deferredInstallPrompt.userChoice;

    console.log(
      "📱 Install result:",
      result.outcome
    );

    deferredInstallPrompt = null;

    return;
  }

  showToast(
    "Chrome menu में Install app देखें।",
    "info"
  );
}


window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstallPrompt =
      event;

    if (!installButton) {
      createInstallButton();
    }

  }
);


window.addEventListener(
  "appinstalled",
  () => {

    deferredInstallPrompt = null;

    if (installButton) {
      installButton.style.display = "none";
    }

    showToast(
      "App successfully install हो गया ❤️",
      "success"
    );

  }
);


function checkIfAppIsInstalled() {

  const standalone =
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

  const iosStandalone =
    window.navigator.standalone === true;

  if (standalone || iosStandalone) {

    if (installButton) {
      installButton.style.display = "none";
    }

    return true;
  }

  return false;
}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

function registerServiceWorker() {

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener(
    "load",
    async () => {

      try {

        const registration =
          await navigator.serviceWorker.register(
            "./sw.js",
            {
              scope: "./"
            }
          );

        console.log(
          "✅ Service Worker:",
          registration.scope
        );

      } catch (error) {

        console.error(
          "❌ Service Worker:",
          error
        );

      }

    }
  );
}


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "🚀 MAA MANOKAMANA TEMPLE APP STARTING"
    );

    console.log(
      "Firebase:",
      firebaseConfig?.projectId
    );


    /* Basic */

    initMobileMenu();
    initLanguageToggle();
    initMapLinks();


    /* Donation */

    initDonationModal();
    initDonationForm();


    /* PWA */

    createInstallButton();
    checkIfAppIsInstalled();


    /* Temple settings */

    await loadTempleSettings();
    listenTempleSettings();


    /* Gallery */

    await loadGallery();
    listenGallery();


    /* Schedule / Calendar */

    await loadSchedule();
    listenSchedule();


    /* Service Worker */

    registerServiceWorker();


    console.log(
      "✅ MAA MANOKAMANA TEMPLE APP READY"
    );

  }
);
