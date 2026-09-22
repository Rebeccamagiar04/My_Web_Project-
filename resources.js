// @ts-nocheck
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

document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const notifToggle = document.getElementById('notifToggle');
  const notifDropdown = document.getElementById('notifDropdown');

  // Toggle Mobile Drawer
  function toggleDrawer() {
    mobileDrawer.classList.toggle('open');
    drawerOverlay.classList.toggle('show');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', toggleDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', toggleDrawer);

  // Close drawer when clicking a sub-link
  document.querySelectorAll('.sub-nav-list a').forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      drawerOverlay.classList.remove('show');
    });
  });

  // Toggle Notifications Dropdown
  if (notifToggle && notifDropdown) {
    notifToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifToggle) {
        notifDropdown.classList.remove('show');
      }
    });
  }
});


  

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(q => {
q.addEventListener('click', () => {
const item = q.parentElement;
const isOpen = item.classList.contains('open');
document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
if (!isOpen) item.classList.add('open');
});
});



// =========================
// RESOURCE SEARCH
// =========================

const searchInput = document.querySelector('.search-box input');
const searchTags = document.querySelectorAll('.search-tag');


// =========================
// POPULAR SEARCHES
// =========================

searchTags.forEach(tag => {

  tag.addEventListener('click', () => {

    const searchTerm = tag.textContent.trim().toLowerCase();

    // CV Templates
    if (searchTerm.includes('cv')) {
      window.location.href = 'doctemplates.html#CV';
      return;
    }

    // Duolingo
    if (searchTerm.includes('duolingo')) {
      window.location.href = 'language.html#DUOLINGO';
      return;
    }

    // IELTS
    if (searchTerm.includes('ielts')) {
      window.location.href = 'language.html#IELTS-prep';
      return;
    }

    // Interview Tips
    if (searchTerm.includes('interview')) {
      window.location.href = 'resources.html#interview-tips';
      return;
    }

  });

});


// =========================
// SEARCH CURRENT PAGE
// =========================

function searchResources() {

  const searchTerm = searchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    return;
  }

  // Elements we want the search to look through
  const searchableElements = document.querySelectorAll(
    'h1, h2, h3, h4, p, li, .learn-title, .learn-desc, .video-title, .article-title, .deadline-title, .deadline, .faq-question, .faq-answer, .cta-title, .cta-desc'
  );

  let foundElement = null;

  // Search through the actual text on this page
  for (const element of searchableElements) {

    const text = element.textContent
      .toLowerCase()
      .trim();

    if (text.includes(searchTerm)) {
      foundElement = element;
      break;
    }
  }


  // =========================
  // IF NOTHING IS FOUND
  // =========================

  if (!foundElement) {

    alert("Whatever you're looking for is not here yet.");

    return;
  }


  // =========================
  // FIND THE BEST PLACE TO SCROLL TO
  // =========================

  // If the matching text is inside a section/card
  // that has an ID, use that larger container.
  const destination =
    foundElement.closest(
      'section[id], .learn-card[id], .video-card[id], .article-card[id], .faq-item[id], .deadline-card[id]'
    ) || foundElement;


  // Scroll to the matching content
  destination.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });


  // Briefly highlight the result
  destination.style.outline = '3px solid #2563eb';
  destination.style.outlineOffset = '6px';

  setTimeout(() => {
    destination.style.outline = '';
    destination.style.outlineOffset = '';
  }, 2000);
}


// =========================
// ENTER KEY
// =========================

searchInput.addEventListener('keydown', event => {

  if (event.key === 'Enter') {

    event.preventDefault();

    searchResources();

  }

});

// -------------------------
// SEARCH WITH ENTER
// -------------------------

searchInput.addEventListener('keydown', (event) => {

  if (event.key === 'Enter') {
    searchResources();
  }

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

// Scholarship Deadline Countdown

function updateCountdowns() {

    const countdowns = document.querySelectorAll(".countdown");

    countdowns.forEach(countdown => {

        const deadline = new Date(countdown.dataset.deadline).getTime();
        const now = new Date().getTime();

        const difference = deadline - now;

        if (difference <= 0) {
            countdown.textContent = "🔴 Application closed";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (difference % (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        );

        const minutes = Math.floor(
            (difference % (1000 * 60 * 60)) /
            (1000 * 60)
        );

        const seconds = Math.floor(
            (difference % (1000 * 60)) /
            1000
        );

        countdown.textContent =
            `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
    });
}

updateCountdowns();

setInterval(updateCountdowns, 1000);

// ================================
// DAILY MOTIVATION
// ================================

const motivations = [
    "You don't have to have everything figured out. Just keep taking the next step.",
    
    "Your journey doesn't have to look like anyone else's. Keep going at your own pace.",
    
    "Small progress is still progress. Be proud of every step you take.",
    
    "One rejection does not define your future. Keep searching, keep learning, keep growing.",
    
    "Your dreams are worth the effort it takes to reach them.",
    
    "You are allowed to start small. Great things often begin with one small step.",
    
    "Don't compare your beginning to someone else's middle.",
    
    "Keep going. The opportunity you're looking for may be closer than you think.",
    
    "Your current circumstances do not have to determine your destination.",
    
    "Believe in the person you're becoming."
];


// ================================
// DAILY CHALLENGES
// ================================

const challenges = [
    "Spend 20 minutes learning something you've always been curious about.",
    
    "Write down three things you're proud of accomplishing.",
    
    "Learn five new words in a language you've always wanted to speak.",
    
    "Practice introducing yourself confidently in 30 seconds.",
    
    "Spend 15 minutes improving one digital skill.",
    
    "Read an article about a topic you've never explored before.",
    
    "Write down one goal you'd like to accomplish this month.",
    
    "Teach someone something you know.",
    
    "Spend 20 minutes practicing your communication skills.",
    
    "Try something creative today that you've never done before."
];


// ================================
// SELECT MESSAGE BASED ON THE DATE
// ================================

function getDailyContent(array) {

    const today = new Date();

    // Create a number based on today's date
    const dateNumber =
        today.getFullYear() +
        today.getMonth() +
        today.getDate();

    // Choose an item from the array
    const index = dateNumber % array.length;

    return array[index];
}


// ================================
// DISPLAY TODAY'S CONTENT
// ================================

const motivationElement =
    document.getElementById("dailyMotivation");

const challengeElement =
    document.getElementById("dailyChallenge");


if (motivationElement) {
    motivationElement.textContent =
        getDailyContent(motivations);
}


if (challengeElement) {
    challengeElement.textContent =
        getDailyContent(challenges);
}
