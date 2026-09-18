document.addEventListener("DOMContentLoaded", () => {
    const userName = document.getElementById("userName");

    onAuthStateChanged(auth, (user) => {
        if (!userName) return;

        // Check localStorage first as a fallback for freshly created accounts
        const savedName = localStorage.getItem("questionnaireName");

        if (user) {
            // Use Firebase displayName if available, otherwise fallback to localStorage
            const displayName = user.displayName || savedName || "there";
            userName.textContent = displayName;
        } else if (savedName) {
            // Fallback if auth state hasn't fully loaded yet
            userName.textContent = savedName;
        } else {
            userName.textContent = "there";
        }
    });
});



//IMPACT STAT SLIDER//

const stats = document.querySelectorAll(".stat");
const dots = document.querySelectorAll(".dot");

const previousButton = document.querySelector(".slider-arrow.previous");
const nextButton = document.querySelector(".slider-arrow.next");

let currentStat = 0;


//Show a particular statistic //

function showStat(index) {

    currentStat = index;

    // Make sure the number stays within the range //

    if (currentStat < 0) {
        currentStat = stats.length - 1;
    }

    if (currentStat >= stats.length) {
        currentStat = 0;
    }


    /* Hide all statistics //

    stats.forEach((stat) => {
        stat.classList.remove("active");
    });


    /* Remove active state from all dots */

    dots.forEach((dot) => {
        dot.classList.remove("active");
    });


    // Show the selected statistic */

    if (stats[currentStat]) {
        stats[currentStat].classList.add("active");
    }


    //Activate the correct dot //

    if (dots[currentStat]) {
        dots[currentStat].classList.add("active");
    }
}



  // 2. NEXT BUTTON//
   

if (nextButton) {

    nextButton.addEventListener("click", () => {

        showStat(currentStat + 1);

    });

}

  // 3. PREVIOUS BUTTON//


if (previousButton) {

    previousButton.addEventListener("click", () => {

        showStat(currentStat - 1);

    });

}



   //4. DOT BUTTONS//


dots.forEach((dot, index) => {

    dot.addEventListener("click", () => {

        showStat(index);

    });

});



  // 5. MOBILE / DESKTOP BEHAVIOUR//
   

function updateStatsForScreen() {

    //On mobile:On desktop:Show all statistics//

    if (window.innerWidth <= 700) {

        stats.forEach((stat, index) => {

            if (index === currentStat) {
                stat.classList.add("active");
            } else {
                stat.classList.remove("active");
            }

        });

    } else {

        stats.forEach((stat) => {
            stat.classList.add("active");
        });

    }

}


//Run when the page first loads //

updateStatsForScreen();


// Run whenever the screen size changes //

window.addEventListener("resize", updateStatsForScreen);
