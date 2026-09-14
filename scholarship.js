/* =====================================================
   SCHOLARSHIP SEARCH, FILTER & PAGINATION
===================================================== */


/* =====================================================
   GET HTML ELEMENTS
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
           FINAL MATCH
        --------------------------------------------- */

        return (
            matchesKeyword &&
            matchesCountry &&
            matchesLevel &&
            matchesFunding
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
       CALCULATE CARDS FOR CURRENT PAGE
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
       SHOW ONLY CURRENT 6
    --------------------------------------------- */

    cardsForCurrentPage.forEach(card => {

        card.style.display = "";

    });


    /* ---------------------------------------------
       UPDATE RESULTS COUNT
    --------------------------------------------- */

    resultsCount.textContent =
        `${filteredScholarships.length} ${
            filteredScholarships.length === 1
                ? "opportunity"
                : "opportunities"
        }`;


    /* ---------------------------------------------
       UPDATE SEARCH MESSAGE
    --------------------------------------------- */

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

        previousPageButton.style.display = "none";

        nextPageButton.style.display = "none";

        paginationNumbers.style.display = "none";

        return;
    }


    /* ---------------------------------------------
       SHOW PAGINATION
    --------------------------------------------- */

    previousPageButton.style.display =
        "inline-flex";

    nextPageButton.style.display =
        "inline-flex";

    paginationNumbers.style.display =
        "flex";


    /* ---------------------------------------------
       PREVIOUS BUTTON
    --------------------------------------------- */

    previousPageButton.disabled =
        currentPage === 1;


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
       NEXT BUTTON
    --------------------------------------------- */

    nextPageButton.disabled =
        currentPage === totalPages;
}


/* =====================================================
   APPLY SEARCH & FILTERS
===================================================== */

function applyScholarshipFilters() {

    filteredScholarships =
        getFilteredScholarships();


    /* Always start search results
       from page 1 */

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

searchButton.addEventListener(
    "click",
    applyScholarshipFilters
);


/* =====================================================
   ENTER KEY
===================================================== */

scholarshipSearch.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            applyScholarshipFilters();
        }
    }
);


/* =====================================================
   PREVIOUS PAGE
===================================================== */

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


/* =====================================================
   NEXT PAGE
===================================================== */

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


/* =====================================================
   RESET SEARCH & FILTERS
===================================================== */

resetSearchButton.addEventListener(
    "click",
    function() {

        /* Clear keyword */

        scholarshipSearch.value = "";


        /* Reset filters */

        countryFilter.value = "";

        levelFilter.value = "";

        fundedFilter.value = "";


        /* Return to first page */

        currentPage = 1;


        /* Get all scholarships */

        filteredScholarships =
            getFilteredScholarships();


        /* Display first 6 */

        displayCurrentPage();
    }
);


/* =====================================================
   INITIAL DISPLAY
===================================================== */

filteredScholarships =
    getFilteredScholarships();

displayCurrentPage();

/* =====================================================
   SEARCH BUTTON
===================================================== */

searchButton.addEventListener(
    "click",
    function() {

        applyScholarshipFilters();

        setTimeout(function() {

            scrollToScholarships();

        }, 100);

    }
);

/* =====================================================
   ENTER KEY
===================================================== */

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
