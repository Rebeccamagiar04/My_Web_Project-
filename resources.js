import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

  //FIREBASE CONFIGURATION
  const firebaseConfig = {
    apiKey: "AIzaSyAoH3X26Hx8jFjaCJcknuB6Kgx7u10nVUE",
    authDomain: "first-webproject-865a5.firebaseapp.com",
    projectId: "first-webproject-865a5",
    storageBucket: "first-webproject-865a5.firebasestorage.app",
    messagingSenderId: "586929157801",
    appId: "1:586929157801:web:46dcd3fee9343ba6895bb8",
    measurementId: "G-DHPQ1CL34X"
  };
  
    // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const questionForm = document.getElementById("questionForm");

if (questionForm) {
  questionForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("questionName").value;
    const email = document.getElementById("questionEmail").value;
    const question = document.getElementById("questionText").value;

    try {

      await addDoc(collection(db, "questions"), {
        name: name,
        email: email,
        question: question,
        createdAt: serverTimestamp()
      });

      alert("Your question has been sent!");

      questionForm.reset();

    } catch (error) {

      console.error(error);

      alert("Failed to send your question.");

    }

  });
}
  

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(q => {
q.addEventListener('click', () => {
const item = q.parentElement;
const isOpen = item.classList.contains('open');
document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
if (!isOpen) item.classList.add('open');
});
});

// Search tags interaction
document.querySelectorAll('.search-tag').forEach(tag => {
tag.addEventListener('click', () => {
const input = document.querySelector('.search-box input');
input.value = tag.textContent;
input.focus();
});
});

// Card hover effects enhancement
document.querySelectorAll('.deadline-card, .video-card, .article-card, .learn-card').forEach(card => {
card.addEventListener('mouseenter', () => {
card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
});
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', function(e) {
e.preventDefault();
});
});

// Calendar day selection
document.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
day.addEventListener('click', () => {
document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
day.classList.add('active');
});
});
