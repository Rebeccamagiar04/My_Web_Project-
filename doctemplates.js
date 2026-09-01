/* =====================================================
   TEMPLATES & DOCUMENT VIEWER
   ===================================================== */

const templateCards = document.querySelectorAll(".template-card");
const documentFrame = document.getElementById("document-frame");
const documentTitle = document.getElementById("document-title");
const downloadDocument = document.getElementById("download-document");


templateCards.forEach((card) => {

  card.addEventListener("click", () => {

    // Get the document path from the clicked card
    const documentPath = card.dataset.document;

    // Get the document name from the card
    const title = card.querySelector("h4").textContent;


    // Make sure the required elements exist
    if (!documentFrame || !documentTitle || !downloadDocument) {
      return;
    }


    // Change the document viewer
    documentFrame.src = documentPath;


    // Change the document title
    documentTitle.textContent = title;


    // Change the download link
    downloadDocument.href = documentPath;


    // Change the download button text
    downloadDocument.textContent = "↓ Download PDF";


    // Remove active state from all cards
    templateCards.forEach((item) => {
      item.classList.remove("active");
    });


    // Highlight the selected card
    card.classList.add("active");


    // Scroll smoothly to the document viewer
    document.querySelector(".document-viewer-section").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  });

});
