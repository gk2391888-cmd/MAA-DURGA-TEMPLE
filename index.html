/* =========================================
   MAA MANOKAMANA TEMPLE
   Main App JavaScript
========================================= */


/* ---------- MOBILE MENU ---------- */

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });
}


/* Close menu after clicking link */

document.querySelectorAll("#navMenu a").forEach(link => {

  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
  });

});


/* ---------- YEAR ---------- */

document.getElementById("year").textContent =
  new Date().getFullYear();


/* ---------- DONATION MODAL ---------- */

const donationModal =
  document.getElementById("donationModal");

const donateBtn =
  document.getElementById("donateBtn");

const closeModal =
  document.getElementById("closeModal");


if (donateBtn) {

  donateBtn.addEventListener("click", () => {

    donationModal.classList.add("active");

  });

}


if (closeModal) {

  closeModal.addEventListener("click", () => {

    donationModal.classList.remove("active");

  });

}


if (donationModal) {

  donationModal.addEventListener("click", event => {

    if (event.target === donationModal) {

      donationModal.classList.remove("active");

    }

  });

}


/* ---------- DONATION FORM ---------- */

const donationForm =
  document.getElementById("donationForm");


if (donationForm) {

  donationForm.addEventListener("submit", event => {

    event.preventDefault();

    const donorName =
      document.getElementById("donorName").value.trim();

    const amount =
      document.getElementById("donationAmount").value;

    const purpose =
      document.getElementById("donationPurpose").value;

    const utr =
      document.getElementById("utr").value.trim();


    if (!amount || !utr) {

      showToast(
        "Please amount और UTR भरें।"
      );

      return;

    }


    console.log({
      donorName,
      amount,
      purpose,
      utr
    });


    showToast(
      "Donation details submit हो गईं। Verification के बाद receipt जारी होगी।"
    );


    donationForm.reset();

    donationModal.classList.remove("active");

  });

}


/* ---------- TOAST ---------- */

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {

    toast.classList.remove("show");

  }, 3500);

}


/* ---------- GOOGLE MAPS ---------- */

const mapBtn =
  document.getElementById("mapBtn");

if (mapBtn) {

  mapBtn.addEventListener("click", () => {

    const address =
      encodeURIComponent(
        "Chakshivganj, Maulanagar, Suryagarha, Lakhisarai, Bihar"
      );

    window.open(
      "https://www.google.com/maps/search/?api=1&query=" + address,
      "_blank"
    );

  });

}


/* ---------- LANGUAGE ---------- */

const languageBtn =
  document.getElementById("languageBtn");

let englishMode = false;


if (languageBtn) {

  languageBtn.addEventListener("click", () => {

    englishMode = !englishMode;

    if (englishMode) {

      languageBtn.textContent = "English | हिंदी";

      showToast(
        "English interface जल्द पूरी तरह उपलब्ध होगा।"
      );

    } else {

      languageBtn.textContent = "हिंदी | English";

      showToast(
        "हिंदी भाषा चयनित है।"
      );

    }

  });

}


/* ---------- PWA ---------- */

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {

        console.log(
          "Service Worker registered successfully."
        );

      })
      .catch(error => {

        console.error(
          "Service Worker registration failed:",
          error
        );

      });

  });

}


/* ---------- DEMO CONFIG ---------- */
/*
  Phase 2 में ये values Firebase
  Admin Panel से आएंगी.
*/

const templeSettings = {

  aartiTime: "जल्द अपडेट होगा",

  upiId: "Admin Panel से अपडेट होगा",

  liveUrl: "",

};


/* Display settings */

const todayAartiTime =
  document.getElementById("todayAartiTime");

const liveAartiTime =
  document.getElementById("liveAartiTime");

const upiId =
  document.getElementById("upiId");


if (todayAartiTime) {

  todayAartiTime.textContent =
    templeSettings.aartiTime;

}


if (liveAartiTime) {

  liveAartiTime.textContent =
    templeSettings.aartiTime;

}


if (upiId) {

  upiId.textContent =
    templeSettings.upiId;

}
