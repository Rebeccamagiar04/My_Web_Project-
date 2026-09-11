 /* ===================================================== TEMPLATES & PDF VIEWER ===================================================== */ 
/* =========================
 GET HTML ELEMENTS
 ========================= */
const templateCards =
 document.querySelectorAll(".template-card");
const pdfContainer =
 document.getElementById("pdf-container");
const pdfLoading =
 document.getElementById("pdf-loading");
const documentTitle =
 document.getElementById("document-title");
const downloadDocument =
 document.getElementById("download-document");

const documentViewer =
 document.querySelector(".document-viewer");

/* =========================
   PDF PINCH ZOOM
   ========================= */

let pdfZoom = 1;
let currentPdfPath = "";

let initialPinchDistance = null;
let initialZoom = 1;
let pinchZoom = 1;
let isPinching = false;


/* =========================
   GET DISTANCE BETWEEN FINGERS
   ========================= */

function getTouchDistance(touch1, touch2) {

  const dx =
    touch2.clientX - touch1.clientX;

  const dy =
    touch2.clientY - touch1.clientY;

  return Math.sqrt(
    dx * dx + dy * dy
  );
}

/* =========================
 PDF.JS WORKER
 ========================= */
pdfjsLib.GlobalWorkerOptions.workerSrc =
 "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* =========================
   LOAD PDF
   ========================= */

async function loadPDF(pdfPath, zoom = 1) {

  currentPdfPath = pdfPath;
  pdfZoom = zoom;

  pdfContainer.innerHTML = "";

  pdfLoading.style.display = "block";
  pdfLoading.textContent = "Loading document...";

  try {

    const pdf =
      await pdfjsLib.getDocument(pdfPath).promise;

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {

      const page =
        await pdf.getPage(pageNumber);


      /* =========================
         FIT PDF TO VIEWER WIDTH
         ========================= */

      const originalViewport =
        page.getViewport({
          scale: 1
        });

      const viewer =
        document.querySelector(".document-viewer");

      const availableWidth =
        viewer.clientWidth - 16;

      const fitScale =
  (availableWidth / originalViewport.width) * zoom;


      /* =========================
         HIGH-RESOLUTION RENDERING
         ========================= */

      const devicePixelRatio =
        window.devicePixelRatio || 1;

      const viewport =
        page.getViewport({
          scale: fitScale
        });

      const renderViewport =
        page.getViewport({
          scale: fitScale * devicePixelRatio
        });


      /* =========================
         CREATE CANVAS
         ========================= */

      const canvas =
        document.createElement("canvas");

      const context =
        canvas.getContext("2d");


      /* High-resolution canvas */

      canvas.width =
        Math.floor(renderViewport.width);

      canvas.height =
        Math.floor(renderViewport.height);


      /* Keep visual size fitted to viewer */

      canvas.style.width =
        `${viewport.width}px`;

      canvas.style.height =
        `${viewport.height}px`;

      canvas.style.background =
        "white";


      pdfContainer.appendChild(canvas);


      /* =========================
         RENDER PDF
         ========================= */

      await page.render({
        canvasContext: context,
        viewport: renderViewport
      }).promise;

    }


    pdfLoading.style.display = "none";


  } catch (error) {

    console.error(
      "PDF loading error:",
      error
    );

    pdfLoading.textContent =
      "This document could not be previewed. Please download the PDF.";

  }

}

 /* =========================
   PINCH ZOOM START
   ========================= */

documentViewer.addEventListener(
  "touchstart",
  (event) => {

    if (event.touches.length === 2) {

      event.preventDefault();

      isPinching = true;

      initialPinchDistance =
        getTouchDistance(
          event.touches[0],
          event.touches[1]
        );

      initialZoom = pdfZoom;
      pinchZoom = pdfZoom;

      pdfContainer.style.transformOrigin =
        "top center";
    }

  },
  { passive: false }
);


/* =========================
   PINCH ZOOM MOVE
   ========================= */

documentViewer.addEventListener(
  "touchmove",
  (event) => {

    if (
      !isPinching ||
      event.touches.length !== 2 ||
      !initialPinchDistance
    ) {
      return;
    }

    event.preventDefault();

    const currentDistance =
      getTouchDistance(
        event.touches[0],
        event.touches[1]
      );

    const zoomRatio =
      currentDistance /
      initialPinchDistance;

    pinchZoom =
      initialZoom * zoomRatio;


    /* Minimum zoom */

    if (pinchZoom < 1) {
      pinchZoom = 1;
    }


    /* Maximum zoom */

    if (pinchZoom > 3) {
      pinchZoom = 3;
    }


    /* Visual preview while fingers move */

    const visualZoom =
      pinchZoom / initialZoom;

    pdfContainer.style.transform =
      `scale(${visualZoom})`;

  },
  { passive: false }
);


/* =========================
   PINCH ZOOM END
   ========================= */

documentViewer.addEventListener(
  "touchend",
  async (event) => {

    if (
      !isPinching ||
      event.touches.length >= 2
    ) {
      return;
    }

    isPinching = false;

    initialPinchDistance = null;

    pdfContainer.style.transform = "";

    const newZoom = pinchZoom;

    await loadPDF(
      currentPdfPath,
      newZoom
    );

  },
  { passive: false }
);


/* =========================
   PINCH ZOOM CANCEL
   ========================= */

documentViewer.addEventListener(
  "touchcancel",
  () => {

    isPinching = false;

    initialPinchDistance = null;

    pdfContainer.style.transform = "";

  }
);


/* =========================
 TEMPLATE CARD CLICK
 ========================= */
templateCards.forEach((card) => {
card.addEventListener("click", () => {
// Get PDF path  
const documentPath =  
  card.dataset.document;  


// Get title  
const title =  
  card.querySelector("h4").textContent;  


    // Show the reminder for the selected document  
const reminderBoxes =  
  document.querySelectorAll(".reminder-box");  

reminderBoxes.forEach((box) => {  
  box.style.display = "none";  
});  

const selectedReminder =  
  document.querySelector(  
    `.reminder-box[data-reminder="${card.dataset.reminder}"]`  
  );  

if (selectedReminder) {  
  selectedReminder.style.display = "block";  
}  
  
// Change document title  
documentTitle.textContent =  
  title;  


// Change download link  
downloadDocument.href =  
  documentPath;  


// Remove active state  
templateCards.forEach((item) => {  

  item.classList.remove("active");  

});  


// Highlight selected card  
card.classList.add("active");  

loadPDF(documentPath, 1);

})
 })
/* =========================
 LOAD FIRST DOCUMENT
 ========================= */
const firstCard =
 document.querySelector(".template-card.active");
if (firstCard) {
// Hide all reminders
 const reminderBoxes =
 document.querySelectorAll(".reminder-box");
reminderBoxes.forEach((box) => {
 box.style.display = "none";
 });
// Show Academic CV reminder
 const firstReminder =
  document.querySelector(
    `.reminder-box[data-reminder="${firstCard.dataset.reminder}"]`
  );
if (firstReminder) {
 firstReminder.style.display = "block";
 }
// Load Academic CV PDF
 loadPDF(firstCard.dataset.document, 1);
}
