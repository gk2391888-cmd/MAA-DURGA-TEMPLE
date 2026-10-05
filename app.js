/* =========================================================
   MAA MANOKAMANA TEMPLE
   PUBLIC WEBSITE APP.JS
   UPDATED FINAL VERSION
   DATE-BY-DATE CALENDAR
   DONATION SYSTEM REMOVED
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  onSnapshot
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
  aartiTime: "",
  liveUrl: "",
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
      z-index:100001;
      width:max-content;
      max-width:calc(100% - 30px);
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
    $("#mobileNav") ||
    $("#mainNav") ||
    $("#navMenu") ||
    document.querySelector(".nav-menu");

  if (!menuBtn || !nav) {
    console.warn("⚠️ Mobile menu elements not found");
    return;
  }

  menuBtn.setAttribute("aria-expanded", "false");

  menuBtn.addEventListener("click", () => {

    const isActive =
      nav.classList.toggle("active");

    menuBtn.classList.toggle(
      "active",
      isActive
    );

    menuBtn.setAttribute(
      "aria-expanded",
      isActive ? "true" : "false"
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
   APPLY TEMPLE SETTINGS
========================================================= */

function applyTempleSettings() {

  const aartiTime =
    safeText(
      templeSettings.aartiTime,
      "समय जल्द अपडेट होगा"
    );

  const contactNumber =
    safeText(
      templeSettings.contactNumber
    );

  const liveUrl =
    cleanUrl(
      templeSettings.liveUrl
    );


  console.log("🎨 Applying settings:", {
    aartiTime,
    contactNumber,
    liveUrl
  });


  /* =======================================================
     AARTI TIME
  ======================================================= */

  const aartiElements = [
    ...Array.from($$("#aartiTime")),
    ...Array.from($$("#todayAartiTime")),
    ...Array.from($$("#liveAartiTime")),
    ...Array.from($$("[data-aarti-time]"))
  ];

  aartiElements.forEach(element => {
    element.textContent = aartiTime;
  });


  /* =======================================================
     CONTACT
  ======================================================= */

  renderContactNumber(
    contactNumber
  );


  /* =======================================================
     LIVE
  ======================================================= */

  renderLiveVideo(
    liveUrl
  );


  /* =======================================================
     LIVE LINK
  ======================================================= */

  const liveLinks = [
    ...Array.from($$("#liveLink")),
    ...Array.from($$("[data-live-link]"))
  ];

  liveLinks.forEach(link => {

    if (!liveUrl) {

      link.style.display = "";

      if (link.tagName === "A") {
        link.removeAttribute("href");
      }

      return;
    }

    if (link.tagName === "A") {

      link.href = liveUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

    }

  });

}


/* =========================================================
   CONTACT NUMBER
========================================================= */

function renderContactNumber(number) {

  const cleanNumber =
    safeText(number);

  const selectors = [
    "#contactNumber",
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


  /* =======================================================
     CALL BUTTON
  ======================================================= */

  const contactButtons = [
    ...Array.from($$("#callBtn")),
    ...Array.from($$("[data-call]"))
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

    button.onclick = event => {

      if (button.tagName !== "A") {
        event.preventDefault();
      }

      if (digits) {

        window.location.href =
          `tel:${digits}`;

      }

    };

  });

}


/* =========================================================
   YOUTUBE EMBED URL
========================================================= */

function getYouTubeEmbedUrl(url) {

  if (!url) return "";

  try {

    const parsed =
      new URL(url);

    const hostname =
      parsed.hostname.toLowerCase();


    /* youtube.com/embed/ */

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


    /* youtube.com/watch?v= */

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


    /* youtube.com/live/ */

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


    /* youtube.com/shorts/ */

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


    /* youtu.be */

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
      "⚠️ Invalid YouTube URL:",
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
    ...Array.from($$("#liveVideo")),
    ...Array.from($$("[data-live-video]"))
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
        <div class="live-placeholder">

          <div class="live-icon">
            🔴
          </div>

          <h3>
            LIVE दर्शन
          </h3>

          <p>
            लाइव लिंक उपलब्ध होने पर यहाँ दर्शन दिखाई देंगे।
          </p>

        </div>
      `;

      return;
    }


    if (!embedUrl) {

      container.innerHTML = `
        <div style="
          min-height:245px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
          padding:25px;
          border-radius:18px;
          background:#fff8ed;
        ">

          <div style="
            font-size:32px;
            margin-bottom:8px;
          ">
            🔴
          </div>

          <strong style="
            color:#7f1111;
            font-size:18px;
          ">
            Live Aarti
          </strong>

          <p style="
            color:#666;
            margin:8px 0 15px;
          ">
            Live देखने के लिए नीचे button दबाएँ।
          </p>

          <a
            href="${escapeHtml(cleanLiveUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn"
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
    ...Array.from($$("#galleryGrid")),
    ...Array.from($$("[data-gallery]"))
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
        <div class="gallery-loading">
          अभी कोई फोटो उपलब्ध नहीं है।
        </div>
      `;

      return;
    }


    grid.innerHTML =
      items.map(item => `

        <article
          class="gallery-item"
          data-gallery-image="${escapeHtml(item.imageUrl)}"
          data-gallery-title="${escapeHtml(item.title)}"
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


    initGalleryItems(grid);

  });

}


/* =========================================================
   GALLERY ITEM CLICK
========================================================= */

function initGalleryItems(container) {

  container
    .querySelectorAll("[data-gallery-image]")
    .forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const imageUrl =
            item.dataset.galleryImage;

          const title =
            item.dataset.galleryTitle ||
            "Gallery Image";

          openGalleryViewer(
            imageUrl,
            title
          );

        }
      );

    });

}


/* =========================================================
   GALLERY VIEWER
========================================================= */

function openGalleryViewer(
  imageUrl,
  title = "Gallery Image"
) {

  const viewer =
    $("#galleryViewer");

  const image =
    $("#galleryViewerImage");

  if (!viewer || !image) {
    return;
  }

  image.src =
    imageUrl;

  image.alt =
    title;

  viewer.style.display =
    "flex";

  document.body.style.overflow =
    "hidden";

}


function closeGalleryViewer() {

  const viewer =
    $("#galleryViewer");

  const image =
    $("#galleryViewerImage");

  if (viewer) {
    viewer.style.display =
      "none";
  }

  if (image) {
    image.removeAttribute("src");
  }

  document.body.style.overflow =
    "";

}


function initGalleryViewer() {

  const viewer =
    $("#galleryViewer");

  const closeButton =
    $("#galleryViewerClose");

  if (!viewer) {
    return;
  }

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeGalleryViewer
    );

  }

  viewer.addEventListener(
    "click",
    event => {

      if (event.target === viewer) {
        closeGalleryViewer();
      }

    }
  );

  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {
        closeGalleryViewer();
      }

    }
  );

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

      const grids = [
        ...Array.from($$("#galleryGrid")),
        ...Array.from($$("[data-gallery]"))
      ];

      grids.forEach(grid => {

        grid.innerHTML = `
          <div class="gallery-loading">
            गैलरी लोड नहीं हो पाई।
          </div>
        `;

      });

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
   DATE-BY-DATE CONTINUOUS CALENDAR
========================================================= */

function parseScheduleDate(dateString) {

  if (!dateString) {
    return null;
  }

  const value =
    String(dateString).trim();

  /*
    Firestore date format:
    YYYY-MM-DD

    We manually create the date
    to avoid timezone problems.
  */

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {

    const fallback =
      new Date(value);

    return isNaN(fallback.getTime())
      ? null
      : fallback;

  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]) - 1;

  const day =
    Number(match[3]);

  return new Date(
    year,
    month,
    day
  );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatCalendarDate(date) {

  if (!date) {
    return {
      number: "",
      weekday: "",
      month: ""
    };
  }

  const number =
    String(
      date.getDate()
    ).padStart(2, "0");

  const weekday =
    date.toLocaleDateString(
      "hi-IN",
      {
        weekday: "short"
      }
    );

  const month =
    date.toLocaleDateString(
      "hi-IN",
      {
        month: "short"
      }
    );

  return {
    number,
    weekday,
    month
  };

}


/* =========================================================
   SCHEDULE ITEM DATA
========================================================= */

function getScheduleItems(snapshot) {

  const items = [];

  snapshot.forEach(docSnap => {

    const data =
      docSnap.data();

    const date =
      safeText(data.date);

    const parsedDate =
      parseScheduleDate(date);

    items.push({

      id:
        docSnap.id,

      date,

      parsedDate,

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


  /*
    IMPORTANT:
    Date-wise ascending order.
    Example:
    11
    12
    13
    14
    15
  */

  items.sort((a, b) => {

    if (
      a.parsedDate &&
      b.parsedDate
    ) {

      const dateDifference =
        a.parsedDate.getTime() -
        b.parsedDate.getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }

      /*
        Same date:
        Sort by time if available.
      */

      return String(a.time)
        .localeCompare(
          String(b.time),
          "hi"
        );

    }

    if (a.parsedDate) {
      return -1;
    }

    if (b.parsedDate) {
      return 1;
    }

    return (
      b.createdAt -
      a.createdAt
    );

  });

  return items;

}


/* =========================================================
   CREATE DATE RANGE
========================================================= */

function createDateRange(
  startDate,
  endDate
) {

  const dates = [];

  if (
    !startDate ||
    !endDate
  ) {
    return dates;
  }

  const current =
    new Date(startDate);

  current.setHours(
    0,
    0,
    0,
    0
  );

  const last =
    new Date(endDate);

  last.setHours(
    0,
    0,
    0,
    0
  );


  /*
    Safety:
    Don't generate an extremely large
    calendar accidentally.
  */

  let safetyCounter = 0;

  while (
    current <= last &&
    safetyCounter < 366
  ) {

    dates.push(
      new Date(current)
    );

    current.setDate(
      current.getDate() + 1
    );

    safetyCounter++;

  }

  return dates;

}


/* =========================================================
   RENDER SCHEDULE
========================================================= */

function renderSchedule(snapshot) {

  const containers = [
    ...Array.from($$("#scheduleList")),
    ...Array.from($$("[data-schedule]")),
    ...Array.from($$(".schedule-list"))
  ];

  if (!containers.length) {
    return;
  }


  const items =
    getScheduleItems(snapshot);


  /* =======================================================
     NO DATA
  ======================================================= */

  if (!items.length) {

    containers.forEach(container => {

      container.innerHTML = `
        <div class="schedule-loading" style="
          padding:24px;
          text-align:center;
          color:#777;
        ">
          अभी कोई कार्यक्रम उपलब्ध नहीं है।
        </div>
      `;

    });

    return;
  }


  /* =======================================================
     DATE RANGE
     
     Example:
     11 uploaded
     15 uploaded

     Output:
     11
     12
     13
     14
     15
  ======================================================= */

  const datesWithEvents =
    items
      .map(item => item.parsedDate)
      .filter(Boolean);


  let firstDate =
    new Date(
      Math.min(
        ...datesWithEvents.map(
          date => date.getTime()
        )
      )
    );

  let lastDate =
    new Date(
      Math.max(
        ...datesWithEvents.map(
          date => date.getTime()
        )
      )
    );


  /*
    Optional:
    Calendar starts from the first
    uploaded date and ends at the
    last uploaded date.
  */

  const dateRange =
    createDateRange(
      firstDate,
      lastDate
    );


  /* =======================================================
     GROUP EVENTS BY DATE
  ======================================================= */

  const eventsByDate =
    new Map();


  items.forEach(item => {

    if (!item.parsedDate) {
      return;
    }

    const key =
      item.date;

    if (!eventsByDate.has(key)) {

      eventsByDate.set(
        key,
        []
      );

    }

    eventsByDate
      .get(key)
      .push(item);

  });


  /* =======================================================
     BUILD DATE-BY-DATE HTML
  ======================================================= */

  const calendarHtml =
    dateRange.map(date => {

      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          date.getDate()
        ).padStart(2, "0");

      const dateKey =
        `${year}-${month}-${day}`;


      const dateInfo =
        formatCalendarDate(date);


      const events =
        eventsByDate.get(
          dateKey
        ) || [];


      /* ===================================================
         DATE WITH EVENTS
      =================================================== */

      if (events.length) {

        return `
          <div
            class="schedule-item schedule-date-card has-event"
            data-schedule-date="${escapeHtml(dateKey)}"
            style="
              display:flex;
              gap:14px;
              align-items:flex-start;
              margin-bottom:14px;
            "
          >

            <div
              class="schedule-date"
              style="
                min-width:72px;
                text-align:center;
                flex-shrink:0;
              "
            >

              <div style="
                font-size:26px;
                line-height:1;
                font-weight:900;
                color:#7f1111;
              ">
                ${escapeHtml(dateInfo.number)}
              </div>

              <div style="
                margin-top:5px;
                font-size:12px;
                font-weight:800;
                color:#9a5b00;
              ">
                ${escapeHtml(dateInfo.weekday)}
              </div>

              <small style="
                display:block;
                margin-top:2px;
                color:#777;
                font-weight:700;
              ">
                ${escapeHtml(dateInfo.month)}
              </small>

            </div>


            <div
              class="schedule-info"
              style="
                flex:1;
                min-width:0;
              "
            >

              ${events.map(item => `

                <div
                  class="schedule-event"
                  style="
                    padding:13px 14px;
                    margin-bottom:8px;
                    border-radius:14px;
                    background:#fff8ed;
                    border:1px solid rgba(127,17,17,.10);
                  "
                >

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

              `).join("")}

            </div>

          </div>
        `;

      }


      /* ===================================================
         DATE WITHOUT EVENT
      =================================================== */

      return `
        <div
          class="schedule-item schedule-date-card no-event"
          data-schedule-date="${escapeHtml(dateKey)}"
          style="
            display:flex;
            gap:14px;
            align-items:center;
            margin-bottom:10px;
            opacity:.78;
          "
        >

          <div
            class="schedule-date"
            style="
              min-width:72px;
              text-align:center;
              flex-shrink:0;
            "
          >

            <div style="
              font-size:25px;
              line-height:1;
              font-weight:900;
              color:#777;
            ">
              ${escapeHtml(dateInfo.number)}
            </div>

            <div style="
              margin-top:5px;
              font-size:12px;
              font-weight:800;
              color:#999;
            ">
              ${escapeHtml(dateInfo.weekday)}
            </div>

            <small style="
              display:block;
              margin-top:2px;
              color:#aaa;
              font-weight:700;
            ">
              ${escapeHtml(dateInfo.month)}
            </small>

          </div>


          <div style="
            flex:1;
            padding:12px 14px;
            border-radius:12px;
            background:#fafafa;
            border:1px dashed #ddd;
            color:#888;
            font-size:13px;
          ">
            इस दिन कोई कार्यक्रम नहीं है।
          </div>

        </div>
      `;

    }).join("");


  /* =======================================================
     RENDER TO ALL CALENDAR CONTAINERS
  ======================================================= */

  containers.forEach(container => {

    container.innerHTML =
      calendarHtml;

  });


  console.log(
    "📅 Date-by-date calendar rendered:",
    dateRange.length,
    "dates"
  );

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

      const containers = [
        ...Array.from($$("#scheduleList")),
        ...Array.from($$("[data-schedule]")),
        ...Array.from($$(".schedule-list"))
      ];

      containers.forEach(container => {

        container.innerHTML = `
          <div class="schedule-loading" style="
            padding:24px;
            text-align:center;
            color:#b91c1c;
          ">
            कैलेंडर लोड नहीं हो पाया।
          </div>
        `;

      });

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

  const mapUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "श्री श्री 108 माँ मनोकामना छोटी दुर्गा पूजा समिति, चकशिवगंज, मौलानगर, सूर्यगढ़ा, लखीसराय, बिहार"
    );


  /* Normal map links */

  const mapLinks = [
    ...Array.from($$("[data-map-link]")),
    ...Array.from($$("#mapLink"))
  ];

  mapLinks.forEach(link => {

    if (link.tagName === "A") {

      link.href =
        mapUrl;

      link.target =
        "_blank";

      link.rel =
        "noopener noreferrer";

    }

  });


  /* Current HTML uses button #mapBtn */

  const mapBtn =
    $("#mapBtn");

  if (mapBtn) {

    mapBtn.addEventListener(
      "click",
      () => {

        window.open(
          mapUrl,
          "_blank",
          "noopener,noreferrer"
        );

      }
    );

  }

}


/* =========================================================
   LANGUAGE
========================================================= */

function initLanguageToggle() {

  const buttons = [
    ...Array.from($$("#languageBtn")),
    ...Array.from($$("#languageToggle")),
    ...Array.from($$("[data-language-toggle]"))
  ];


  if (!buttons.length) {
    return;
  }


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const current =
          document.documentElement.lang ||
          "hi";


        if (current === "hi") {

          document.documentElement.lang =
            "en";

          buttons.forEach(btn => {
            btn.textContent =
              "हिंदी";
          });

          showToast(
            "Language: English",
            "info"
          );

        } else {

          document.documentElement.lang =
            "hi";

          buttons.forEach(btn => {
            btn.textContent =
              "हिन्दी / English";
          });

          showToast(
            "भाषा: हिन्दी",
            "success"
          );

        }

      }
    );

  });

}


/* =========================================================
   PWA INSTALL
========================================================= */

function isAppInstalled() {

  const standalone =
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

  const fullscreen =
    window.matchMedia(
      "(display-mode: fullscreen)"
    ).matches;

  const minimalUi =
    window.matchMedia(
      "(display-mode: minimal-ui)"
    ).matches;

  const iosStandalone =
    window.navigator.standalone === true;


  return (
    standalone ||
    fullscreen ||
    minimalUi ||
    iosStandalone
  );

}


function createInstallButton() {

  if (installButton) {
    return installButton;
  }


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
      left:18px;
      right:18px;
      bottom:18px;
      z-index:99990;
      border:0;
      border-radius:14px;
      padding:14px 18px;
      background:#7f1111;
      color:#fff;
      font-weight:800;
      font-size:14px;
      box-shadow:0 10px 30px rgba(0,0,0,.22);
      cursor:pointer;
      justify-content:center;
      align-items:center;
    `;

    document.body.appendChild(
      installButton
    );

  }


  installButton.style.display =
    "inline-flex";


  installButton.classList.remove(
    "install-ready",
    "install-unavailable"
  );


  installButton.textContent =
    "📱 App Install करें";


  if (
    !installButton.dataset.installBound
  ) {

    installButton.dataset.installBound =
      "true";

    installButton.addEventListener(
      "click",
      handleInstallClick
    );

  }


  if (isAppInstalled()) {

    installButton.style.display =
      "none";

    return installButton;

  }


  setInstallButtonState(
    Boolean(deferredInstallPrompt)
  );


  return installButton;

}


function setInstallButtonState(ready) {

  if (!installButton) {
    return;
  }


  if (isAppInstalled()) {

    installButton.style.display =
      "none";

    return;

  }


  installButton.style.display =
    "inline-flex";


  if (ready) {

    installButton.disabled =
      false;

    installButton.classList.add(
      "install-ready"
    );

    installButton.classList.remove(
      "install-unavailable"
    );

    installButton.textContent =
      "📱 App Install करें";

    installButton.title =
      "इस ऐप को अपने फोन में Install करें";

    return;

  }


  installButton.disabled =
    false;

  installButton.classList.remove(
    "install-ready"
  );

  installButton.classList.add(
    "install-unavailable"
  );

  installButton.textContent =
    "📱 App Install करें";

}


async function handleInstallClick() {

  if (deferredInstallPrompt) {

    try {

      deferredInstallPrompt.prompt();

      const result =
        await deferredInstallPrompt.userChoice;

      console.log(
        "📱 Install result:",
        result?.outcome
      );


      if (
        result &&
        result.outcome === "accepted"
      ) {

        showToast(
          "App install किया जा रहा है ❤️",
          "success"
        );

      }

    } catch (error) {

      console.error(
        "❌ Install prompt error:",
        error
      );

      showToast(
        "Install prompt अभी उपलब्ध नहीं है।",
        "error"
      );

    } finally {

      deferredInstallPrompt =
        null;

      setInstallButtonState(
        false
      );

    }

    return;
  }


  showInstallInstructions();

}


function showInstallInstructions() {

  const isAndroid =
    /Android/i.test(
      navigator.userAgent
    );


  if (isAndroid) {

    showToast(
      "Chrome के ⋮ Menu में 'Install app' या 'Add to Home screen' चुनें।",
      "info"
    );

    return;
  }


  showToast(
    "Browser के Menu में 'Install app' / 'Add to Home screen' देखें।",
    "info"
  );

}


window.addEventListener(
  "beforeinstallprompt",
  event => {

    console.log(
      "📱 beforeinstallprompt received"
    );


    event.preventDefault();

    deferredInstallPrompt =
      event;


    if (!installButton) {
      createInstallButton();
    }


    setInstallButtonState(
      true
    );

  }
);


window.addEventListener(
  "appinstalled",
  () => {

    console.log(
      "✅ MAA MANOKAMANA TEMPLE installed"
    );


    deferredInstallPrompt =
      null;


    if (installButton) {

      installButton.style.display =
        "none";

    }


    showToast(
      "App successfully install हो गया ❤️",
      "success"
    );

  }
);


function checkIfAppIsInstalled() {

  if (!installButton) {
    return false;
  }


  if (isAppInstalled()) {

    installButton.style.display =
      "none";

    return true;

  }


  installButton.style.display =
    "inline-flex";

  return false;

}


/* =========================================================
   DISPLAY MODE CHANGE
========================================================= */

try {

  const displayModeMedia =
    window.matchMedia(
      "(display-mode: standalone)"
    );


  displayModeMedia.addEventListener(
    "change",
    () => {

      checkIfAppIsInstalled();

    }
  );

} catch (error) {

  console.warn(
    "⚠️ Display mode listener unavailable"
  );

}


/* =========================================================
   SERVICE WORKER
========================================================= */

function registerServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {

    console.warn(
      "⚠️ Service Worker not supported"
    );

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


        registration.addEventListener(
          "updatefound",
          () => {

            console.log(
              "🔄 New Service Worker update found"
            );

          }
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


    /* =====================================================
       BASIC
    ===================================================== */

    initMobileMenu();

    initLanguageToggle();

    initMapLinks();

    initGalleryViewer();


    /* =====================================================
       PWA
    ===================================================== */

    createInstallButton();

    checkIfAppIsInstalled();


    /* =====================================================
       TEMPLE SETTINGS
    ===================================================== */

    await loadTempleSettings();

    listenTempleSettings();


    /* =====================================================
       GALLERY
    ===================================================== */

    await loadGallery();

    listenGallery();


    /* =====================================================
       SCHEDULE
    ===================================================== */

    await loadSchedule();

    listenSchedule();


    /* =====================================================
       SERVICE WORKER
    ===================================================== */

    registerServiceWorker();


    console.log(
      "✅ MAA MANOKAMANA TEMPLE APP READY"
    );

  }
);
