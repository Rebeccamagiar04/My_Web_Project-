/* =========================================
   APPLICATION GUIDES - STEP NAVIGATION
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    // Get all guide cards
    const cards = document.querySelectorAll(".guide-card");

    // Get progress buttons
    const progressSteps = document.querySelectorAll(".progress-step");

    // Get navigation buttons
    const nextButton = document.getElementById("nextStep");
    const previousButton = document.getElementById("previousStep");

    // Current step
    const currentStepDisplay = document.getElementById("currentStep");

    // Start at step 1
    let currentStep = 1;

    // Total number of steps
    const totalSteps = cards.length;


    /* =========================================
       SHOW A PARTICULAR STEP
       ========================================= */

  // @ts-ignore
    function showStep(step) {

        // Remove active class from every card
        cards.forEach(card => {
            card.classList.remove("active");
        });

        // Add active class to the selected card
        const selectedCard = document.querySelector(
            `.guide-card[data-card="${step}"]`
        );

        if (selectedCard) {
            selectedCard.classList.add("active");
        }


        // Update progress circles
        progressSteps.forEach(progressStep => {

            const stepNumber = Number(
                progressStep.dataset.step
            );

            progressStep.classList.remove("active");

            if (stepNumber === step) {
                progressStep.classList.add("active");
            }

        });


        // Update "STEP X OF 12"
        const stepNumberText = document.querySelector(
            `.guide-card[data-card="${step}"] .step-number`
        );

        if (stepNumberText) {
            stepNumberText.textContent =
                `STEP ${step} OF ${totalSteps}`;
        }


        // Update bottom counter
        if (currentStepDisplay) {
            currentStepDisplay.textContent = step;
        }


        // Disable Back button on first step
        if (previousButton) {

            if (step === 1) {
                previousButton.disabled = true;
            } else {
                previousButton.disabled = false;
            }

        }


        // Change Next button on final step
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



    /* =========================================
       NEXT BUTTON
       ========================================= */

    if (nextButton) {

        nextButton.addEventListener("click", () => {

            if (currentStep < totalSteps) {

                currentStep++;

                showStep(currentStep);

            }

        });

    }



    /* =========================================
       PREVIOUS BUTTON
       ========================================= */

    if (previousButton) {

        previousButton.addEventListener("click", () => {

            if (currentStep > 1) {

                currentStep--;

                showStep(currentStep);

            }

        });

    }



    /* =========================================
       PROGRESS CIRCLE BUTTONS
       ========================================= */

    progressSteps.forEach(progressStep => {

        progressStep.addEventListener("click", () => {

            const selectedStep = Number(
                progressStep.dataset.step
            );

            currentStep = selectedStep;

            showStep(currentStep);

        });

    });



    /* =========================================
       INITIALIZE
       ========================================= */

    showStep(currentStep);

});
