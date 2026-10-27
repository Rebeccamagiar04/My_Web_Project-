
/* =====================================================
   1. FIREBASE IMPORTS
===================================================== */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    runTransaction,
    increment
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =====================================================
   3. ELEMENTS
===================================================== */

const accountForm = document.getElementById("accountForm");
const accessOptions = document.getElementById("accessOptions");
const formTitle = document.getElementById("formTitle");
const introText = document.getElementById("introText");

const nameGroup = document.getElementById("nameGroup");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const submitBtn = document.getElementById("formSubmitBtn");
const guestBtn = document.getElementById("continueGuestBtn");
const guestNote = document.getElementById("guestNote");

const GUEST_EXPIRY_KEY = "porticoGuestExpiry";

let formMode = "login";


/* =====================================================
   4. SAVE EACH UID ONLY ONCE
===================================================== */

async function saveUserToFirestore(user, userType) {
    if (!user) return;

    if (userType !== "registered" && userType !== "guest") {
        return;
    }

    const userRef = doc(db, "Users", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    await runTransaction(db, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);

        // This UID has already been counted.
        if (userSnapshot.exists()) return;

        const statsSnapshot = await transaction.get(statsRef);
        const stats = statsSnapshot.exists()
            ? statsSnapshot.data()
            : {};

        const totalUsers = Number(stats.totalUsers) || 0;
        const registeredUsers = Number(stats.registeredUsers) || 0;
        const guestUsers = Number(stats.guestUsers) || 0;

        transaction.set(userRef, {
            userType: userType,
            createdAt: serverTimestamp()
        });

        transaction.set(statsRef, {
            totalUsers: totalUsers + 1,
            registeredUsers:
                registeredUsers + (userType === "registered" ? 1 : 0),
            guestUsers:
                guestUsers + (userType === "guest" ? 1 : 0)
        }, { merge: true });
    });
}


/* =====================================================
   5. SAVE GENDER WITHOUT COUNTING IT TWICE
===================================================== */

async function saveGenderToFirestore(user, gender) {
    if (!user || !gender) return;

    const newGender = gender.trim().toLowerCase();

    const genderRef = doc(db, "Gender", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    await runTransaction(db, async (transaction) => {
        const genderSnapshot = await transaction.get(genderRef);

        const oldGender = genderSnapshot.exists()
            ? String(genderSnapshot.data().gender || "")
                .trim().toLowerCase()
            : "";

        if (oldGender === newGender) return;

        const changes = {};

        if (oldGender === "female") {
            changes.femaleUsers = increment(-1);
        } else if (oldGender === "male") {
            changes.maleUsers = increment(-1);
        }

        if (newGender === "female") {
            changes.femaleUsers = increment(1);
        } else if (newGender === "male") {
            changes.maleUsers = increment(1);
        }

        transaction.set(genderRef, {
            gender: newGender,
            timestamp: serverTimestamp()
        }, { merge: true });

        if (Object.keys(changes).length > 0) {
            transaction.set(statsRef, changes, { merge: true });
        }
    });
}


/* =====================================================
   6. SHOW LOGIN OR REGISTRATION FORM
===================================================== */

function openForm(mode) {
    formMode = mode;

    accountForm.hidden = false;
    accessOptions.hidden = true;
    guestNote.hidden = true;

    const isRegister = mode === "register";

    formTitle.textContent = isRegister
        ? "Create an Account"
        : "Log Back In";

    introText.textContent = isRegister
        ? "Enter your details to create your account."
        : "Enter your email and password to log in.";

    nameGroup.hidden = !isRegister;
    nameInput.required = isRegister;

    passwordInput.autocomplete = isRegister
        ? "new-password"
        : "current-password";

    submitBtn.setAttribute(
        "aria-label",
        isRegister ? "Create account" : "Log in"
    );

    accountForm.reset();

    // Use the name saved by the questionnaire, if available.
    nameInput.value =
        localStorage.getItem("questionnaireName") || "";

    if (isRegister && !nameInput.value) {
        nameInput.focus();
    } else {
        emailInput.focus();
    }
}

function closeForm() {
    accountForm.reset();
    accountForm.hidden = true;
    accessOptions.hidden = false;
    guestNote.hidden = false;

    introText.textContent =
        "Your next opportunity starts with a single step. Choose how you'd like to continue.";
}

document.getElementById("showLoginBtn")
    .addEventListener("click", () => openForm("login"));

document.getElementById("showRegisterBtn")
    .addEventListener("click", () => openForm("register"));

document.getElementById("cancelFormBtn")
    .addEventListener("click", closeForm);


/* =====================================================
   7. LOGIN AND CREATE ACCOUNT
===================================================== */

accountForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!accountForm.reportValidity()) return;

    submitBtn.disabled = true;

    const originalIcon = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (formMode === "register") {
            const name = nameInput.value.trim();

            if (!name) {
                alert("Please enter your full name.");
                nameInput.focus();
                return;
            }

            localStorage.setItem("questionnaireName", name);

            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(result.user, {
                displayName: name
            });

            await saveUserToFirestore(result.user, "registered");

            const gender = localStorage.getItem("questionnaireGender");

            if (gender) {
                await saveGenderToFirestore(result.user, gender);
            }

            alert("Account created successfully!");
            window.location.replace("home.html");

        } else {
            const result = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = result.user;

            if (user.displayName) {
                localStorage.setItem(
                    "questionnaireName",
                    user.displayName
                );
            }

            // Login does not increase user statistics.
            alert("Login successful!");
            window.location.replace("home.html");
        }

    } catch (error) {
        console.error("Authentication error:", error.code, error.message);
        alert(getFriendlyError(error.code));

    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalIcon;
    }
});


/* =====================================================
   8. CONTINUE AS GUEST
===================================================== */

if (guestBtn) {
    guestBtn.addEventListener("click", async () => {
        guestBtn.disabled = true;

        try {
            // Wait until Firebase has restored the saved session.
            await auth.authStateReady();

            let user = auth.currentUser;

            if (user && user.isAnonymous) {
                // Reuse the existing anonymous UID.
                console.log("Reusing guest UID:", user.uid);

            } else {
                // Switch from a registered account to guest access.
                if (user) {
                    await signOut(auth);
                }

                const result = await signInAnonymously(auth);
                user = result.user;
            }

            await saveUserToFirestore(user, "guest");

            const gender = localStorage.getItem("questionnaireGender");

            if (gender) {
                await saveGenderToFirestore(user, gender);
            }

            // Start or renew the 24-hour guest period.
            localStorage.setItem(
                GUEST_EXPIRY_KEY,
                String(Date.now() + 24 * 60 * 60 * 1000)
            );

            console.log("Guest UID:", user.uid);

            window.location.replace("home.html");

        } catch (error) {
            console.error("Guest sign-in failed:", error.code, error.message);

            alert(
                "Unable to continue as guest. Please check your connection and try again."
            );

            guestBtn.disabled = false;
        }
    });
}


/* =====================================================
   9. PASSWORD VISIBILITY
===================================================== */

const showPassword = document.getElementById("showPassword");

if (showPassword) {
    showPassword.addEventListener("change", () => {
        passwordInput.type = showPassword.checked
            ? "text"
            : "password";
    });
}


/* =====================================================
   10. FRIENDLY ERROR MESSAGES
===================================================== */

function getFriendlyError(code) {
    switch (code) {
        case "auth/email-already-in-use":
            return "This email already has an account.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Incorrect email or password. Please try again.";

        case "auth/invalid-password":
            return "Please check your password and try again.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        case "auth/operation-not-allowed":
            return "This sign-in method is not enabled in Firebase.";

        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";

        default:
            return "Something went wrong. Please try again.";
    }
}
