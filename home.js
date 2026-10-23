 /* =========================================
PORTICO KAKUMA — ABOUT.JS
Navigation + Authentication + Notifications
========================================= */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
getAuth,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
getFirestore,
collection,
query,
where,
onSnapshot,
doc,
getDoc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/* =========================================

1. FIREBASE CONFIGURATION
   ========================================= */

const firebaseConfig = {
apiKey: "AIzaSyAoH3X26Hx8jFjaCJcknuB6Kgx7u10nVUE",
authDomain: "first-webproject-865a5.firebaseapp.com",
projectId: "first-webproject-865a5",
storageBucket: "first-webproject-865a5.firebasestorage.app",
messagingSenderId: "586929157801",
appId: "1:586929157801:web:46dcd3fee9343ba6895bb8",
measurementId: "G-DHPQ1CL34X"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================================
2. MOBILE NAVIGATION + NOTIFICATION UI
========================================= */

document.addEventListener("DOMContentLoaded", () => {

const hamburgerBtn = document.getElementById("hamburgerBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const mobileDrawer = document.getElementById("mobileDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");

const notifToggle = document.getElementById("notifToggle");
const notifDropdown = document.getElementById("notifDropdown");
const notifBadge = notifToggle?.querySelector(".notif-badge");

console.log("Notification button:", notifToggle);
console.log("Badge element:", notifBadge);
console.log("Notification badge CSS:", notifBadge ? getComputedStyle(notifBadge).display : "Badge not found");
  
const notifList = notifDropdown?.querySelector(".notif-list");

let currentUser = null;
let notifications = [];
let readNotificationIds = new Set();
let stopNotificationsListener = null;
let stopReadListener = null;
let dropdownOpened = false;


/* MOBILE DRAWER */

function toggleDrawer() {
    if (!mobileDrawer || !drawerOverlay) return;

    mobileDrawer.classList.toggle("open");
    drawerOverlay.classList.toggle("show");
}

if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", toggleDrawer);
}

if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener("click", toggleDrawer);
}

if (drawerOverlay) {
    drawerOverlay.addEventListener("click", toggleDrawer);
}

document.querySelectorAll(".sub-nav-list a").forEach(link => {
    link.addEventListener("click", () => {
        mobileDrawer?.classList.remove("open");
        drawerOverlay?.classList.remove("show");
    });
});


/* NOTIFICATION BADGE */

function updateBadge() {
    if (!notifBadge) return;

    const unreadCount = notifications.filter(notification =>
        !readNotificationIds.has(notification.id)
    ).length;

    notifBadge.textContent = unreadCount;
    notifBadge.style.display = unreadCount > 0 ? "inline-flex" : "none";
}

    
/* DISPLAY NOTIFICATIONS */

function renderNotifications() {
    if (!notifList) return;

    notifList.replaceChildren();

    if (notifications.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No notifications yet.";
        notifList.appendChild(emptyItem);
        updateBadge();
        return;
    }

    notifications.forEach(notification => {
        const item = document.createElement("li");

        const title = document.createElement("strong");
        title.textContent = notification.title || "Notification";

        const message = document.createElement("p");
        message.textContent = notification.message || "";

        item.appendChild(title);
        item.appendChild(message);

        if (!readNotificationIds.has(notification.id)) {
            item.classList.add("unread");
        }

        notifList.appendChild(item);
    });

    updateBadge();
}


                          
/* NOTIFICATION BADGE */

function updateBadge() {
    if (!notifBadge) {
        console.error("Notification badge element not found.");
        return;
    }

    const unreadCount = notifications.filter(
        notification => !readNotificationIds.has(notification.id)
    ).length;

    console.log("Unread count:", unreadCount);

    notifBadge.textContent = unreadCount;
    notifBadge.style.display =
        unreadCount > 0 ? "inline-flex" : "none";
}


/* SAVE READ STATUS FOR THE CURRENT USER */

async function markNotificationsAsRead() {
    if (!currentUser || notifications.length === 0) return;

    const newReadIds = notifications
        .filter(notification => !readNotificationIds.has(notification.id))
        .map(notification => notification.id);

    if (newReadIds.length === 0) return;

    // Update the badge immediately.
    newReadIds.forEach(id => readNotificationIds.add(id));
    renderNotifications();

    try {
        const readRef = doc(db, "NotificationReads", currentUser.uid);
        const snapshot = await getDoc(readRef);

        const existingIds = snapshot.exists()
            ? snapshot.data().readNotifications || {}
            : {};

        const updatedIds = { ...existingIds };

        newReadIds.forEach(id => {
            updatedIds[id] = true;
        });

        await setDoc(readRef, {
            readNotifications: updatedIds
        });

    } catch (error) {
        console.error("Could not save notification read status:", error);

        // If saving fails, restore the unread state.
        newReadIds.forEach(id => readNotificationIds.delete(id));
        renderNotifications();
    }
}


/* OPEN/CLOSE NOTIFICATION DROPDOWN */

if (notifToggle && notifDropdown) {
    notifToggle.addEventListener("click", async event => {
        event.stopPropagation();

        const opening = !notifDropdown.classList.contains("show");
        notifDropdown.classList.toggle("show");

        if (opening) {
            dropdownOpened = true;
            await markNotificationsAsRead();
        } else {
            dropdownOpened = false;
        }
    });

    notifDropdown.addEventListener("click", event => {
        event.stopPropagation();
    });

    document.addEventListener("click", event => {
        if (
            !notifDropdown.contains(event.target) &&
            !notifToggle.contains(event.target)
        ) {
            notifDropdown.classList.remove("show");
            dropdownOpened = false;
        }
    });
}



/* =========================================
   3. LOAD NOTIFICATIONS FROM FIRESTORE
========================================= */

function listenForNotifications() {
    const activeNotificationsQuery = query(
        collection(db, "Notifications"),
        where("active", "==", true)
    );

    stopNotificationsListener = onSnapshot(
        activeNotificationsQuery,
        snapshot => {
            notifications = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            console.log("Active notifications:", notifications.length);

            // Show newest notifications first.
            notifications.sort((a, b) => {
                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            });

            renderNotifications();
        },
        error => {
            console.error(
                "Could not load notifications:",
                error.code,
                error.message
            );
        }
    );
}



/* =========================================
   4. LOAD THIS USER'S READ STATUS
========================================= */

function listenForReadStatus(user) {
    const readRef = doc(db, "NotificationReads", user.uid);

    stopReadListener = onSnapshot(
        readRef,
        snapshot => {
            const saved = snapshot.exists()
                ? snapshot.data().readNotifications || {}
                : {};

            readNotificationIds = new Set(
                Object.keys(saved).filter(id => saved[id] === true)
            );

            renderNotifications();
        },
        error => {
            console.error("Could not load read status:", error);
        }
    );
}


/* =========================================
   5. AUTHENTICATION SESSION
   Uses the existing Firebase session.
   Does not create a new login or guest account.
========================================= */

onAuthStateChanged(auth, user => {
    currentUser = user;

    // Stop listeners from the previous session.
    if (stopNotificationsListener) {
        stopNotificationsListener();
        stopNotificationsListener = null;
    }

    if (stopReadListener) {
        stopReadListener();
        stopReadListener = null;
    }

    notifications = [];
    readNotificationIds = new Set();
    renderNotifications();

    if (user) {
        listenForNotifications();
        listenForReadStatus(user);
    } else {
        // Notifications can still be displayed to signed-out visitors,
        // but read status is not saved without a Firebase user.
        listenForNotifications();
    }
});

});


const savedName = localStorage.getItem("questionnaireName");

console.log("NAME RETRIEVED:", JSON.stringify(savedName));

if (savedName) {
    document.getElementById("userName").textContent = savedName;
}


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

