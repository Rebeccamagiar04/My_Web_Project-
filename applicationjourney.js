document.addEventListener("DOMContentLoaded", () => {

    // Get page elements
    const cards = document.querySelectorAll(".guide-card");
    const progressSteps = document.querySelectorAll(".progress-step");
    const nextButton = document.getElementById("nextStep");
    const previousButton = document.getElementById("previousStep");
    const currentStepDisplay = document.getElementById("currentStep");

    let currentStep = 1;
    const totalSteps = cards.length;


    // Show the selected step
    function showStep(step, shouldScroll = true) {

        cards.forEach(card => {
            card.classList.remove("active");
        });

        const selectedCard = document.querySelector(
            `.guide-card[data-card="${step}"]`
        );

        if (selectedCard) {
            selectedCard.classList.add("active");

            // Scroll to the new step
            if (shouldScroll) {
                const headerOffset = 20;

                const cardPosition =
                    selectedCard.getBoundingClientRect().top +
                    window.scrollY -
                    headerOffset;

                window.scrollTo({
                    top: cardPosition,
                    behavior: "smooth"
                });
            }
        }


        // Update progress indicator
        progressSteps.forEach(progressStep => {

            const stepNumber = Number(progressStep.dataset.step);

            progressStep.classList.remove("active");

            if (stepNumber === step) {
                progressStep.classList.add("active");
            }

        });


        // Update step number inside the card
        const stepNumberText = document.querySelector(
            `.guide-card[data-card="${step}"] .step-number`
        );

        if (stepNumberText) {
            stepNumberText.textContent =
                `STEP ${step} OF ${totalSteps}`;
        }


        // Update step counter
        if (currentStepDisplay) {
            currentStepDisplay.textContent = step;
        }


        // Enable or disable the Back button
        if (previousButton) {
            previousButton.disabled = step === 1;
        }


        // Update the Next button
        if (nextButton) {

            if (step === totalSteps) {

                nextButton.innerHTML = `
                    <span>Finish</span>
                    <span>✓</span>
                `;

            } else {

                nextButton.innerHTML = `
                    <span>Next Step</span>
                    <span>→</span>
                `;

            }

        }
    }


    // Next Step button
    if (nextButton) {

        nextButton.addEventListener("click", () => {

            if (currentStep < totalSteps) {

                currentStep++;

                showStep(currentStep);

            }

        });

    }


    // Previous Step button
    if (previousButton) {

        previousButton.addEventListener("click", () => {

            if (currentStep > 1) {

                currentStep--;

                showStep(currentStep);

            }

        });

    }


    // Progress step buttons
    progressSteps.forEach(progressStep => {

        progressStep.addEventListener("click", () => {

            const selectedStep = Number(
                progressStep.dataset.step
            );

            currentStep = selectedStep;

            showStep(currentStep);

        });

    });


    // Show the first step without scrolling on page load
    showStep(currentStep, false);

});
