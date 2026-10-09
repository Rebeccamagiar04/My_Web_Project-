document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       MOBILE DRAWER & NOTIFICATIONS
    ===================================================== */

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const notifToggle = document.getElementById('notifToggle');
    const notifDropdown = document.getElementById('notifDropdown');


    /* =====================================================
       TOGGLE MOBILE DRAWER
    ===================================================== */

    function toggleDrawer() {

        if (mobileDrawer) {
            mobileDrawer.classList.toggle('open');
        }

        if (drawerOverlay) {
            drawerOverlay.classList.toggle('show');
        }
    }


    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleDrawer);
    }

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', toggleDrawer);
    }

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', toggleDrawer);
    }


    /* =====================================================
       CLOSE DRAWER WHEN CLICKING A LINK
    ===================================================== */

    document.querySelectorAll('.sub-nav-list a').forEach(link => {

        link.addEventListener('click', () => {

            if (mobileDrawer) {
                mobileDrawer.classList.remove('open');
            }

            if (drawerOverlay) {
                drawerOverlay.classList.remove('show');
            }

        });

    });


    /* =====================================================
       NOTIFICATIONS DROPDOWN
    ===================================================== */

    if (notifToggle && notifDropdown) {

        notifToggle.addEventListener('click', (event) => {

            event.stopPropagation();

            notifDropdown.classList.toggle('show');

        });


        document.addEventListener('click', (event) => {

            if (
                !notifDropdown.contains(event.target) &&
                event.target !== notifToggle
            ) {

                notifDropdown.classList.remove('show');

            }

        });

    }



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

        if (!paginationNumbers) {
            return;
        }


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

});
