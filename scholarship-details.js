document.addEventListener("DOMContentLoaded", () => {

    // Get the scholarship ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const scholarshipId = urlParams.get("id");

    // Get all scholarship detail sections
    const scholarshipDetails =
        document.querySelectorAll(".scholarship-detail");

    // Hide every scholarship detail first
    scholarshipDetails.forEach(section => {
        section.style.display = "none";
    });

    // Find the section that matches the ID from the URL
    const selectedScholarship =
        document.getElementById(scholarshipId);

    // Display the matching scholarship
    if (selectedScholarship) {

        selectedScholarship.style.display = "block";

        // Update browser tab title
        const scholarshipTitle =
            selectedScholarship.querySelector("h1");

        if (scholarshipTitle) {
            document.title =
                scholarshipTitle.textContent + " | Portico Kakuma";
        }

        // Start at the top of the page
        window.scrollTo(0, 0);

    } else {

        // If no matching scholarship is found
        const container =
            document.querySelector(".scholarship-details-container");

        if (container) {

            container.innerHTML = `
                <div class="details-not-found">
                    <h1>Scholarship Not Found</h1>
                    <p>
                        We could not find the scholarship details
                        you are looking for.
                    </p>

                    <a href="scholarship.html" class="back-button">
                        <i class="fa-solid fa-arrow-left"></i>
                        Back to Scholarships
                    </a>
                </div>
            `;

        }

    }

});
