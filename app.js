/* =========================================================
   MAA MANOKAMANA TEMPLE
   Main App JavaScript
   Firebase + Firestore Integration
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

const mapBtn = $("mapBtn");
const languageBtn = $("languageBtn");


/* =========================================================
   TEMPLE SETTINGS
========================================================= */

let templeSettings = {
  upiId: "",
  aartiTime: "",
  liveUrl: "",
  qrUrl: ""
};


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
      $("donationPurpose")?.value || "मंदिर सेवा";

    const utr =
      $("utr")?.value.trim() || "";


    /* Validation */

    if (!amountValue) {

      showToast("कृपया Donation Amount भरें।");
      return;

    }


    const amount = Number(amountValue);


    if (!Number.isFinite(amount) || amount <= 0) {

      showToast("कृपया सही Donation Amount डालें।");
      return;

    }


    if (!utr) {

      showToast("कृपया UTR / Transaction ID भरें।");
      return;

    }


    if (utr.length < 4) {

      showToast("कृपया सही UTR / Transaction ID डालें।");
      return;

    }


    /* Disable submit button */

    const submitBtn =
      donationForm.querySelector(
        'button[type="submit"]'
      );

    const oldButtonText =
      submitBtn ? submitBtn.textContent : "";


    if (submitBtn) {

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

    }


    try {

      /* Save donation to Firestore */

      await addDoc(
        collection(db, "donations"),
        {
          donorName: donorName,
          amount: amount,
          purpose: purpose,
          utr: utr,
          status: "pending",
          createdAt: serverTimestamp()
        }
      );


      showToast(
        "Donation details successfully submit हो गईं। Verification के बाद donation approve होगी।"
      );


      donationForm.reset();


      if (donationModal) {
        donationModal.classList.remove("active");
      }


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

        submitBtn.disabled = false;
        submitBtn.textContent = oldButtonText;

      }

    }

  });

}


/* =========================================================
   LOAD TEMPLE SETTINGS
   Firestore:
   temple/settings
========================================================= */

async function loadTempleSettings() {

  try {

    const settingsRef =
      doc(db, "temple", "settings");

    const settingsSnap =
      await getDoc(settingsRef);


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
          data.qrUrl || ""

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
      doc(db, "temple", "settings");


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
            data.qrUrl || ""

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


  /* Aarti time */

  if (todayAartiTime) {

    todayAartiTime.textContent =
      aartiTime;

  }


  if (liveAartiTime) {

    liveAartiTime.textContent =
      aartiTime;

  }


  /* UPI ID */

  if (upiId) {

    upiId.textContent =
      templeSettings.upiId ||
      "Admin Panel से अपडेट होगा";

  }


  /* QR */

  renderQRCode();


  /* Live */

  renderLiveVideo();

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


  /* No QR configured */

  if (!qrUrl) {

    qrBox.innerHTML = `
      <span>QR</span>
      <small>QR Code यहाँ दिखेगा</small>
    `;

    return;

  }


  /* Image URL */

  const img =
    document.createElement("img");


  img.src = qrUrl;

  img.alt =
    "माँ मनोकामना मंदिर Donation QR Code";

  img.loading = "lazy";

  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.display = "block";


  img.onerror = () => {

    qrBox.innerHTML = `
      <span>QR</span>
      <small>QR Code load नहीं हो सका</small>
    `;

  };


  qrBox.innerHTML = "";

  qrBox.appendChild(img);

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


  /* No live URL */

  if (!liveUrl) {

    liveVideo.innerHTML = `
      <div class="play-icon">▶</div>
      <h3>Live Aarti</h3>
      <p>आरती शुरू होने पर यहाँ Live दिखाई देगा।</p>
    `;

    return;

  }


  const embedUrl =
    getYouTubeEmbedUrl(liveUrl);


  /* YouTube */

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


  /* Other video / live URL */

  liveVideo.innerHTML = `
    <div class="play-icon">▶</div>

    <h3>Live Aarti</h3>

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


    /* youtube.com/watch?v= */

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname === "/watch"
    ) {

      const videoId =
        parsed.searchParams.get("v");


      if (videoId) {

        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

      }

    }


    /* youtu.be/VIDEO_ID */

    if (
      parsed.hostname === "youtu.be" ||
      parsed.hostname === "www.youtu.be"
    ) {

      const videoId =
        parsed.pathname.replace("/", "");


      if (videoId) {

        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

      }

    }


    /* youtube.com/live/VIDEO_ID */

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/live/")
    ) {

      const videoId =
        parsed.pathname.split("/")[2];


      if (videoId) {

        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

      }

    }


    /* Already embed URL */

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/embed/")
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
   Firestore:
   schedule/{id}
========================================================= */

async function loadSchedule() {

  if (!scheduleList) {
    return;
  }


  try {

    const scheduleQuery =
      query(
        collection(db, "schedule"),
        orderBy("date", "asc"),
        limit(30)
      );


    const snapshot =
      await getDocs(scheduleQuery);


    if (snapshot.empty) {

      renderEmptySchedule();

      return;

    }


    const schedules = [];


    snapshot.forEach((scheduleDoc) => {

      schedules.push({

        id:
          scheduleDoc.id,

        ...scheduleDoc.data()

      });

    });


    renderSchedule(schedules);


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
        collection(db, "schedule"),
        orderBy("date", "asc"),
        limit(30)
      );


    onSnapshot(
      scheduleQuery,

      (snapshot) => {

        const schedules = [];


        snapshot.forEach((scheduleDoc) => {

          schedules.push({

            id:
              scheduleDoc.id,

            ...scheduleDoc.data()

          });

        });


        if (schedules.length === 0) {

          renderEmptySchedule();

          return;

        }


        renderSchedule(schedules);

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

function renderSchedule(schedules) {

  if (!scheduleList) {
    return;
  }


  scheduleList.innerHTML = "";


  schedules.forEach((item) => {

    const scheduleItem =
      document.createElement("div");


    scheduleItem.className =
      "schedule-item";


    const dateInfo =
      formatScheduleDate(item.date);


    scheduleItem.innerHTML = `

      <div class="schedule-date">

        <strong>
          ${escapeHtml(dateInfo.day)}
        </strong>

        <span>
          ${escapeHtml(dateInfo.month)}
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
                🕐 ${escapeHtml(item.time)}
              </small>
            `
            : ""
        }

      </div>

    `;


    scheduleList.appendChild(
      scheduleItem
    );

  });

}


/* =========================================================
   EMPTY SCHEDULE
========================================================= */

function renderEmptySchedule(
  message = "कार्यक्रम जल्द अपडेट होगा।"
) {

  if (!scheduleList) {
    return;
  }


  scheduleList.innerHTML = `

    <div class="schedule-item">

      <div class="schedule-date">

        <strong>—</strong>

        <span>DATE</span>

      </div>


      <div class="schedule-info">

        <h3>
          ${escapeHtml(message)}
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

function formatScheduleDate(dateValue) {

  if (!dateValue) {

    return {

      day: "—",
      month: "DATE"

    };

  }


  try {

    const date =
      new Date(dateValue);


    if (Number.isNaN(date.getTime())) {

      return {

        day: dateValue,
        month: "DATE"

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
        ).padStart(2, "0"),

      month:
        months[date.getMonth()]

    };


  } catch {

    return {

      day:
        String(dateValue),

      month:
        "DATE"

    };

  }

}


/* =========================================================
   GALLERY
   Firestore:
   gallery/{id}

   Admin Panel saves:
   - title
   - category
   - imageUrl
   - publicId
   - createdAt
========================================================= */

async function loadGallery() {

  if (!galleryGrid) {
    return;
  }


  try {

    const galleryQuery =
      query(
        collection(db, "gallery"),
        orderBy("createdAt", "desc"),
        limit(30)
      );


    const snapshot =
      await getDocs(galleryQuery);


    const items = [];


    snapshot.forEach((galleryDoc) => {

      items.push({

        id:
          galleryDoc.id,

        ...galleryDoc.data()

      });

    });


    renderGallery(items);


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
        collection(db, "gallery"),
        orderBy("createdAt", "desc"),
        limit(30)
      );


    onSnapshot(
      galleryQuery,

      (snapshot) => {

        const items = [];


        snapshot.forEach((galleryDoc) => {

          items.push({

            id:
              galleryDoc.id,

            ...galleryDoc.data()

          });

        });


        renderGallery(items);

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

function renderGallery(items) {

  if (!galleryGrid) {
    return;
  }


  /* No gallery photos */

  if (!items || items.length === 0) {

    renderEmptyGallery();

    return;

  }


  galleryGrid.innerHTML = "";


  items.forEach((item) => {

    const galleryItem =
      document.createElement("article");


    galleryItem.className =
      "gallery-item";


    /* Image */

    const image =
      document.createElement("img");


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


    /* Caption */

    const caption =
      document.createElement("div");


    caption.className =
      "gallery-caption";


    const title =
      document.createElement("h3");


    title.textContent =
      item.title ||
      "मंदिर दर्शन";


    const category =
      document.createElement("span");


    category.textContent =
      item.category ||
      "मंदिर";


    caption.appendChild(title);
    caption.appendChild(category);


    galleryItem.appendChild(image);
    galleryItem.appendChild(caption);


    galleryGrid.appendChild(
      galleryItem
    );

  });

}


/* =========================================================
   EMPTY GALLERY
========================================================= */

function renderEmptyGallery(
  message = "अभी कोई फोटो उपलब्ध नहीं है।"
) {

  if (!galleryGrid) {
    return;
  }


  galleryGrid.innerHTML = `

    <div class="gallery-placeholder">

      <span>📸</span>

      <p>
        ${escapeHtml(message)}
      </p>

    </div>

  `;

}


/* =========================================================
   GOOGLE MAPS
========================================================= */

if (mapBtn) {

  mapBtn.addEventListener("click", () => {

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

  });

}


/* =========================================================
   LANGUAGE BUTTON
========================================================= */

let englishMode = false;


if (languageBtn) {

  languageBtn.addEventListener("click", () => {

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

  });

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

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

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker

      .register("./sw.js")

      .then(() => {

        console.log(
          "Service Worker registered successfully."
        );

      })

      .catch((error) => {

        console.error(
          "Service Worker registration failed:",
          error
        );

      });

  });

}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function initializeTempleApp() {

  console.log(
    "🙏 माँ मनोकामना Temple App initializing..."
  );


  /* Load Firebase data */

  await loadTempleSettings();

  await loadSchedule();

  await loadGallery();


  /* Start realtime listeners */

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
