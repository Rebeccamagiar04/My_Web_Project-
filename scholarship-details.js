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

        // NEW: Update the meta description from the first paragraph
        const firstParagraph = selectedScholarship.querySelector("p");

        if (firstParagraph) {
            let text = firstParagraph.textContent.replace(/\s+/g, " ").trim();

            // Keep it to a search-friendly length, cut at a word boundary
            if (text.length > 155) {
                text = text.slice(0, 155).replace(/\s+\S*$/, "") + "...";
            }

            let metaDescription =
                document.querySelector('meta[name="description"]');

            if (!metaDescription) {
                metaDescription = document.createElement("meta");
                metaDescription.name = "description";
                document.head.appendChild(metaDescription);
            }

            if (text) {
                metaDescription.setAttribute("content", text);
            }
        }

        // NEW: Set a canonical link that includes the scholarship ID
        let canonical = document.querySelector('link[rel="canonical"]');

        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }

        canonical.href =
            "https://www.porticokakuma.co.ke/scholarship-details.html?id=" +
            encodeURIComponent(scholarshipId);

        // Start at the top of the page
        window.scrollTo(0, 0);

    } else {

        // NEW: Ask search engines not to index a "not found" view
        const robots = document.querySelector('meta[name="robots"]');
        if (robots) {
            robots.setAttribute("content", "noindex, follow");
        }

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
