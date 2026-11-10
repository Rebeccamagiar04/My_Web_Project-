/* =====================================================
   1. FIREBASE
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut,
    updateProfile,
    EmailAuthProvider,
    linkWithCredential,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithPopup,
    signInWithCredential
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const app = initializeApp({
    apiKey: "AIzaSyAoH3X26Hx8jFjaCJcknuB6Kgx7u10nVUE",
    authDomain: "first-webproject-865a5.firebaseapp.com",
    projectId: "first-webproject-865a5",
    storageBucket: "first-webproject-865a5.firebasestorage.app",
    messagingSenderId: "586929157801",
    appId: "1:586929157801:web:46dcd3fee9343ba6895bb8",
    measurementId: "G-DHPQ1CL34X"
});

const auth = getAuth(app);
const db = getFirestore(app);


/* =====================================================
   2. PAGE ELEMENTS AND VIEWS
===================================================== */

const $ = (id) => document.getElementById(id);

const GUEST_EXPIRY_KEY = "porticoGuestExpiry";
const DEFAULT_INTRO =
    "Your next opportunity starts with a single step. Choose how you'd like to continue.";

const views = {
    options: $("accessOptions"),
    account: $("accountForm"),
    guest: $("guestDetailsForm"),
    google: $("googleDetailsForm")
};

const nameInput = $("name");
const emailInput = $("email");
const passwordInput = $("password");
const regGenderGroup = $("registrationGenderGroup");
const regGender = $("registrationGender");
const nameGroup = $("nameGroup");
const guestName = $("guestName");
const guestGender = $("guestGender");
const googleGender = $("googleGender");

let formMode = "login";
let googleUser = null;

function showView(name, intro) {
    Object.entries(views).forEach(([key, el]) => {
        el.hidden = key !== name;
    });

    $("guestNote").hidden = name !== "options";
    $("introText").textContent = intro || DEFAULT_INTRO;
}


/* =====================================================
   3. GENDER VALUES
   Firestore rules accept: female, male, prefer not to say.
   The select menus use "prefer-not-to-say".
===================================================== */

function normalizeGender(value) {
    const g = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_\s-]+/g, " ");

    if (["female", "woman"].includes(g)) return "female";
    if (["male", "man"].includes(g)) return "male";

    if (["prefer not to say", "prefer not to disclose",
         "rather not say", "rather not to say"].includes(g)) {
        return "prefer not to say";
    }

    return "";
}

const toOptionValue = (g) => g.replace(/ /g, "-");

const savedName = () => localStorage.getItem("questionnaireName") || "";
const savedGender = () => normalizeGender(localStorage.getItem("questionnaireGender"));


/* =====================================================
   4. FIRESTORE SAVES
===================================================== */

const num = (value) => Math.max(0, Number(value) || 0);

// Users collection + community totals. Each UID is counted once.
async function saveUserToFirestore(user, userType, name) {
    const userRef = doc(db, "Users", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        const statsSnap = await tx.get(statsRef);
        const stats = statsSnap.exists() ? statsSnap.data() : {};

        const previous = userSnap.exists() ? userSnap.data().userType : "";

        // Already saved with this type: only refresh the name.
        if (previous === userType) {
            if (name) tx.set(userRef, { name }, { merge: true });
            return;
        }

        let total = num(stats.totalUsers);
        let registered = num(stats.registeredUsers);
        let guests = num(stats.guestUsers);

        if (!userSnap.exists()) total += 1;
        if (previous === "registered") registered = Math.max(0, registered - 1);
        if (previous === "guest") guests = Math.max(0, guests - 1);

        if (userType === "registered") registered += 1;
        else guests += 1;

        const data = { userType };
        if (name) data.name = name;
        if (!userSnap.exists()) data.createdAt = serverTimestamp();

        tx.set(userRef, data, { merge: true });

        tx.set(statsRef, {
            totalUsers: total,
            registeredUsers: registered,
            guestUsers: guests
        }, { merge: true });
    });
}

// Gender collection + female/male totals.
async function saveGenderToFirestore(user, gender) {
    const newGender = normalizeGender(gender);
    if (!newGender) throw new Error("Invalid gender");

    const genderRef = doc(db, "Gender", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    await runTransaction(db, async (tx) => {
        const genderSnap = await tx.get(genderRef);
        const statsSnap = await tx.get(statsRef);
        const stats = statsSnap.exists() ? statsSnap.data() : {};

        const oldGender = genderSnap.exists()
            ? normalizeGender(genderSnap.data().gender)
            : "";

        // Never count the same answer twice.
        if (oldGender === newGender) return;

        let female = num(stats.femaleUsers);
        let male = num(stats.maleUsers);

        if (oldGender === "female") female = Math.max(0, female - 1);
        if (oldGender === "male") male = Math.max(0, male - 1);
        if (newGender === "female") female += 1;
        if (newGender === "male") male += 1;

        tx.set(genderRef, {
            gender: newGender,
            timestamp: serverTimestamp()
        }, { merge: true });

        tx.set(statsRef, {
            femaleUsers: female,
            maleUsers: male
        }, { merge: true });
    });
}

// UserProfiles collection.
async function saveUserProfileToFirestore(user, userType, name, gender) {
    const ref = doc(db, "UserProfiles", user.uid);
    const snap = await getDoc(ref);

    const data = { userType };

    if (!snap.exists()) data.createdAt = serverTimestamp();
    if (name) data.name = name.slice(0, 100);
    if (gender) data.gender = gender;

    await setDoc(ref, data, { merge: true });
}

// Runs each save separately so one failure doesn't stop the others.
async function saveAll(user, userType, name, gender) {
    const steps = [
        ["Users", () => saveUserToFirestore(user, userType, name)],
        ["UserProfiles", () => saveUserProfileToFirestore(user, userType, name, gender)]
    ];

    if (gender) {
        steps.splice(1, 0, ["Gender", () => saveGenderToFirestore(user, gender)]);
    }

    const failed = [];

    for (const [label, run] of steps) {
        try {
            await run();
        } catch (error) {
            console.error(label + " save failed:", error.code, error.message);
            failed.push(label + ": " + (error.code || error.message));
        }
    }

    return failed;
}

// Saves everything, stores local details, then opens the home page.
async function finishSignIn(user, userType, name, gender, message) {
    const failed = await saveAll(user, userType, name, gender);

    if (name) localStorage.setItem("questionnaireName", name);
    if (gender) localStorage.setItem("questionnaireGender", gender);

    if (userType === "registered") {
        localStorage.removeItem(GUEST_EXPIRY_KEY);
    } else {
        localStorage.setItem(GUEST_EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    }

    if (failed.length) {
        alert("You are signed in, but some details could not be saved:\n" + failed.join("\n"));
    } else if (message) {
        alert(message);
    }

    window.location.replace("index.html");
}


/* =====================================================
   5. HELPERS: BUSY BUTTONS AND ERRORS
===================================================== */

async function withBusy(button, task) {
    const label = button.querySelector("span") || button;
    const original = label.textContent;

    button.disabled = true;
    label.textContent = "Please wait...";

    try {
        await task();
    } catch (error) {
        console.error(error.code, error.message);

        if (error.code !== "auth/cancelled-popup-request") {
            alert(friendlyError(error.code));
        }
    } finally {
        button.disabled = false;
        label.textContent = original;
    }
}

function friendlyError(code) {
    switch (code) {
        case "auth/email-already-in-use":
            return "This email already has an account. Please log in instead.";
        case "auth/weak-password":
            return "Password must be at least 6 characters.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Incorrect email or password. Please try again.";
        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";
        case "auth/operation-not-allowed":
            return "This sign-in method is not enabled in Firebase.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";
        case "auth/credential-already-in-use":
            return "This account already belongs to another user. Please log in to it instead.";
        case "auth/account-exists-with-different-credential":
            return "An account already exists with this email. Log in with your email and password instead.";
        case "auth/popup-closed-by-user":
            return "The Google window was closed before sign-in finished.";
        case "auth/popup-blocked":
            return "Your browser blocked the Google window. Allow pop-ups and try again.";
        case "auth/unauthorized-domain":
            return "This website address is not authorised for sign-in yet.";
        default:
            return "Something went wrong. Please try again.";
    }
}


/* =====================================================
   6. SHOW AND HIDE FORMS
===================================================== */

function openForm(mode) {
    formMode = mode;
    const isRegister = mode === "register";

    $("accountForm").reset();

    nameGroup.hidden = !isRegister;
    regGenderGroup.hidden = !isRegister;
    nameInput.required = isRegister;
    regGender.required = isRegister;

    if (isRegister) {
        nameInput.value = savedName();
        regGender.value = toOptionValue(savedGender());
    }

    $("formTitle").textContent = isRegister ? "Create an Account" : "Log Back In";
    $("formSubmitLabel").textContent = isRegister ? "Create account" : "Log in";
    $("formSubmitBtn").setAttribute("aria-label", isRegister ? "Create account" : "Log in");

    passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
    passwordInput.type = "password";
    $("showPassword").checked = false;

    showView(
        "account",
        isRegister
            ? "Enter your details to create your account."
            : "Enter your email and password to log in."
    );

    (isRegister && !nameInput.value ? nameInput : emailInput).focus();
}

function backToOptions() {
    Object.values(views).forEach((el) => el.tagName === "FORM" && el.reset());
    showView("options");
}

$("showLoginBtn").addEventListener("click", () => openForm("login"));
$("showRegisterBtn").addEventListener("click", () => openForm("register"));
$("cancelFormBtn").addEventListener("click", backToOptions);
$("cancelGuestFormBtn").addEventListener("click", backToOptions);

$("continueGuestBtn").addEventListener("click", () => {
    views.guest.reset();
    guestName.value = savedName();
    guestGender.value = toOptionValue(savedGender());

    showView("guest", "Enter your name and choose a gender to continue as a guest.");
    (guestName.value ? guestGender : guestName).focus();
});

// Leaving the Google gender step signs out the half-finished sign-in.
$("cancelGoogleFormBtn").addEventListener("click", async () => {
    googleUser = null;

    try {
        await signOut(auth);
    } catch (error) {
        console.error(error);
    }

    backToOptions();
});

$("showPassword").addEventListener("change", (event) => {
    passwordInput.type = event.target.checked ? "text" : "password";
});


/* =====================================================
   7. LOG IN AND CREATE ACCOUNT
===================================================== */

async function register() {
    const name = nameInput.value.trim();
    const gender = normalizeGender(regGender.value);
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!name) return alert("Please enter your full name.");
    if (!gender) return alert("Please select your gender.");

    await auth.authStateReady();

    let user;

    if (auth.currentUser?.isAnonymous) {
        // Upgrade the guest: keep the same Firebase UID.
        const credential = EmailAuthProvider.credential(email, password);
        user = (await linkWithCredential(auth.currentUser, credential)).user;
        await user.getIdToken(true);
    } else {
        user = (await createUserWithEmailAndPassword(auth, email, password)).user;
    }

    await updateProfile(user, { displayName: name });

    await finishSignIn(user, "registered", name, gender, "Account created successfully!");
}

async function login() {
    const result = await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
    );

    const user = result.user;

    // Gender is not sent on login, so it is never overwritten.
    await finishSignIn(user, "registered", user.displayName || "", "", "Login successful!");
}

views.account.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!views.account.reportValidity()) return;

    withBusy($("formSubmitBtn"), formMode === "register" ? register : login);
});


/* =====================================================
   8. CONTINUE AS GUEST
===================================================== */

views.guest.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!views.guest.reportValidity()) return;

    withBusy($("submitGuestDetailsBtn"), async () => {
        const name = guestName.value.trim();
        const gender = normalizeGender(guestGender.value);

        if (!name) return alert("Please enter your full name.");
        if (!gender) return alert("Please select your gender.");

        await auth.authStateReady();

        let user = auth.currentUser;

        if (!user?.isAnonymous) {
            if (user) await signOut(auth);
            user = (await signInAnonymously(auth)).user;
        }

        await updateProfile(user, { displayName: name });

        await finishSignIn(user, "guest", name, gender);
    });
});


/* =====================================================
   9. GOOGLE SIGN-IN
===================================================== */

async function googleSignIn() {
    const provider = new GoogleAuthProvider();

    // No await before the popup, so browsers allow it to open.
    const current = auth.currentUser;
    let result;

    try {
        result = current?.isAnonymous
            ? await linkWithPopup(current, provider)
            : await signInWithPopup(auth, provider);

    } catch (error) {
        // This Google account already exists: sign in to it instead.
        const credential = error.code === "auth/credential-already-in-use"
            ? GoogleAuthProvider.credentialFromError(error)
            : null;

        if (!credential) throw error;

        result = await signInWithCredential(auth, credential);
    }

    const user = result.user;

    // Refresh so Firestore rules see the new sign-in provider.
    await user.getIdToken(true);

    const saved = await getDoc(doc(db, "Gender", user.uid)).catch(() => null);

    const gender =
        (saved?.exists() && normalizeGender(saved.data().gender)) ||
        savedGender();

    if (gender) {
        await finishSignIn(user, "registered", user.displayName || "", gender);
        return;
    }

    // New Google user without a saved gender: ask for it.
    googleUser = user;
    googleGender.value = "";
    showView("google", "Choose your gender to finish signing in.");
    googleGender.focus();
}

$("googleBtn").addEventListener("click", () => withBusy($("googleBtn"), googleSignIn));

views.google.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!views.google.reportValidity()) return;

    withBusy($("submitGoogleDetailsBtn"), async () => {
        const gender = normalizeGender(googleGender.value);

        if (!gender || !googleUser) return alert("Please select your gender.");

        await finishSignIn(googleUser, "registered", googleUser.displayName || "", gender);
    });
});
