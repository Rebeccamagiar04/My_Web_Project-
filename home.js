const savedName = localStorage.getItem("questionnaireName");

console.log("NAME RETRIEVED:", JSON.stringify(savedName));

if (savedName) {
    document.getElementById("userName").textContent = savedName;
}



document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const notifToggle = document.getElementById('notifToggle');
  const notifDropdown = document.getElementById('notifDropdown');

  // Toggle Mobile Drawer
  function toggleDrawer() {
    mobileDrawer.classList.toggle('open');
    drawerOverlay.classList.toggle('show');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', toggleDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', toggleDrawer);

  // Close drawer when clicking a sub-link
  document.querySelectorAll('.sub-nav-list a').forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      drawerOverlay.classList.remove('show');
    });
  });

  // Toggle Notifications Dropdown
  if (notifToggle && notifDropdown) {
    notifToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifToggle) {
        notifDropdown.classList.remove('show');
      }
    });
  }
});



 //============= APPLICATION ESSENTIALS PROGRESS =============//

document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector("#application-essentials");
    const timeline = section?.querySelector(".application-cards");
    const track = section?.querySelector(".application-progress-line");
    const fill = section?.querySelector(".application-progress-fill");

    if (!section || !timeline || !track || !fill) return;

    function updateApplicationProgress() {
        const timelineRect = timeline.getBoundingClientRect();
        const triggerPoint = window.innerHeight * 0.65;

        let progress =
            (triggerPoint - timelineRect.top) / timelineRect.height;

        progress = Math.max(0, Math.min(1, progress));

        fill.style.height = `${progress * 100}%`;
    }

    window.addEventListener("scroll", updateApplicationProgress, {
        passive: true
    });

    window.addEventListener("resize", updateApplicationProgress);

    updateApplicationProgress();
});


/* =========================================================
   DOCUMENT CATEGORY LINKS
   ========================================================= */

const documentCards = document.querySelectorAll(".document-card");

documentCards.forEach((card) => {

    card.addEventListener("click", () => {

        const category = card.dataset.category;

        if (category) {
            window.location.href = `doctemplates.html?category=${category}`;
        }

    });

});


// =========================================================
// IMPACT STATS SLIDER
// =========================================================

const stats = document.querySelectorAll(".stat");
const dots = document.querySelectorAll(".dot");

const previousButton = document.querySelector(".slider-arrow.previous");
const nextButton = document.querySelector(".slider-arrow.next");

let currentStat = 0;


// =========================================================
// SHOW A PARTICULAR STATISTIC
// =========================================================

function showStat(index) {

    // Make sure the index stays within the range
    if (index < 0) {
        currentStat = stats.length - 1;
    } else if (index >= stats.length) {
        currentStat = 0;
    } else {
        currentStat = index;
    }


    // On mobile, show only the current statistic
    if (window.innerWidth <= 700) {

        stats.forEach((stat, i) => {
            stat.classList.toggle("active", i === currentStat);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === currentStat);
        });

    }

    // On desktop, show all statistics
    else {

        stats.forEach((stat) => {
            stat.classList.add("active");
        });

        // Keep the current dot active
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === currentStat);
        });

    }
}


// =========================================================
// NEXT BUTTON
// =========================================================

if (nextButton) {

    nextButton.addEventListener("click", () => {
        showStat(currentStat + 1);
    });

}


// =========================================================
// PREVIOUS BUTTON
// =========================================================

if (previousButton) {

    previousButton.addEventListener("click", () => {
        showStat(currentStat - 1);
    });

}


// =========================================================
// DOT BUTTONS
// =========================================================

dots.forEach((dot, index) => {

    dot.addEventListener("click", () => {
        showStat(index);
    });

});


// DESKTOP BEHAVIOUR//

function updateStatsForScreen() {

    if (window.innerWidth <= 700) {

        // Mobile: show only one statistic
        stats.forEach((stat, index) => {
            stat.classList.toggle("active", index === currentStat);
        });

    } else {

        // Desktop: show all statistics
        stats.forEach((stat) => {
            stat.classList.add("active");
        });

    }
}


// =========================================================
// INITIALIZE
// =========================================================

showStat(0);


// =========================================================
// UPDATE WHEN SCREEN SIZE CHANGES
// =========================================================

window.addEventListener("resize", updateStatsForScreen);

