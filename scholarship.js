
/* =========================================
PORTICO KAKUMA — ABOUT.JS
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
       SCHOLARSHIP SEARCH, FILTER & PAGINATION
    ===================================================== */

    const scholarshipSearch =
        document.getElementById("scholarshipSearch");

    const countryFilter =
        document.getElementById("countryFilter");

    const levelFilter =
        document.getElementById("levelFilter");

    const fundedFilter =
        document.getElementById("fundedFilter");

    const searchButton =
        document.getElementById("SearchBtN");

    const resetSearchButton =
        document.getElementById("resetSearchBtn");

    const searchMessage =
        document.getElementById("searchMessage");

    const resultsCount =
        document.getElementById("resultsCount");

    const scholarshipCards =
        Array.from(
            document.querySelectorAll(".scholarship-card")
        );


    /* =====================================================
       OPEN OPPORTUNITIES BUTTON
    ===================================================== */

    const openOpportunitiesButton =
        document.getElementById("openOpportunitiesBtn");


    /* =====================================================
       PAGINATION ELEMENTS
    ===================================================== */

    const previousPageButton =
        document.getElementById("previousPageBtn");

    const nextPageButton =
        document.getElementById("nextPageBtn");

    const paginationNumbers =
        document.getElementById("paginationNumbers");


    /* =====================================================
       PAGINATION SETTINGS
    ===================================================== */

    const opportunitiesPerPage = 6;

    let currentPage = 1;

    let filteredScholarships = [];


    /* =====================================================
       GET FILTERED SCHOLARSHIPS
    ===================================================== */

    function getFilteredScholarships() {

        const keyword =
            scholarshipSearch.value
                .trim()
                .toLowerCase();

        const selectedCountry =
            countryFilter.value
                .trim()
                .toLowerCase();

        const selectedLevel =
            levelFilter.value
                .trim()
                .toLowerCase();

        const selectedFunding =
            fundedFilter.value
                .trim()
                .toLowerCase();


        /*
           Check whether the Open Opportunities
           button is currently active.
        */

        const showOpenOnly =
            openOpportunitiesButton &&
            openOpportunitiesButton.classList.contains("active");


        return scholarshipCards.filter(card => {


            /* ---------------------------------------------
               GET CARD INFORMATION
            --------------------------------------------- */

            const name =
                (card.dataset.name || "")
                    .toLowerCase();

            const country =
                (card.dataset.country || "")
                    .toLowerCase();

            const level =
                (card.dataset.level || "")
                    .toLowerCase();

            const funded =
                (card.dataset.funded || "")
                    .toLowerCase();


            /*
               Get the scholarship status.

               Example:
               data-status="open"
               data-status="closed"
            */

            const status =
                (card.dataset.status || "")
                    .toLowerCase();


            const cardText =
                card.textContent.toLowerCase();


            /* ---------------------------------------------
               KEYWORD MATCH
            --------------------------------------------- */

            const matchesKeyword =
                keyword === "" ||
                cardText.includes(keyword) ||
                name.includes(keyword) ||
                country.includes(keyword) ||
                level.includes(keyword) ||
                funded.includes(keyword);


            /* ---------------------------------------------
               COUNTRY MATCH
            --------------------------------------------- */

            const matchesCountry =
                selectedCountry === "" ||
                country.includes(selectedCountry);


            /* ---------------------------------------------
               STUDY LEVEL MATCH
            --------------------------------------------- */

            let matchesLevel = true;


            if (selectedLevel !== "") {

                if (level.includes("all levels")) {

                    matchesLevel = true;

                } else if (
                    level.includes(selectedLevel)
                ) {

                    matchesLevel = true;

                } else {

                    matchesLevel = false;

                }

            }


            /* ---------------------------------------------
               FUNDING MATCH
            --------------------------------------------- */

            const matchesFunding =
                selectedFunding === "" ||
                funded.includes(selectedFunding);


            /* ---------------------------------------------
               OPEN OPPORTUNITIES MATCH
            --------------------------------------------- */

            const matchesOpenStatus =
                !showOpenOnly ||
                status === "open";


            /* ---------------------------------------------
               FINAL MATCH
            --------------------------------------------- */

            return (
                matchesKeyword &&
                matchesCountry &&
                matchesLevel &&
                matchesFunding &&
                matchesOpenStatus
            );

        });

    }


    /* =====================================================
       DISPLAY CURRENT PAGE
    ===================================================== */

    function displayCurrentPage() {

        const totalPages =
            Math.ceil(
                filteredScholarships.length /
                opportunitiesPerPage
            );


        /* ---------------------------------------------
           KEEP PAGE NUMBER VALID
        --------------------------------------------- */

        if (totalPages === 0) {

            currentPage = 1;

        } else if (currentPage > totalPages) {

            currentPage = totalPages;

        }


        /* ---------------------------------------------
           CALCULATE CURRENT CARDS
        --------------------------------------------- */

        const startIndex =
            (currentPage - 1) *
            opportunitiesPerPage;

        const endIndex =
            startIndex +
            opportunitiesPerPage;


        const cardsForCurrentPage =
            filteredScholarships.slice(
                startIndex,
                endIndex
            );


        /* ---------------------------------------------
           HIDE ALL CARDS
        --------------------------------------------- */

        scholarshipCards.forEach(card => {

            card.style.display = "none";

        });


        /* ---------------------------------------------
           SHOW CURRENT 6 CARDS
        --------------------------------------------- */

        cardsForCurrentPage.forEach(card => {

            card.style.display = "";

        });


        /* ---------------------------------------------
           UPDATE RESULTS COUNT
        --------------------------------------------- */

        if (resultsCount) {

            resultsCount.textContent =
                `${filteredScholarships.length} ${
                    filteredScholarships.length === 1
                        ? "opportunity"
                        : "opportunities"
                }`;

        }


        /* ---------------------------------------------
           UPDATE SEARCH MESSAGE
        --------------------------------------------- */

        if (searchMessage) {

            if (filteredScholarships.length === 0) {

                searchMessage.textContent =
                    "No scholarship opportunities match your search.";

            } else {

                searchMessage.textContent =
                    `Showing ${
                        startIndex + 1
                    }–${
                        Math.min(
                            endIndex,
                            filteredScholarships.length
                        )
                    } of ${
                        filteredScholarships.length
                    } ${
                        filteredScholarships.length === 1
                            ? "opportunity"
                            : "opportunities"
                    }.`;

            }

        }


        /* ---------------------------------------------
           UPDATE PAGINATION
        --------------------------------------------- */

        createPagination(totalPages);

    }


    /* =====================================================
       CREATE PAGINATION
    ===================================================== */

    function createPagination(totalPages) {



        paginationNumbers.innerHTML = "";


        /* ---------------------------------------------
           ONLY ONE PAGE
        --------------------------------------------- */

        if (totalPages <= 1) {

            if (previousPageButton) {
                previousPageButton.style.display = "none";
            }

            if (nextPageButton) {
                nextPageButton.style.display = "none";
            }

            paginationNumbers.style.display = "none";

            return;

        }


        /* ---------------------------------------------
           SHOW PAGINATION
        --------------------------------------------- */

        if (previousPageButton) {
            previousPageButton.style.display = "inline-flex";
        }

        if (nextPageButton) {
            nextPageButton.style.display = "inline-flex";
        }

        paginationNumbers.style.display = "flex";


        /* ---------------------------------------------
           PREVIOUS BUTTON
        --------------------------------------------- */

        if (previousPageButton) {

            previousPageButton.disabled =
                currentPage === 1;

        }


        /* ---------------------------------------------
   PAGE NUMBERS
--------------------------------------------- */

for (
    let page = 1;
    page <= totalPages;
    page++
) {

    const pageButton =
        document.createElement("button");

    pageButton.type = "button";

    pageButton.className =
        "pagination-number";

    pageButton.textContent =
        page;

    pageButton.setAttribute(
        "aria-label",
        `Go to page ${page}`
    );

    /* Active page */

    if (page === currentPage) {

        pageButton.classList.add("active");

        pageButton.setAttribute(
            "aria-current",
            "page"
        );

    }

    /* Page click */

    pageButton.addEventListener(
        "click",
        function() {

            currentPage = page;

            displayCurrentPage();

            scrollToScholarships();

        }
    );

    paginationNumbers.appendChild(
        pageButton
    );

}

/* ---------------------------------------------
   CENTER ACTIVE PAGE INSIDE THE PAGINATION BAR
   (scrolls only the bar, never the whole page)
--------------------------------------------- */

const activeButton =
    paginationNumbers.querySelector(".active");

if (activeButton) {

    paginationNumbers.scrollTo({
        left:
            activeButton.offsetLeft -
            paginationNumbers.clientWidth / 2 +
            activeButton.clientWidth / 2,
        behavior: "smooth"
    });

}


        /* ---------------------------------------------
           NEXT BUTTON
        --------------------------------------------- */

        if (nextPageButton) {

            nextPageButton.disabled =
                currentPage === totalPages;

        }

    }


    /* =====================================================
       APPLY SEARCH & FILTERS
    ===================================================== */

    function applyScholarshipFilters() {

        filteredScholarships =
            getFilteredScholarships();


        currentPage = 1;


        displayCurrentPage();

    }


    /* =====================================================
       SCROLL TO SCHOLARSHIP RESULTS
    ===================================================== */

    function scrollToScholarships() {

        const scholarshipResults =
            document.getElementById(
                "scholarship-results"
            );


        if (scholarshipResults) {

            scholarshipResults.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }


    /* =====================================================
       SEARCH BUTTON
    ===================================================== */

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            function() {

                applyScholarshipFilters();

                setTimeout(function() {

                    scrollToScholarships();

                }, 100);

            }
        );

    }


    /* =====================================================
       ENTER KEY
    ===================================================== */

    if (scholarshipSearch) {

        scholarshipSearch.addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Enter") {

                    applyScholarshipFilters();

                    setTimeout(function() {

                        scrollToScholarships();

                    }, 100);

                }

            }
        );

    }


    /* =====================================================
       OPEN OPPORTUNITIES BUTTON
    ===================================================== */

    if (openOpportunitiesButton) {

        openOpportunitiesButton.addEventListener(
            "click",
            function() {

                /*
                   Turn Open Opportunities mode
                   on or off.
                */

                this.classList.toggle("active");


                /*
                   Start from page 1.
                */

                currentPage = 1;


                /*
                   Apply the open-only filter.
                */

                filteredScholarships =
                    getFilteredScholarships();


                displayCurrentPage();


                /*
                   Move user to the scholarship results.
                */

                setTimeout(function() {

                    scrollToScholarships();

                }, 100);

            }
        );

    }


    /* =====================================================
       PREVIOUS PAGE
    ===================================================== */

    if (previousPageButton) {

        previousPageButton.addEventListener(
            "click",
            function() {

                if (currentPage > 1) {

                    currentPage--;

                    displayCurrentPage();

                    scrollToScholarships();

                }

            }
        );

    }


    /* =====================================================
       NEXT PAGE
    ===================================================== */

    if (nextPageButton) {

        nextPageButton.addEventListener(
            "click",
            function() {

                const totalPages =
                    Math.ceil(
                        filteredScholarships.length /
                        opportunitiesPerPage
                    );


                if (currentPage < totalPages) {

                    currentPage++;

                    displayCurrentPage();

                    scrollToScholarships();

                }

            }
        );

    }


    /* =====================================================
       RESET SEARCH & FILTERS
    ===================================================== */

    if (resetSearchButton) {

        resetSearchButton.addEventListener(
            "click",
            function() {


                /* Clear keyword */

                scholarshipSearch.value = "";


                /* Reset filters */

                countryFilter.value = "";

                levelFilter.value = "";

                fundedFilter.value = "";


                /*
                   Turn OFF Open Opportunities
                   when Reset is clicked.
                */

                if (
                    openOpportunitiesButton &&
                    openOpportunitiesButton.classList.contains("active")
                ) {

                    openOpportunitiesButton.classList.remove("active");

                }


                /* Return to first page */

                currentPage = 1;


                /* Get all scholarships */

                filteredScholarships =
                    getFilteredScholarships();


                /* Display first 6 */

                displayCurrentPage();

            }
        );

    }


    /* =====================================================
       INITIAL DISPLAY
    ===================================================== */

    filteredScholarships =
        getFilteredScholarships();

    displayCurrentPage();

  
    /* =========================================
       SCHOLARSHIP STATISTICS
    ========================================= */

    async function loadScholarshipStats() {
        try {
            const [
                { getApps, initializeApp },
                { getFirestore, doc, getDoc }
            ] = await Promise.all([
                import("https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js"),
                import("https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js")
            ]);

            const firebaseConfig = {
                apiKey: "AIzaSyAoH3X26Hx8jFjaCJcknuB6Kgx7u10nVUE",
                authDomain: "first-webproject-865a5.firebaseapp.com",
                projectId: "first-webproject-865a5",
                storageBucket: "first-webproject-865a5.firebasestorage.app",
                messagingSenderId: "586929157801",
                appId: "1:586929157801:web:46dcd3fee9343ba6895bb8",
                measurementId: "G-DHPQ1CL34X"
            };

            const app = getApps().length
                ? getApps()[0]
                : initializeApp(firebaseConfig);

            const db = getFirestore(app);

            const statsRef = doc(db, "publicStats", "community");
            const snapshot = await getDoc(statsRef);

            if (!snapshot.exists()) {
                console.error("Missing Firestore document: publicStats/community");
                return;
            }

            const stats = snapshot.data();

            const registered = Number(stats.registeredUsers) || 0;
            const guests = Number(stats.guestUsers) || 0;
            const total = Number(stats.totalUsers) || registered + guests;
            const females = Number(stats.femaleUsers) || 0;
            const males = Number(stats.maleUsers) || 0;

            function animateCounter(element, target) {
                if (!element) return;

                const duration = 1000;
                const startTime = performance.now();

                function update(now) {
                    const progress = Math.min(
                        (now - startTime) / duration,
                        1
                    );

                    const eased = 1 - Math.pow(1 - progress, 3);

                    element.textContent = Math.round(
                        target * eased
                    ).toLocaleString();

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    }
                }

                requestAnimationFrame(update);
            }

            // Match the IDs in your actual HTML.
            animateCounter(
                document.getElementById("registeredUsers"),
                registered
            );

            animateCounter(
                document.getElementById("guestUsers"),
                guests
            );

            animateCounter(
                document.getElementById("totalUsers"),
                total
            );

            animateCounter(
                document.getElementById("femaleCount"),
                females
            );

            animateCounter(
                document.getElementById("maleCount"),
                males
            );

            // Match the pie chart ID in your HTML.
            const chart = document.getElementById("userPieChart");
            const chartTotal = registered + guests;

            if (chart) {
                if (chartTotal > 0) {
                    const registeredPercent =
                        (registered / chartTotal) * 100;

                    chart.style.background = `conic-gradient(
                        #4359B8 0% ${registeredPercent}%,
                        #D99757 ${registeredPercent}% 100%
                    )`;
                } else {
                    chart.style.background =
                        "conic-gradient(#d1d5db 0% 100%)";
                }

                chart.setAttribute(
                    "aria-label",
                    `Registered users: ${registered}; guest users: ${guests}; total users: ${total}`
                );
            }

        } catch (error) {
            console.error("Could not load scholarship statistics:", error);
        }
    }

    loadScholarshipStats();
