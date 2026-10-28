
/* =========================================
PORTICO KAKUMA — RESOURCES.JS
Navigation + Authentication + Notifications
========================================= */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
getAuth,
onAuthStateChanged,
signOut
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


// LOGOUT BUTTON
const drawerLogoutContainer =
document.getElementById("drawerLogoutContainer");

const logoutBtn =
document.getElementById("logoutBtn");

if (logoutBtn) {
logoutBtn.addEventListener("click", async () => {
try {
// Sign out the current user
await signOut(auth);

// Close the mobile drawer
mobileDrawer?.classList.remove("open");
drawerOverlay?.classList.remove("show");

// Redirect to the access page
window.location.href = "access.html";

} catch (error) {
console.error("Logout failed:", error);

alert("Unable to log out. Please try again.");
}
});
}


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

// Show Logout only for non-anonymous signed-in users
if (drawerLogoutContainer) {
drawerLogoutContainer.hidden = !user || user.isAnonymous;
}

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


/* =====================================================
   SCHOLARSHIP DEADLINE CALENDAR
   ===================================================== */

(() => {
    "use strict";

    const calendar = document.getElementById("deadline-calendar");

    // Do nothing on pages that do not contain this calendar.
    if (!calendar) return;

    const monthHeading = document.getElementById("calendar-month");
    const yearHeading = document.getElementById("calendar-year");
    const daysContainer = document.getElementById("calendar-days");
    const previousButton = document.getElementById("calendar-prev");
    const nextButton = document.getElementById("calendar-next");
    const calendarPage = document.getElementById("calendar-page");
    const selectedDateHeading = document.getElementById(
        "selected-date-heading"
    );
    const selectedDateMessage = document.getElementById(
        "selected-date-message"
    );
    const deadlineList = document.getElementById(
        "calendar-deadline-list"
    );

    /*
     * DEADLINE DATA
     *
     * Dates use YYYY-MM-DD to avoid timezone shifting.
     * These are the deadlines previously supplied for the site.
     * Verify each deadline and its official detail URL before publishing.
     */

    const scholarshipDeadlines = [
        {
            date: "2026-11-06",
            name: "Lester B. Pearson Scholarship",
            url: "scholarship-details.html?id=pearson"
        },
        {
            date: "2026-11-15",
            name: "Bowdoin College — Undergraduate",
            url: "scholarship-details.html?id=bowdoin"
        },
        {
            date: "2026-11-19",
            name: "University of Edinburgh — Mastercard Foundation (Postgraduate)",
            url: "scholarship-details.html?id=edinburgh-mastercard"
        },
        {
            date: "2026-11-30",
            name: "Berea College — Undergraduate",
            url: "scholarship-details.html?id=berea-college"
        },
        {
            date: "2026-11-30",
            name: "African Leadership University — Mastercard Foundation",
            url: "scholarship-details.html?id=alu-mastercard"
        },
        {
            date: "2026-11-30",
            name: "University of Toronto Scholars and Students at Risk Award Program",
            url: "scholarship-details.html?id=toronto-at-risk"
        },
        {
            date: "2026-12-31",
            name: "United World Colleges",
            url: "scholarship-details.html?id=uwc"
        },
        {
            date: "2027-01-20",
            name: "Chinese Government Scholarships",
            url: "scholarship-details.html?id=chinese-government-scholarship"
        },
        {
            date: "2027-01-31",
            name: "EARTH University — Mastercard Foundation",
            url: "scholarship-details.html?id=earth-mastercard"
        }
    ];

    // Group deadlines by date so multiple scholarships can share a day.
    const deadlinesByDate = new Map();

    scholarshipDeadlines.forEach((scholarship) => {
        if (!deadlinesByDate.has(scholarship.date)) {
            deadlinesByDate.set(scholarship.date, []);
        }

        deadlinesByDate.get(scholarship.date).push(scholarship);
    });

    const monthFormatter = new Intl.DateTimeFormat("en", {
        month: "long"
    });

    const fullDateFormatter = new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    // Use local calendar dates rather than UTC dates.
    function makeDateKey(year, month, day) {
        return [
            year,
            String(month + 1).padStart(2, "0"),
            String(day).padStart(2, "0")
        ].join("-");
    }

    function getTodayKey() {
        const today = new Date();

        return makeDateKey(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );
    }

    function parseDateKey(dateKey) {
        const [year, month, day] = dateKey.split("-").map(Number);

        return new Date(year, month - 1, day);
    }

    let displayedYear = new Date().getFullYear();
    let displayedMonth = new Date().getMonth();
    let selectedDateKey = getTodayKey();

    function renderCalendar(animationDirection = "") {
        const firstDay = new Date(
            displayedYear,
            displayedMonth,
            1
        ).getDay();

        const numberOfDays = new Date(
            displayedYear,
            displayedMonth + 1,
            0
        ).getDate();

        monthHeading.textContent = monthFormatter.format(
            new Date(displayedYear, displayedMonth, 1)
        );

        yearHeading.textContent = displayedYear;

        daysContainer.replaceChildren();

        // Empty cells align day 1 with the correct weekday.
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement("div");

            emptyCell.className = "calendar-day is-empty";
            emptyCell.setAttribute("aria-hidden", "true");

            daysContainer.appendChild(emptyCell);
        }

        const todayKey = getTodayKey();

        // Generate each date automatically.
        for (let day = 1; day <= numberOfDays; day++) {
            const dateKey = makeDateKey(
                displayedYear,
                displayedMonth,
                day
            );

            const dateCell = document.createElement("div");
            const dateButton = document.createElement("button");
            const dayNumber = document.createElement("span");

            const hasDeadline = deadlinesByDate.has(dateKey);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateKey;

            dateCell.className = "calendar-day";

            if (hasDeadline) {
                dateCell.classList.add("has-deadline");
            }

            if (isToday) {
                dateCell.classList.add("is-today");
            }

            if (isSelected) {
                dateCell.classList.add("is-selected");
            }

            dateButton.type = "button";
            dateButton.textContent = String(day);

            dateButton.setAttribute(
                "aria-label",
                fullDateFormatter.format(parseDateKey(dateKey)) +
                    (hasDeadline ? ", scholarship deadline" : "") +
                    (isToday ? ", today" : "")
            );

            if (isToday) {
                dateButton.setAttribute("aria-current", "date");
            }

            if (isSelected) {
                dateButton.setAttribute("aria-pressed", "true");
            } else {
                dateButton.setAttribute("aria-pressed", "false");
            }

            if (hasDeadline) {
                const count = deadlinesByDate.get(dateKey).length;

                dateButton.title =
                    count === 1
                        ? "1 scholarship deadline"
                        : count + " scholarship deadlines";
            }

            dayNumber.textContent = String(day);
            dateButton.replaceChildren(dayNumber);

            dateButton.addEventListener("click", () => {
                selectedDateKey = dateKey;

                renderCalendar();
                showSelectedDate(dateKey);
            });

            dateCell.appendChild(dateButton);
            daysContainer.appendChild(dateCell);
        }

        // Apply the page-turn animation when changing months.
        calendarPage.classList.remove("turn-next", "turn-previous");

        if (animationDirection) {
            // Restart the animation after removing its class.
            void calendarPage.offsetWidth;

            calendarPage.classList.add(
                animationDirection === "next"
                    ? "turn-next"
                    : "turn-previous"
            );
        }

        showSelectedDate(selectedDateKey);
    }

    function showSelectedDate(dateKey) {
        const selectedDate = parseDateKey(dateKey);

        selectedDateHeading.textContent =
            fullDateFormatter.format(selectedDate);

        deadlineList.replaceChildren();

        const deadlines = deadlinesByDate.get(dateKey) || [];

        if (deadlines.length === 0) {
            selectedDateMessage.textContent =
                "There are no listed scholarship deadlines on this date.";

            return;
        }

        selectedDateMessage.textContent =
            deadlines.length === 1
                ? "There is 1 scholarship deadline on this date:"
                : "There are " + deadlines.length +
                  " scholarship deadlines on this date:";

        deadlines.forEach((scholarship) => {
            const item = document.createElement("li");
            const link = document.createElement("a");

            link.textContent = scholarship.name;
            link.href = scholarship.url;

            item.appendChild(link);
            deadlineList.appendChild(item);
        });
    }

    function changeMonth(direction) {
        displayedMonth += direction;

        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        } else if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }

        renderCalendar(direction > 0 ? "next" : "previous");
    }

    previousButton.addEventListener("click", () => {
        changeMonth(-1);
    });

    nextButton.addEventListener("click", () => {
        changeMonth(1);
    });

    // Keep the calendar date accurate if the page stays open overnight.
    let midnightRefreshTimer;

    function scheduleDailyRefresh() {
        clearTimeout(midnightRefreshTimer);

        const now = new Date();
        const nextMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0, 0, 1
        );

        midnightRefreshTimer = setTimeout(() => {
            const todayKey = getTodayKey();

            // Automatically follow the new month when it changes.
            if (
                displayedYear !== new Date().getFullYear() ||
                displayedMonth !== new Date().getMonth()
            ) {
                displayedYear = new Date().getFullYear();
                displayedMonth = new Date().getMonth();
            }

            if (selectedDateKey === getPreviousTodayKey(todayKey)) {
                selectedDateKey = todayKey;
            }

            renderCalendar();
            scheduleDailyRefresh();
        }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
    }

    function getPreviousTodayKey(todayKey) {
        const previousDay = parseDateKey(todayKey);
        previousDay.setDate(previousDay.getDate() - 1);

        return makeDateKey(
            previousDay.getFullYear(),
            previousDay.getMonth(),
            previousDay.getDate()
        );
    }

    // Re-check the current date when the user returns to the page.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            const now = new Date();

            if (
                displayedYear !== now.getFullYear() ||
                displayedMonth !== now.getMonth()
            ) {
                displayedYear = now.getFullYear();
                displayedMonth = now.getMonth();
            }

            renderCalendar();
            scheduleDailyRefresh();
        }
    });

    renderCalendar();
    scheduleDailyRefresh();
})();

  

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(q => {
q.addEventListener('click', () => {
const item = q.parentElement;
const isOpen = item.classList.contains('open');
document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
if (!isOpen) item.classList.add('open');
});
});

document.addEventListener("DOMContentLoaded", () => {

    const faqs = document.querySelectorAll(".faq-item");
    

    faqs.forEach(item => {

        const question = item.querySelector(".faq-question");

        question.addEventListener("click", () => {

            console.log("Clicked!");

            item.classList.toggle("active");

        });

    });

});


// Card hover effects enhancement
document.querySelectorAll('.deadline-card, .video-card, .article-card, .learn-card').forEach(card => {
card.addEventListener('mouseenter', () => {
card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
});
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', function(e) {
e.preventDefault();
});
});

// Scholarship Deadline Countdown

function updateCountdowns() {

    const countdowns = document.querySelectorAll(".countdown");

    countdowns.forEach(countdown => {

        const deadline = new Date(countdown.dataset.deadline).getTime();
        const now = new Date().getTime();

        const difference = deadline - now;

        if (difference <= 0) {
            countdown.textContent = "🔴 Application closed";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (difference % (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        );

        const minutes = Math.floor(
            (difference % (1000 * 60 * 60)) /
            (1000 * 60)
        );

        const seconds = Math.floor(
            (difference % (1000 * 60)) /
            1000
        );

        countdown.textContent =
            `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
    });
}

updateCountdowns();

setInterval(updateCountdowns, 1000);

// ================================
// DAILY MOTIVATION
// ================================

const motivations = [
    "You don't have to have everything figured out. Just keep taking the next step.",
    
    "Your journey doesn't have to look like anyone else's. Keep going at your own pace.",
    
    "Small progress is still progress. Be proud of every step you take.",
    
    "One rejection does not define your future. Keep searching, keep learning, keep growing.",
    
    "Your dreams are worth the effort it takes to reach them.",
    
    "You are allowed to start small. Great things often begin with one small step.",
    
    "Don't compare your beginning to someone else's middle.",
    
    "Keep going. The opportunity you're looking for may be closer than you think.",
    
    "Your current circumstances do not have to determine your destination.",
    
    "Believe in the person you're becoming."
];


// ================================
// DAILY CHALLENGES
// ================================

const challenges = [
    "Spend 20 minutes learning something you've always been curious about.",
    
    "Write down three things you're proud of accomplishing.",
    
    "Learn five new words in a language you've always wanted to speak.",
    
    "Practice introducing yourself confidently in 30 seconds.",
    
    "Spend 15 minutes improving one digital skill.",
    
    "Read an article about a topic you've never explored before.",
    
    "Write down one goal you'd like to accomplish this month.",
    
    "Teach someone something you know.",
    
    "Spend 20 minutes practicing your communication skills.",
    
    "Try something creative today that you've never done before."
];


// ================================
// SELECT MESSAGE BASED ON THE DATE
// ================================

function getDailyContent(array) {

    const today = new Date();

    // Create a number based on today's date
    const dateNumber =
        today.getFullYear() +
        today.getMonth() +
        today.getDate();

    // Choose an item from the array
    const index = dateNumber % array.length;

    return array[index];
}


// ================================
// DISPLAY TODAY'S CONTENT
// ================================

const motivationElement =
    document.getElementById("dailyMotivation");

const challengeElement =
    document.getElementById("dailyChallenge");


if (motivationElement) {
    motivationElement.textContent =
        getDailyContent(motivations);
}


if (challengeElement) {
    challengeElement.textContent =
        getDailyContent(challenges);
            }
