
/* =========================================
PORTICO KAKUMA — SCHOLARSHIP.JS
Navigation + Authentication + Notifications
Scholarship Search + Filters + Pagination
========================================= */

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

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
    setDoc
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

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================
2. MOBILE NAVIGATION + NOTIFICATIONS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const hamburgerBtn =
        document.getElementById("hamburgerBtn");

    const closeDrawerBtn =
        document.getElementById("closeDrawerBtn");

    const mobileDrawer =
        document.getElementById("mobileDrawer");

    const drawerOverlay =
        document.getElementById("drawerOverlay");


    /* =====================================
       LOGOUT BUTTONS
    ===================================== */

    const drawerLogoutContainer =
        document.getElementById("drawerLogoutContainer");

    const desktopLogoutContainer =
        document.getElementById("desktopLogoutContainer");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const desktopLogoutBtn =
        document.getElementById("desktopLogoutBtn");


    async function handleLogout() {

        try {

            await signOut(auth);

            mobileDrawer?.classList.remove("open");
            drawerOverlay?.classList.remove("show");

            window.location.href = "access.html";

        } catch (error) {

            console.error("Logout failed:", error);

            alert("Unable to log out. Please try again.");

        }

    }


    logoutBtn?.addEventListener("click", handleLogout);

    desktopLogoutBtn?.addEventListener("click", handleLogout);


    /* =====================================
       NOTIFICATION ELEMENTS
    ===================================== */

    const notifToggle =
        document.getElementById("notifToggle");

    const notifDropdown =
        document.getElementById("notifDropdown");

    const notifBadge =
        notifToggle?.querySelector(".notif-badge");

    const notifList =
        notifDropdown?.querySelector(".notif-list");


    let currentUser = null;

    let notifications = [];

    let readNotificationIds = new Set();

    let stopNotificationsListener = null;

    let stopReadListener = null;


    /* =====================================
       MOBILE DRAWER
    ===================================== */

    function toggleDrawer() {

        if (!mobileDrawer || !drawerOverlay) return;

        mobileDrawer.classList.toggle("open");

        drawerOverlay.classList.toggle("show");

    }


    hamburgerBtn?.addEventListener("click", toggleDrawer);

    closeDrawerBtn?.addEventListener("click", toggleDrawer);

    drawerOverlay?.addEventListener("click", toggleDrawer);


    document.querySelectorAll(".sub-nav-list a").forEach(link => {

        link.addEventListener("click", () => {

            mobileDrawer?.classList.remove("open");

            drawerOverlay?.classList.remove("show");

        });

    });


    /* =====================================
       NOTIFICATION BADGE
    ===================================== */

    function updateBadge() {

        if (!notifBadge) return;

        const unreadCount = notifications.filter(
            notification =>
                !readNotificationIds.has(notification.id)
        ).length;

        notifBadge.textContent = unreadCount;

        notifBadge.style.display =
            unreadCount > 0 ? "inline-flex" : "none";

    }


    /* =====================================
       DISPLAY NOTIFICATIONS
    ===================================== */

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

            title.textContent =
                notification.title || "Notification";


            const message = document.createElement("p");

            message.textContent =
                notification.message || "";


            item.appendChild(title);

            item.appendChild(message);


            if (!readNotificationIds.has(notification.id)) {

                item.classList.add("unread");

            }


            notifList.appendChild(item);

        });


        updateBadge();

    }


    /* =====================================
       SAVE READ STATUS
    ===================================== */

    async function markNotificationsAsRead() {

        if (!currentUser || notifications.length === 0) return;


        const newReadIds = notifications

            .filter(notification =>
                !readNotificationIds.has(notification.id)
            )

            .map(notification => notification.id);


        if (newReadIds.length === 0) return;


        newReadIds.forEach(id => {

            readNotificationIds.add(id);

        });


        renderNotifications();


        try {

            const readRef = doc(
                db,
                "NotificationReads",
                currentUser.uid
            );

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

            console.error(
                "Could not save notification read status:",
                error
            );


            newReadIds.forEach(id => {

                readNotificationIds.delete(id);

            });


            renderNotifications();

        }

    }


    /* =====================================
       NOTIFICATION DROPDOWN
    ===================================== */

    if (notifToggle && notifDropdown) {

        notifToggle.addEventListener("click", async event => {

            event.stopPropagation();


            const opening =
                !notifDropdown.classList.contains("show");


            notifDropdown.classList.toggle("show");


            if (opening) {

                await markNotificationsAsRead();

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

            }

        });

    }


    /* =====================================
       LOAD NOTIFICATIONS FROM FIRESTORE
    ===================================== */

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


                notifications.sort((a, b) => {

                    const dateA =
                        a.createdAt?.toMillis?.() || 0;

                    const dateB =
                        b.createdAt?.toMillis?.() || 0;

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


    /* =====================================
       LOAD USER READ STATUS
    ===================================== */

    function listenForReadStatus(user) {

        const readRef = doc(
            db,
            "NotificationReads",
            user.uid
        );


        stopReadListener = onSnapshot(

            readRef,

            snapshot => {

                const saved = snapshot.exists()

                    ? snapshot.data().readNotifications || {}

                    : {};


                readNotificationIds = new Set(

                    Object.keys(saved).filter(
                        id => saved[id] === true
                    )

                );


                renderNotifications();

            },

            error => {

                console.error(
                    "Could not load read status:",
                    error
                );

            }

        );

    }


    /* =====================================
       AUTHENTICATION SESSION
       Uses existing Firebase session.
       Does not create another account.
    ===================================== */

    onAuthStateChanged(auth, user => {

        currentUser = user;


        const showLogout =
            !!user && !user.isAnonymous;


        if (drawerLogoutContainer) {

            drawerLogoutContainer.hidden = !showLogout;

        }


        if (desktopLogoutContainer) {

            desktopLogoutContainer.hidden = !showLogout;

        }


        /* Stop previous listeners */

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

            listenForNotifications();

        }

    });

});

/* =========================================
   PORTICO KAKUMA
   SCHOLARSHIPS PAGE: REMEMBER AND RESTORE THE PLACE
   Goes in the script used by scholarship.html
   (add it to the end of scholarship.js).
   NOT in scholarship-details.js.
========================================= */

(function () {

    const RETURN_KEY = "porticoReturnState";

    /* ---------- 1. SAVE THE PLACE WHEN "VIEW DETAILS" IS CLICKED ---------- */

    function collectFields() {
        const fields = {};

        document.querySelectorAll("input, select, textarea").forEach(el => {
            if (!el.id) return;
            if (["password", "email", "file"].includes(el.type)) return;

            fields[el.id] =
                el.type === "checkbox" || el.type === "radio"
                    ? el.checked
                    : el.value;
        });

        return fields;
    }

    document.addEventListener("click", function (event) {

        const link = event.target.closest("a");

        if (!link) return;
        if (!(link.getAttribute("href") || "").includes("scholarship-details.html")) return;

        const card = link.closest(".scholarship-card");

        const state = {
            pageUrl: window.location.pathname + window.location.search,
            cardId: card ? card.id : "",
            scrollY: window.scrollY,
            fields: collectFields(),
            restore: false
        };

        try {
            sessionStorage.setItem(RETURN_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Could not remember the page position:", error);
        }
    });

    /* ---------- 2. RESTORE THE PLACE WHEN THE USER COMES BACK ---------- */

    function restoreFields(fields) {
        Object.keys(fields).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const value = fields[id];

            if (el.type === "checkbox" || el.type === "radio") {
                el.checked = value;
            } else {
                el.value = value;
            }

            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }

    function isVisible(el) {
        return el && el.offsetParent !== null;
    }

    // Moves through the pages of results until the saved card appears
    function findCard(state, attempt) {

        const card = state.cardId
            ? document.getElementById(state.cardId)
            : null;

        if (isVisible(card)) {
            card.scrollIntoView({ block: "center" });
            card.classList.add("returned-highlight");
            setTimeout(() => card.classList.remove("returned-highlight"), 2500);
            return;
        }

        const nextButton = document.getElementById("nextPageBtn");

        if (card && nextButton && !nextButton.disabled && attempt < 40) {
            nextButton.click();
            setTimeout(() => findCard(state, attempt + 1), 120);
            return;
        }

        // The card could not be found: go back to the old scroll position
        window.scrollTo(0, state.scrollY || 0);
    }

    function restorePlace() {

        // Only run on the scholarships page
        if (!document.querySelector(".scholarship-card")) return;

        let state = null;

        try {
            state = JSON.parse(sessionStorage.getItem(RETURN_KEY) || "null");
        } catch (error) {
            return;
        }

        if (!state || !state.restore) return;

        // Use it once, then forget it
        sessionStorage.removeItem(RETURN_KEY);

        // Wait for scholarship.js to finish building the page
        setTimeout(() => restoreFields(state.fields || {}), 150);
        setTimeout(() => findCard(state, 0), 450);
    }

    window.addEventListener("load", restorePlace);

    /* ---------- 3. HIGHLIGHT STYLE FOR THE RETURNED CARD ---------- */

    const style = document.createElement("style");
    style.textContent =
        ".returned-highlight{outline:3px solid #B88728;outline-offset:4px;}";
    document.head.appendChild(style);

})();


/* =========================================
   PORTICO KAKUMA
   PRIORITISED SCHOLARSHIPS
========================================= */

const PRIORITY_STORAGE_KEY = "porticoPrioritisedScholarships";

function initialisePriorityFeature() {

    const priorityList = document.getElementById("prioritised-list");
    const priorityCount = document.getElementById("prioritised-count");
    const emptyMessage = document.getElementById("prioritised-empty");

    if (!priorityList || !priorityCount || !emptyMessage) {
        console.error("Priority section HTML elements were not found.");
        return;
    }

    // GET ALL SCHOLARSHIP CARDS
    const scholarshipCards = Array.from(
        document.querySelectorAll(".scholarship-card")
    );

    // CREATE A LOOKUP USING EACH CARD'S ID
    const cardsById = new Map();

    scholarshipCards.forEach(card => {
        if (card.id) {
            cardsById.set(card.id, card);
        }
    });

    // LOAD SAVED SCHOLARSHIPS
    function loadPrioritised() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(PRIORITY_STORAGE_KEY) || "[]"
            );

            if (!Array.isArray(saved)) {
                return [];
            }

            // Ignore scholarships that no longer exist
            return [...new Set(
                saved.filter(id => cardsById.has(id))
            )];

        } catch (error) {
            console.error("Could not load prioritised scholarships:", error);
            return [];
        }
    }

    let prioritisedIds = loadPrioritised();

    // SAVE TO BROWSER STORAGE
    function savePrioritised() {
        try {
            localStorage.setItem(
                PRIORITY_STORAGE_KEY,
                JSON.stringify(prioritisedIds)
            );
        } catch (error) {
            console.error("Could not save prioritised scholarships:", error);
        }
    }

    // GET SCHOLARSHIP NAME
    function getScholarshipName(card) {
        return (
            card.dataset.name ||
            card.querySelector("h3")?.textContent.trim() ||
            card.id
        );
    }

    // UPDATE ALL STAR BUTTONS
    function updateStars() {

        document.querySelectorAll(".priority-star").forEach(button => {

            const priorityId = button.dataset.priorityId;
            const isPrioritised = prioritisedIds.includes(priorityId);

            button.setAttribute(
                "aria-pressed",
                String(isPrioritised)
            );

            button.textContent = isPrioritised ? "★" : "☆";

            const card = cardsById.get(priorityId);

            const name = card
                ? getScholarshipName(card)
                : "this opportunity";

            button.setAttribute(
                "aria-label",
                isPrioritised
                    ? `Remove ${name} from prioritised opportunities`
                    : `Prioritise ${name}`
            );

            button.title = isPrioritised
                ? "Remove from prioritised opportunities"
                : "Save this opportunity";
        });
    }

    // CREATE A SAVED SCHOLARSHIP ENTRY
    function createPriorityItem(card) {

        const item = document.createElement("div");
        item.className = "prioritised-item";

        const info = document.createElement("div");
        info.className = "prioritised-item-info";

        const heading = document.createElement("h3");
        heading.textContent = getScholarshipName(card);

        const description = document.createElement("p");

        const details = [
            card.dataset.country,
            card.dataset.level,
            card.dataset.funded
        ].filter(Boolean);

        description.textContent = details.join(" · ");

        const viewLink = document.createElement("a");
        viewLink.className = "prioritised-view-link";
        viewLink.href = `#${card.id}`;
        viewLink.textContent = "View opportunity";

        info.appendChild(heading);

        if (details.length > 0) {
            info.appendChild(description);
        }

        item.appendChild(info);
        item.appendChild(viewLink);

        return item;
    }

    // DISPLAY PRIORITISED SCHOLARSHIPS
    function renderPrioritised() {

        // Remove previously generated entries
        priorityList
            .querySelectorAll(".prioritised-item")
            .forEach(item => item.remove());

        // Update saved count
        const count = prioritisedIds.length;

        priorityCount.textContent =
            `${count} ${count === 1 ? "saved" : "saved"}`;

        // Show or hide empty message
        emptyMessage.hidden = count > 0;

        // Display each saved scholarship
        prioritisedIds.forEach(id => {

            const card = cardsById.get(id);

            if (card) {
                const item = createPriorityItem(card);
                priorityList.appendChild(item);
            }
        });
    }

    // HANDLE STAR CLICKS
    document.addEventListener("click", function(event) {

        const button = event.target.closest(".priority-star");

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        const priorityId = button.dataset.priorityId;

        // Check that the matching card exists
        if (!priorityId || !cardsById.has(priorityId)) {
            console.error(
                "No scholarship card matches this priority ID:",
                priorityId
            );
            return;
        }

        // REMOVE IF ALREADY SAVED
        if (prioritisedIds.includes(priorityId)) {

            prioritisedIds = prioritisedIds.filter(
                id => id !== priorityId
            );

        } else {

            // ADD IF NOT ALREADY SAVED
            prioritisedIds.push(priorityId);
        }

        // SAVE AND REFRESH THE DISPLAY
        savePrioritised();
        updateStars();
        renderPrioritised();
    });

    // INITIAL PAGE DISPLAY
    updateStars();
    renderPrioritised();
}

// START WHEN HTML IS READY
if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initialisePriorityFeature
    );

} else {

    initialisePriorityFeature();
}



/* =========================================
   SCHOLARSHIP ELEMENTS
========================================= */

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

const scholarshipCards = Array.from(
    document.querySelectorAll(".scholarship-card")
);


/* =========================================
   4. OPPORTUNITY SECTIONS
========================================= */

const openOpportunitiesButton =
    document.getElementById("openOpportunitiesBtn");

const upcomingOpportunitiesButton =
    document.getElementById("upcomingOpportunitiesBtn");


/*
   Currently Open is always the default section.
*/

let activeOpportunityStatus = "open";


/* =========================================
   UPDATE ACTIVE BUTTON
========================================= */

function updateOpportunityButtons() {

    if (openOpportunitiesButton) {

        openOpportunitiesButton.classList.toggle(
            "active",
            activeOpportunityStatus === "open"
        );

    }


    if (upcomingOpportunitiesButton) {

        upcomingOpportunitiesButton.classList.toggle(
            "active",
            activeOpportunityStatus === "upcoming"
        );

    }

}


/* Select Currently Open immediately */

updateOpportunityButtons();


/* =========================================
   5. PERSONALISED LEVELS
========================================= */

const MY_LEVELS = "__my_levels__";

const personalisationNotice =
    document.getElementById("personalisationNotice");

const personalisationText =
    document.getElementById("personalisationText");


function normaliseLevel(text) {

    return String(text || "")

        .replace(/[’‘]/g, "'")

        .replace(/\s+/g, " ")

        .trim()

        .toLowerCase();

}


function getSavedPersonalLevels() {

    try {

        const saved = JSON.parse(
            localStorage.getItem("questionnaireLevels")
        );


        if (!Array.isArray(saved)) return [];


        if (
            saved.some(
                level =>
                    normaliseLevel(level) === "all levels"
            )
        ) {

            return [];

        }


        return saved;

    } catch (error) {

        return [];

    }

}


const personalLevels = getSavedPersonalLevels();


/* Add My Levels to the dropdown */

if (levelFilter && personalLevels.length > 0) {

    const myOption = document.createElement("option");

    myOption.value = MY_LEVELS;

    myOption.textContent = "My levels";

    levelFilter.insertBefore(
        myOption,
        levelFilter.firstChild
    );

    levelFilter.value = MY_LEVELS;

}


function personalisationIsOn() {

    return (

        personalLevels.length > 0 &&

        levelFilter &&

        levelFilter.value === MY_LEVELS

    );

}


function cardMatchesPersonalLevels(card) {

    const tokens = (card.dataset.level || "")

        .split(",")

        .map(normaliseLevel)

        .filter(Boolean);


    if (
        tokens.length === 0 ||
        tokens.includes("varies")
    ) {

        return true;

    }


    const wanted = personalLevels.map(normaliseLevel);


    return tokens.some(token =>
        wanted.includes(token)
    );

}


function updatePersonalisationNotice() {

    if (!personalisationNotice) return;


    personalisationNotice.hidden =
        !personalisationIsOn();


    if (personalisationText) {

        personalisationText.textContent =
            "Showing: " + personalLevels.join(", ");

    }

}


updatePersonalisationNotice();


/* =========================================
   6. PAGINATION ELEMENTS
========================================= */

const previousPageButton =
    document.getElementById("previousPageBtn");

const nextPageButton =
    document.getElementById("nextPageBtn");

const paginationNumbers =
    document.getElementById("paginationNumbers");


/* =========================================
   7. PAGINATION SETTINGS
========================================= */

const opportunitiesPerPage = 6;

let currentPage = 1;

let filteredScholarships = [];


/* =========================================
   8. GET FILTERED SCHOLARSHIPS
========================================= */

function getFilteredScholarships() {

    updatePersonalisationNotice();


    const keyword =
        (scholarshipSearch?.value || "")
            .trim()
            .toLowerCase();


    const selectedCountry =
        (countryFilter?.value || "")
            .trim()
            .toLowerCase();


    const selectedLevel =

        levelFilter?.value === MY_LEVELS

            ? ""

            : (levelFilter?.value || "")
                .trim()
                .toLowerCase();


    const selectedFunding =
        (fundedFilter?.value || "")
            .trim()
            .toLowerCase();


    return scholarshipCards.filter(card => {


        /* =================================
           CARD INFORMATION
        ================================= */

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


        const status =
            (card.dataset.status || "")
                .toLowerCase();


        const cardText =
            card.textContent.toLowerCase();


        /* =================================
           KEYWORD MATCH
        ================================= */

        const matchesKeyword =

            keyword === "" ||

            cardText.includes(keyword) ||

            name.includes(keyword) ||

            country.includes(keyword) ||

            level.includes(keyword) ||

            funded.includes(keyword);


        /* =================================
           COUNTRY MATCH
        ================================= */

        const matchesCountry =

            selectedCountry === "" ||

            country.includes(selectedCountry);


        /* =================================
           STUDY LEVEL MATCH
        ================================= */

        let matchesLevel = true;


        if (selectedLevel !== "") {

            if (level.includes("all levels")) {

                matchesLevel = true;

            } else if (level.includes(selectedLevel)) {

                matchesLevel = true;

            } else {

                matchesLevel = false;

            }

        }


        /* =================================
           FUNDING MATCH
        ================================= */

        const matchesFunding =

            selectedFunding === "" ||

            funded.includes(selectedFunding);


        /* =================================
           OPPORTUNITY STATUS MATCH
        ================================= */

        const matchesOpportunityStatus =

            status === activeOpportunityStatus;


        /* =================================
           PERSONALISED LEVEL MATCH
        ================================= */

        const matchesPersonalisation =

            !personalisationIsOn() ||

            cardMatchesPersonalLevels(card);


        /* =================================
           FINAL MATCH
        ================================= */

        return (

            matchesKeyword &&

            matchesCountry &&

            matchesLevel &&

            matchesFunding &&

            matchesOpportunityStatus &&

            matchesPersonalisation

        );

    });

}


/* =========================================
   9. DISPLAY CURRENT PAGE
========================================= */

function displayCurrentPage() {

    const totalPages = Math.ceil(

        filteredScholarships.length /

        opportunitiesPerPage

    );


    /* Keep page number valid */

    if (totalPages === 0) {

        currentPage = 1;

    } else if (currentPage > totalPages) {

        currentPage = totalPages;

    }


    /* Calculate current cards */

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


    /* Hide all cards */

    scholarshipCards.forEach(card => {

        card.style.display = "none";

    });


    /* Show only the current six cards */

    cardsForCurrentPage.forEach(card => {

        card.style.display = "";

    });


    /* Update results count */

    if (resultsCount) {

        resultsCount.textContent =

            `${filteredScholarships.length} ${
                filteredScholarships.length === 1
                    ? "opportunity"
                    : "opportunities"
            }`;

    }


    /* Update search message */

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


    /* Update pagination */

    createPagination(totalPages);

}


/* =========================================
   10. CREATE PAGINATION
========================================= */

function createPagination(totalPages) {

    if (!paginationNumbers) return;


    paginationNumbers.innerHTML = "";


    /* Only one page */

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


    /* Show pagination */

    if (previousPageButton) {

        previousPageButton.style.display = "inline-flex";

    }


    if (nextPageButton) {

        nextPageButton.style.display = "inline-flex";

    }


    paginationNumbers.style.display = "flex";


    /* Previous button */

    if (previousPageButton) {

        previousPageButton.disabled =
            currentPage === 1;

    }


    /* Page numbers */

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


        pageButton.textContent = page;


        pageButton.setAttribute(
            "aria-label",
            `Go to page ${page}`
        );


        if (page === currentPage) {

            pageButton.classList.add("active");

            pageButton.setAttribute(
                "aria-current",
                "page"
            );

        }


        pageButton.addEventListener(
            "click",
            function() {

                currentPage = page;

                displayCurrentPage();

                scrollToScholarships();

            }
        );


        paginationNumbers.appendChild(pageButton);

    }


    /* Center active page inside pagination bar */

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


    /* Next button */

    if (nextPageButton) {

        nextPageButton.disabled =
            currentPage === totalPages;

    }

}


/* =========================================
   11. APPLY SEARCH AND FILTERS
========================================= */

function applyScholarshipFilters() {

    filteredScholarships =
        getFilteredScholarships();


    currentPage = 1;


    displayCurrentPage();

}


/* =========================================
   12. SCROLL TO RESULTS
========================================= */

function scrollToScholarships() {

    const scholarshipResults =
        document.getElementById("scholarship-results");


    if (scholarshipResults) {

        scholarshipResults.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    }

}


/* =========================================
   13. SEARCH BUTTON
========================================= */

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


/* =========================================
   14. ENTER KEY SEARCH
========================================= */

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


/* =========================================
   15. CURRENTLY OPEN BUTTON
========================================= */

if (openOpportunitiesButton) {

    openOpportunitiesButton.addEventListener(
        "click",
        function() {

            activeOpportunityStatus = "open";


            updateOpportunityButtons();


            currentPage = 1;


            applyScholarshipFilters();


            setTimeout(function() {

                scrollToScholarships();

            }, 100);

        }
    );

}


/* =========================================
   16. UPCOMING SCHOLARSHIPS BUTTON
========================================= */

if (upcomingOpportunitiesButton) {

    upcomingOpportunitiesButton.addEventListener(
        "click",
        function() {

            activeOpportunityStatus = "upcoming";


            updateOpportunityButtons();


            currentPage = 1;


            applyScholarshipFilters();


            setTimeout(function() {

                scrollToScholarships();

            }, 100);

        }
    );

}


/* =========================================
   17. PREVIOUS PAGE
========================================= */

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


/* =========================================
   18. NEXT PAGE
========================================= */

if (nextPageButton) {

    nextPageButton.addEventListener(
        "click",
        function() {

            const totalPages = Math.ceil(

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


/* =========================================
   19. RESET SEARCH AND FILTERS
========================================= */

if (resetSearchButton) {

    resetSearchButton.addEventListener(
        "click",
        function() {


            /* Clear keyword */

            if (scholarshipSearch) {

                scholarshipSearch.value = "";

            }


            /* Reset country */

            if (countryFilter) {

                countryFilter.value = "";

            }


            /* Reset funding */

            if (fundedFilter) {

                fundedFilter.value = "";

            }


            /* Reset study level */

            if (levelFilter) {

                levelFilter.value = "";

            }


            /* Restore My Levels if available */

            if (personalLevels.length > 0 && levelFilter) {

                levelFilter.value = MY_LEVELS;

            }


            /*
               IMPORTANT:
               Do not reset activeOpportunityStatus.
               The user stays in the section they selected.
            */

            updateOpportunityButtons();


            currentPage = 1;


            applyScholarshipFilters();

        }
    );

}


/* =========================================
   20. INITIAL DISPLAY
========================================= */

/*
   The page starts with Currently Open selected.
   Only cards marked data-status="open" appear.
*/

activeOpportunityStatus = "open";

updateOpportunityButtons();


filteredScholarships =
    getFilteredScholarships();


displayCurrentPage();


/* =========================================
   21. SCHOLARSHIP STATISTICS
========================================= */

async function loadScholarshipStats() {

    try {

        const statsRef =
            doc(db, "publicStats", "community");


        const snapshot =
            await getDoc(statsRef);


        if (!snapshot.exists()) {

            console.error(
                "Missing Firestore document: publicStats/community"
            );

            return;

        }


        const stats = snapshot.data();


        const registered =
            Number(stats.registeredUsers) || 0;


        const guests =
            Number(stats.guestUsers) || 0;


        const total =
            Number(stats.totalUsers) ||
            registered + guests;


        const females =
            Number(stats.femaleUsers) || 0;


        const males =
            Number(stats.maleUsers) || 0;


        /* =================================
           ANIMATE COUNTERS
        ================================= */

        function animateCounter(element, target) {

            if (!element) return;


            const duration = 1000;

            const startTime = performance.now();


            function update(now) {

                const progress = Math.min(

                    (now - startTime) / duration,

                    1

                );


                const eased =
                    1 - Math.pow(1 - progress, 3);


                element.textContent = Math.round(

                    target * eased

                ).toLocaleString();


                if (progress < 1) {

                    requestAnimationFrame(update);

                }

            }


            requestAnimationFrame(update);

        }


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


        /* =================================
           USER PIE CHART
        ================================= */

        const chart =
            document.getElementById("userPieChart");


        const chartTotal =
            registered + guests;


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

        console.error(
            "Could not load scholarship statistics:",
            error
        );

    }

}


loadScholarshipStats();
