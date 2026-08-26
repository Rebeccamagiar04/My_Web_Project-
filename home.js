document.addEventListener("DOMContentLoaded", () => {

    const tips = document.querySelectorAll(".tip");

    tips.forEach(tip => {

        tip.addEventListener("click", () => {

            // Find the explanation inside the tip
            const details = tip.querySelector(".tip-details");

            if (!details) return;

            // Close all other open tips
            document.querySelectorAll(".tip-details").forEach(item => {
                if (item !== details) {
                    item.style.display = "none";
                }
            });

            // Toggle the clicked tip
            if (details.style.display === "block") {
                details.style.display = "none";
            } else {
                details.style.display = "block";
            }

        });

    });

});
