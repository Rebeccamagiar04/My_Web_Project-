/* =====================================================
   1. FIREBASE IMPORTS
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    signInAnonymously,
    signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    increment,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


/* =====================================================
   2. FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAoH3X26Hx8jFjaCJcknuB6Kgx7u10nVUE",
    authDomain: "first-webproject-865a5.firebaseapp.com",
    projectId: "first-webproject-865a5",
    storageBucket: "first-webproject-865a5.firebasestorage.app",
    messagingSenderId: "586929157801",
    appId: "1:586929157801:web:46dcd3fee9343ba6895bb8",
    measurementId: "G-DHPQ1CL34X"
};


/* =====================================================
   3. INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);


/* =====================================================
   SAVE QUESTIONNAIRE GENDER TO FIRESTORE
===================================================== */


async function saveGenderToFirestore(user, gender) {
    if (!user || !gender) return;

    const genderRef = doc(db, "Gender", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    const newGender = gender.trim().toLowerCase();
    const genderSnapshot = await getDoc(genderRef);

    const oldGender = genderSnapshot.exists()
        ? String(genderSnapshot.data().gender || "").trim().toLowerCase()
        : null;

    // Do not count the same gender answer twice.
    if (oldGender === newGender) return;

    const changes = {};

    // Remove the previous gender from its count, if applicable.
    if (oldGender === "female") {
        changes.femaleUsers = increment(-1);
    } else if (oldGender === "male") {
        changes.maleUsers = increment(-1);
    }

    // Add the new gender to its count, if applicable.
    if (newGender === "female") {
        changes.femaleUsers = increment(1);
    } else if (newGender === "male") {
        changes.maleUsers = increment(1);
    }

    await setDoc(genderRef, {
        gender: newGender,
        timestamp: serverTimestamp()
    }, { merge: true });

    // Update statistics only when a countable gender changes.
    if (Object.keys(changes).length > 0) {
        await setDoc(statsRef, changes, { merge: true });
    }
}




/* =====================================================
   4. AUTHENTICATION BUTTONS
===================================================== */

const signupBtn = document.getElementById("createAccount");
const googleBtn = document.getElementById("googleLogin");
const loginBtn = document.getElementById("login-btn");
const guestBtn = document.getElementById("guestBtn");


/* =====================================================
   5. SAVE USERS TO FIRESTORE
   Each Firebase UID is counted only once.
   User record and community statistics update together.
===================================================== */

async function saveUserToFirestore(user, userType) {
    if (!user) return;

    if (userType !== "registered" && userType !== "guest") {
        return;
    }

    const userRef = doc(db, "Users", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    await runTransaction(db, async (transaction) => {

        // Read both documents before making any changes.
        const userSnapshot = await transaction.get(userRef);

        // This UID has already been counted.
        if (userSnapshot.exists()) {
            return;
        }

        const statsSnapshot = await transaction.get(statsRef);

        const stats = statsSnapshot.exists()
            ? statsSnapshot.data()
            : {};

        const totalUsers = Number(stats.totalUsers) || 0;
        const registeredUsers = Number(stats.registeredUsers) || 0;
        const guestUsers = Number(stats.guestUsers) || 0;

        // Record the new user.
        transaction.set(userRef, {
            userType: userType,
            createdAt: serverTimestamp()
        });

        // Update community statistics atomically.
        transaction.set(statsRef, {
            totalUsers: totalUsers + 1,
            registeredUsers: registeredUsers +
                (userType === "registered" ? 1 : 0),
            guestUsers: guestUsers +
                (userType === "guest" ? 1 : 0)
        }, { merge: true });
    });
}



/* =====================================================
   6. SIGNUP WITH EMAIL AND PASSWORD
===================================================== */

if (signupBtn) {
    signupBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (!name) {
            alert("Please go back to Question 1 and enter your name.");
            return;
        }

        if (!emailInput || !passwordInput) {
            alert("The email or password field could not be found.");
            return;
        }

        try {
            // Save the name for home.html.
            localStorage.setItem("questionnaireName", name);

            // Create the Firebase account.
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Update the user's Firebase profile.
            await updateProfile(userCredential.user, {
                displayName: name
            });

            console.log("NAME SAVED:", name);

            
const user = userCredential.user;

// Record the registered user.
await saveUserToFirestore(user, "registered");

// Save the questionnaire gender.
const gender = localStorage.getItem("questionnaireGender");

if (gender) {
    await saveGenderToFirestore(user, gender);
}


            alert("Account created successfully!");

            // Redirect to the home page.
            window.location.href = "home.html";

        } catch (error) {
            console.error("Signup error:", error.code, error.message);
            alert(getFriendlyError(error.code));
        }
    });
}


/* =====================================================
   7. GOOGLE SIGN-IN
===================================================== */

if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        try {
            const provider = new GoogleAuthProvider();

            const result = await signInWithPopup(auth, provider);

            const user = result.user;

            
await saveUserToFirestore(user, "registered");

const gender = localStorage.getItem("questionnaireGender");

if (gender) {
    await saveGenderToFirestore(user, gender);
}


            console.log("Signed in as:", user.email);
            console.log("Google displayName:", user.displayName);

            if (user.displayName) {
                localStorage.setItem(
                    "questionnaireName",
                    user.displayName
                );

                console.log("NAME SAVED:", user.displayName);
            }

            alert("Signed in with Google!");

            window.location.href = "home.html";

        } catch (error) {
            console.error(
                "Google sign-in error:",
                error.code,
                error.message
            );

            alert(getFriendlyError(error.code));
        }
    });
}


/* =====================================================
   8. LOGIN WITH EMAIL AND PASSWORD
===================================================== */

if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        console.log("Login button clicked");

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        if (!emailInput || !passwordInput) {
            alert("The email or password field could not be found.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            console.log("Login successful!");
            console.log("Logged in user:", user);
            console.log("Firebase displayName:", user.displayName);

            // Save the user's name for home.html.
            if (user.displayName) {
                localStorage.setItem(
                    "questionnaireName",
                    user.displayName
                );

                console.log("NAME SAVED:", user.displayName);
            } else {
                console.log(
                    "This account does not have a displayName."
                );
            }

            alert("Login successful!");

            window.location.href = "home.html";

        } catch (error) {
            console.error(
                "Firebase Error:",
                error.code,
                error.message
            );

            alert(getFriendlyError(error.code));
        }
    });
}

/* =====================================================
   9. CONTINUE AS GUEST — REUSE EXISTING SESSION
===================================================== */

const GUEST_EXPIRY_KEY = "porticoGuestExpiry";

if (guestBtn) {
    guestBtn.addEventListener("click", async () => {
        try {
            guestBtn.disabled = true;
            guestBtn.textContent = "Please wait...";

            let user = auth.currentUser;

            // Reuse the existing anonymous account if available.
            if (user && user.isAnonymous) {
                console.log("Reusing existing guest account:", user.uid);
            } else {
                // Sign out a different account before continuing as guest.
                if (user) {
                    await signOut(auth);
                }

                const result = await signInAnonymously(auth);
                user = result.user;
            }

            // Start a fresh 24-hour guest session.
            localStorage.setItem(
                GUEST_EXPIRY_KEY,
                String(Date.now() + 24 * 60 * 60 * 1000)
            );

            // Count this UID only if it has not been counted before.
            await saveUserToFirestore(user, "guest");

            const gender = localStorage.getItem("questionnaireGender");

            if (gender) {
                await saveGenderToFirestore(user, gender);
            }

            window.location.replace("home.html");

        } catch (error) {
            console.error("Guest sign-in failed:", error);

            alert("Unable to continue as guest. Please try again.");

            guestBtn.disabled = false;
            guestBtn.textContent = "Continue as Guest";
        }
    });
}


/* =====================================================
   10. FRIENDLY ERROR MESSAGES
===================================================== */

function getFriendlyError(code) {
    switch (code) {
        case "auth/email-already-in-use":
            return "This email already has an account. Login instead";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-email":
            return "Please enter a valid email.";

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Incorrect email or password. Please try again.";

        case "auth/popup-closed-by-user":
            return "The sign-in window was closed before sign-in finished.";

        case "auth/popup-blocked":
            return "Your browser blocked the sign-in window. Please allow pop-ups and try again.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection and try again.";

        default:
            return "Something went wrong. Please try again.";
    }
}


/* =====================================================
   11. QUESTIONNAIRE AND PROGRESS BAR
===================================================== */


/* =====================================================
   SAVE GENDER ANSWER TEMPORARILY
===================================================== */

const genderOptions = document.querySelectorAll(
    'input[name="gender"]'
);

genderOptions.forEach((option) => {
    option.addEventListener("change", () => {
        localStorage.setItem("questionnaireGender", option.value);
    });
});


  document.getElementById("skipQuestionnaireBtn").addEventListener("click", function () {
      window.location.href = "access.html";
    });


const questions = document.querySelectorAll(".question");
const startBtn = document.getElementById("start-btn");
const nextBtns = document.querySelectorAll(".next-btn");
const progressWrapper = document.getElementById("progress-wrapper");
const progressBar = document.getElementById("progress-bar");

let currentQuestion = 0;


// Show one question at a time.
function showQuestion(index) {
    if (questions.length === 0) return;

    if (index < 0 || index >= questions.length) return;

    questions.forEach((question) => {
        question.style.display = "none";
    });

    questions[index].style.display = "block";

    // Automatically focus the first relevant input.
    const input = questions[index].querySelector(
        'input[type="text"], input[type="email"], input[type="password"], textarea'
    );

    if (input) {
        setTimeout(() => {
            input.focus();
        }, 100);
    }
}


// Update progress bar.
function updateProgressBar() {
    if (!progressBar || questions.length <= 1) return;

    const totalQuestions = questions.length - 1;

    const progressPercent =
        (currentQuestion / totalQuestions) * 100;

    progressBar.style.width = progressPercent + "%";
}


// Start button: move from welcome page to the first question.
if (startBtn) {
    startBtn.addEventListener("click", () => {
        if (questions.length <= 1) return;

        currentQuestion = 1;

        showQuestion(currentQuestion);

        if (progressWrapper) {
            progressWrapper.style.display = "block";
        }

        updateProgressBar();
    });
}


// Previous button handler.
function prevHandler() {
    if (currentQuestion > 1) {
        currentQuestion--;

        showQuestion(currentQuestion);

        updateProgressBar();
    }
}


// Next button handler.
function nextHandler() {
    if (questions.length === 0) return;

    const currentQ = questions[currentQuestion];

    if (!currentQ) return;

    const nextBtn = currentQ.querySelector(".next-btn");

    // Do not proceed if the next button is disabled.
    if (nextBtn && nextBtn.disabled) return;

    if (document.activeElement) {
        document.activeElement.blur();
    }

    // Close the keyboard on mobile devices.
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


// Attach previous button handlers.
document.querySelectorAll(".prev-btn").forEach((btn) => {
    btn.addEventListener("click", prevHandler);
});


// Attach next button handlers.
nextBtns.forEach((btn) => {
    btn.addEventListener("click", nextHandler);
});


// Initialize the welcome page only when questions exist.
if (questions.length > 0) {
    showQuestion(0);
}


/* =====================================================
   12. DISABLE NEXT UNTIL AN ANSWER IS PROVIDED
===================================================== */

questions.forEach((question) => {
    const nextBtn = question.querySelector(".next-btn");

    if (!nextBtn) return;

    const inputs = question.querySelectorAll("input, textarea");

    function validateQuestion() {
        // Has the user selected a radio button or checkbox?
        const choiceSelected = question.querySelector(
            'input[type="radio"]:checked, input[type="checkbox"]:checked'
        );

        // Has the user entered text?
        const textInput = question.querySelector(
            'input[type="text"], textarea'
        );

        const textFilled =
            textInput && textInput.value.trim().length > 0;

        // Enable if at least one valid answer exists.
        nextBtn.disabled = !(choiceSelected || textFilled);
    }

    inputs.forEach((input) => {
        input.addEventListener("input", validateQuestion);
        input.addEventListener("change", validateQuestion);
    });

    // Run validation initially.
    validateQuestion();
});


/* =====================================================
   13. HANDLE "OTHER" CHECKBOXES
===================================================== */

const otherCheckboxes = document.querySelectorAll(
    'input[type="checkbox"][data-target]'
);

otherCheckboxes.forEach((checkbox) => {
    const textbox = document.getElementById(
        checkbox.dataset.target
    );

    if (!textbox) return;

    checkbox.addEventListener("change", () => {
        // Show or hide the explanation textbox.
        textbox.style.display = checkbox.checked ? "block" : "none";

        if (!checkbox.checked) {
            textbox.value = "";
        }
    });
});


/* =====================================================
   14. VALIDATE "OTHER" BEFORE MOVING TO THE NEXT QUESTION
===================================================== */

nextBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const question = btn.closest(".question");

        if (!question) return;

        const checkboxes = question.querySelectorAll(
            'input[type="checkbox"][data-target]'
        );

        for (const checkbox of checkboxes) {
            const textbox = document.getElementById(
                checkbox.dataset.target
            );

            if (
                checkbox.checked &&
                textbox &&
                textbox.value.trim() === ""
            ) {
                // Prevent moving forward until the explanation is entered.
                e.stopImmediatePropagation();

                alert("Please explain your 'Other' selection.");

                textbox.focus();

                return;
            }
        }
    });
});


/* =====================================================
   15. PASSWORD VISIBILITY
===================================================== */

const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");

if (showPassword && password) {
    showPassword.addEventListener("change", () => {
        password.type = showPassword.checked ? "text" : "password";
    });
}


/* =====================================================
   16. HAMBURGER MENU
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("Hamburger");
    const navLinks = document.getElementById("navLinks");
    const closeMenu = document.getElementById("closeMenu");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", (e) => {
            e.stopPropagation();

            navLinks.classList.toggle("active");
        });

        // Close the menu when a navigation link is clicked.
        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
            });
        });

        // Close the menu using the close button, if present.
        if (closeMenu) {
            closeMenu.addEventListener("click", () => {
                navLinks.classList.remove("active");
            });
        }

        // Close the menu when clicking outside it.
        document.addEventListener("click", (e) => {
            if (
                !navLinks.contains(e.target) &&
                !hamburger.contains(e.target)
            ) {
                navLinks.classList.remove("active");
            }
        });
    }
});
