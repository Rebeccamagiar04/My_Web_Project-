// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
    
  //IMPORT AUTHENTICATION
  import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } 
from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);
  
  //INITIALIZE AUTHENTICATION
  const auth = getAuth(app);
  
  //FRIENDLY ERROR MESSAGE
  function getFriendlyError(code) {
  switch(code) {
    case "auth/email-already-in-use":
      return "This email already has an account.";

    case "auth/weak-password":
      return "Password must be at least 6 characters.";

    case "auth/invalid-email":
      return "Please enter a valid email.";

    default:
      return "Something went wrong. Try again.";
  }
}

  //CREATE ACCOUNT EMAIL/password
  const signupBtn = document.getElementById("createAccount");

signupBtn.addEventListener("click", () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Account created successfully!");
      console.log(userCredential.user);
    })
    .catch((error) => {
      alert(getFriendlyError(error.code));
    });

});


   //GOOGLE signInWithPopup
   const googleBtn = document.getElementById("googleLogin");

googleBtn.addEventListener("click", () => {

  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then((result) => {
    if (result.user) {
      console.log("Signed in as:", result.user.email);
      alert("Signed in with Google!");
    }
    })
    .catch((error) => {
    console.error("Google sign-in error:", error.code, error.message);
  
    });
   
  });  
  
//STYLING PROGRESS BAR AND MOVING QUESTIONS
const questions = document.querySelectorAll(".question");
const startBtn = document.getElementById("start-btn");
const nextBtns = document.querySelectorAll(".next-btn");
const progressWrapper = document.getElementById("progress-wrapper");
const progressBar = document.getElementById("progress-bar");

let currentQuestion = 0;

// Show one question at a time
function showQuestion(index) {
  questions.forEach(q => q.style.display = "none");


 questions[index].style.display = "block";

  // 👇 AUTO FOCUS INPUT
  const input = questions[index].querySelector(
  'input[type="text"], input[type="email"], input[type="password"], textarea'
);
  if (input) {
    setTimeout(() => {
      input.focus();
    }, 100);
}
}

//function of previous button
function prevHandler() {
  if (currentQuestion > 1) {
    currentQuestion--;
    showQuestion(currentQuestion);
    updateProgressBar();
  }
}
// Update progress bar
function updateProgressBar() {
  const totalQuestions = questions.length - 1; // exclude welcome page
  const progressPercent = (currentQuestion / totalQuestions) * 100;
  progressBar.style.width = progressPercent + "%";
}

// Start button → move from welcome → first question
startBtn.addEventListener("click", () => {
  currentQuestion = 1; // first question (skip welcome)
  showQuestion(currentQuestion);
  progressWrapper.style.display = "block"; // show progress bar
});

// NEXT HANDLER (keyboard-safe)
function nextHandler() {
  const currentQ = questions[currentQuestion];
  const nextBtn = currentQ.querySelector(".next-btn");

  // 🚫 BLOCK if button is disabled
  if (nextBtn && nextBtn.disabled) return;

  if (document.activeElement) {
    document.activeElement.blur();
  }
  //force keyboard to close
  document.body.focus();
  
  setTimeout(() => {

    currentQuestion++;
    
    if (currentQuestion < questions.length) {
      showQuestion(currentQuestion);
      updateProgressBar();
    } else {
      alert("You have completed all questions!");
    }

  }, 300);
}

document.querySelectorAll(".prev-btn").forEach(btn => {
  btn.addEventListener("click", prevHandler);
});
// Next buttons → move to next question
nextBtns.forEach((btn) => {
  btn.addEventListener("click",nextHandler);
});

//disable next button so that user may not skip answering the questions
questions.forEach(question => {

  const nextBtn = question.querySelector(".next-btn");

  if (!nextBtn) return;

    const inputs = question.querySelectorAll(
        'input, textarea'
  )

  function validateQuestion() {

    // radio or checkbox selected?
    const choiceSelected = question.querySelector(
      'input[type="radio"]:checked, input[type="checkbox"]:checked'
    );

    // text typed?
    const textInput = question.querySelector(
      'input[type="text"], textarea'
    );

   const textFilled =
      textInput && textInput.value.trim().length > 0;

    // enable if ANY valid answer exists
    nextBtn.disabled = !(choiceSelected || textFilled);
  }
   inputs.forEach(input => {
    input.addEventListener("input", validateQuestion);
    input.addEventListener("change", validateQuestion);
  });
  // ✅ run once initially (so button starts disabled)
  validateQuestion();
});
// HANDLE "OTHER" CHECKBOXES
const otherCheckboxes = document.querySelectorAll(
  'input[type="checkbox"][data-target]'
);

otherCheckboxes.forEach((checkbox) => {
  const textbox = document.getElementById(checkbox.dataset.target);
  if (!textbox) return;

  checkbox.addEventListener("change", () => {
    // show/hide textbox
    textbox.style.display = checkbox.checked ? "block" : "none";

    if (!checkbox.checked) {
      textbox.value = "";
    }
  });
});

// VALIDATE BEFORE MOVING NEXT
nextBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const question = btn.closest(".question");
    if (!question) return;

    const otherCheckboxes = question.querySelectorAll(
      'input[type="checkbox"][data-target]'
    );

    for (let checkbox of otherCheckboxes) {
      const textbox = document.getElementById(checkbox.dataset.target);

      if (checkbox.checked && textbox.value.trim() === "") {
        alert("Please explain your 'Other' selection");
        textbox.focus();
        return;
      }
    }
  });
});
  
  
  //password viscibility
  const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");

showPassword.addEventListener("change", () => {
  if (showPassword.checked) {
    password.type = "text";   // show password
  } else {
    password.type = "password"; // hide password
  }
});

const form=
  document.getElementById("form-section")
form.addEventListener("submit", function(e){
  e.preventDefault();

  document.getElementById("questionare").classList.add("hidden");
  document.getElementById("home-page").classList.remove("hidden");
});

