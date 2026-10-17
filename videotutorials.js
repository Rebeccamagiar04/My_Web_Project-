//VIDEO SUMMARY TOGGLE//

const summaryButtons = document.querySelectorAll(".summary-button");

summaryButtons.forEach(button => {

    button.addEventListener("click", () => {

        const videoCard = button.closest(".video-card");

        videoCard.classList.toggle("summary-open");

        if (videoCard.classList.contains("summary-open")) {
            button.innerHTML = `
                Hide Summary
                <i class="fa-solid fa-chevron-up"></i>
            `;
        } else {
            button.innerHTML = `
                View Summary
                <i class="fa-solid fa-chevron-down"></i>
            `;
        }

    });

});
