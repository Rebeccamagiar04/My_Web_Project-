const savedName = localStorage.getItem("questionnaireName");

console.log("NAME RETRIEVED:", JSON.stringify(savedName));

if (savedName) {
    document.getElementById("userName").textContent = savedName;
}


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
