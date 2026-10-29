
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
    updateProfile,
    EmailAuthProvider,
    linkWithCredential
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =====================================================
   3. HTML ELEMENTS
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

const guestDetailsForm =
    document.getElementById("guestDetailsForm");

const guestNameInput =
    document.getElementById("guestName");

const guestGenderInput =
    document.getElementById("guestGender");

const cancelGuestFormBtn =
    document.getElementById("cancelGuestFormBtn");

const cancelFormBtn =
    document.getElementById("cancelFormBtn");

const showLoginBtn =
    document.getElementById("showLoginBtn");

const showRegisterBtn =
    document.getElementById("showRegisterBtn");

const showPassword =
    document.getElementById("showPassword");

const GUEST_EXPIRY_KEY = "porticoGuestExpiry";

let formMode = "login";


/* =====================================================
   4. NORMALIZE GENDER VALUES
===================================================== */

function normalizeGender(value) {
    if (!value) return "";

    const gender = String(value)
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, "-");

    if (gender === "female" || gender === "woman") {
        return "female";
    }

    if (gender === "male" || gender === "man") {
        return "male";
    }

    if (
        gender === "prefer-not-to-say" ||
        gender === "prefer-not-to-disclose" ||
        gender === "rather-not-to-say"
    ) {
        return "prefer-not-to-say";
    }

    return "";
}


/* =====================================================
   5. SAVE USER AND COMMUNITY COUNTS
===================================================== */

async function saveUserToFirestore(user, userType, name = "") {
    if (!user) {
        throw new Error("No authenticated user was provided.");
    }

    if (!["registered", "guest"].includes(userType)) {
        throw new Error("Invalid account type.");
    }

    const userRef = doc(db, "Users", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    const cleanName = String(name || "").trim();

    await runTransaction(db, async (transaction) => {
        // Read every document before making any writes.
        const userSnapshot = await transaction.get(userRef);
        const statsSnapshot = await transaction.get(statsRef);

        const userData = userSnapshot.exists()
            ? userSnapshot.data()
            : {};

        const stats = statsSnapshot.exists()
            ? statsSnapshot.data()
            : {};

        const totalUsers = Math.max(
            0,
            Number(stats.totalUsers) || 0
        );

        let registeredUsers = Math.max(
            0,
            Number(stats.registeredUsers) || 0
        );

        let guestUsers = Math.max(
            0,
            Number(stats.guestUsers) || 0
        );

        const previousType = userData.userType || "";

        if (!userSnapshot.exists()) {
            // A genuinely new UID is counted once.
            registeredUsers += userType === "registered" ? 1 : 0;
            guestUsers += userType === "guest" ? 1 : 0;

            transaction.set(userRef, {
                name: cleanName,
                userType: userType,
                createdAt: serverTimestamp()
            });

            transaction.set(statsRef, {
                totalUsers: totalUsers + 1,
                registeredUsers: registeredUsers,
                guestUsers: guestUsers
            }, { merge: true });

            return;
        }

        // Update the existing user without increasing totalUsers.
        if (previousType !== userType) {
            if (previousType === "registered") {
                registeredUsers = Math.max(
                    0,
                    registeredUsers - 1
                );
            }

            if (previousType === "guest") {
                guestUsers = Math.max(
                    0,
                    guestUsers - 1
                );
            }

            if (userType === "registered") {
                registeredUsers += 1;
            }

            if (userType === "guest") {
                guestUsers += 1;
            }

            transaction.set(statsRef, {
                registeredUsers: registeredUsers,
                guestUsers: guestUsers
            }, { merge: true });
        }

        const updatedUserData = {
            userType: userType
        };

        if (cleanName) {
            updatedUserData.name = cleanName;
        }

        transaction.set(
            userRef,
            updatedUserData,
            { merge: true }
        );
    });
}


/* =====================================================
   6. SAVE GENDER AND UPDATE COMMUNITY COUNTS
===================================================== */

async function saveGenderToFirestore(user, gender) {
    if (!user) {
        throw new Error("No authenticated user was provided.");
    }

    const newGender = normalizeGender(gender);

    if (!newGender) {
        throw new Error("Please select a valid gender.");
    }

    const genderRef = doc(db, "Gender", user.uid);
    const statsRef = doc(db, "publicStats", "community");

    await runTransaction(db, async (transaction) => {
        // Read both documents before writing.
        const genderSnapshot = await transaction.get(genderRef);
        const statsSnapshot = await transaction.get(statsRef);

        const stats = statsSnapshot.exists()
            ? statsSnapshot.data()
            : {};

        const oldGender = genderSnapshot.exists()
            ? normalizeGender(genderSnapshot.data().gender)
            : "";

        const femaleUsers = Math.max(
            0,
            Number(stats.femaleUsers) || 0
        );

        const maleUsers = Math.max(
            0,
            Number(stats.maleUsers) || 0
        );

        // Do not count the same gender twice.
        if (oldGender === newGender) {
            return;
        }

        let updatedFemaleUsers = femaleUsers;
        let updatedMaleUsers = maleUsers;

        if (oldGender === "female") {
            updatedFemaleUsers = Math.max(
                0,
                updatedFemaleUsers - 1
            );
        }

        if (oldGender === "male") {
            updatedMaleUsers = Math.max(
                0,
                updatedMaleUsers - 1
            );
        }

        if (newGender === "female") {
            updatedFemaleUsers += 1;
        }

        if (newGender === "male") {
            updatedMaleUsers += 1;
        }

        transaction.set(genderRef, {
            gender: newGender,
            timestamp: serverTimestamp()
        }, { merge: true });

        // Prefer not to say is stored but isn't added to
        // either the female or male statistics.
        transaction.set(statsRef, {
            femaleUsers: updatedFemaleUsers,
            maleUsers: updatedMaleUsers
        }, { merge: true });
    });
}


/* =====================================================
   7. KEEP FIREBASE DISPLAY NAME AND FIRESTORE NAME
      IN SYNC
===================================================== */

async function saveUserName(user, name) {
    const cleanName = String(name || "").trim();

    if (!user || !cleanName) return;

    if (user.displayName !== cleanName) {
        await updateProfile(user, {
            displayName: cleanName
        });
    }
}


/* =====================================================
   8. REGISTRATION GENDER FIELD
      Create it automatically if HTML doesn't contain it.
===================================================== */

let registrationGenderInput =
    document.getElementById("registrationGender");

let registrationGenderGroup =
    document.getElementById("registrationGenderGroup");

if (!registrationGenderInput && accountForm && nameGroup) {
    registrationGenderGroup = document.createElement("div");

    registrationGenderGroup.id = "registrationGenderGroup";
    registrationGenderGroup.className = "field-group";
    registrationGenderGroup.hidden = true;

    const genderLabel = document.createElement("label");
    genderLabel.htmlFor = "registrationGender";
    genderLabel.textContent = "Gender";

    registrationGenderInput = document.createElement("select");
    registrationGenderInput.id = "registrationGender";
    registrationGenderInput.name = "registrationGender";
    registrationGenderInput.required = false;

    registrationGenderInput.style.width = "100%";
    registrationGenderInput.style.minHeight = "46px";
    registrationGenderInput.style.padding = "12px";
    registrationGenderInput.style.border = "1px solid #dce6f0";
    registrationGenderInput.style.borderRadius = "8px";
    registrationGenderInput.style.background = "#fff";
    registrationGenderInput.style.color = "#1b2b42";
    registrationGenderInput.style.fontFamily = "Arial, sans-serif";
    registrationGenderInput.style.fontSize = "14px";

    const genderOptions = [
        ["", "Select your gender"],
        ["female", "Female"],
        ["male", "Male"],
        ["prefer-not-to-say", "Prefer not to say"]
    ];

    genderOptions.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        registrationGenderInput.appendChild(option);
    });

    registrationGenderGroup.append(
        genderLabel,
        registrationGenderInput
    );

    nameGroup.insertAdjacentElement(
        "afterend",
        registrationGenderGroup
    );
}


/* =====================================================
   9. SHOW LOGIN OR REGISTRATION FORM
===================================================== */

function openForm(mode) {
    formMode = mode;

    accountForm.hidden = false;
    guestDetailsForm.hidden = true;
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

    if (registrationGenderGroup) {
        registrationGenderGroup.hidden = !isRegister;
    }

    if (registrationGenderInput) {
        registrationGenderInput.required = isRegister;
    }

    passwordInput.autocomplete = isRegister
        ? "new-password"
        : "current-password";

    submitBtn.setAttribute(
        "aria-label",
        isRegister ? "Create account" : "Log in"
    );

    accountForm.reset();

    // Reuse details saved by the questionnaire or guest form.
    nameInput.value =
        localStorage.getItem("questionnaireName") || "";

    if (registrationGenderInput) {
        registrationGenderInput.value = normalizeGender(
            localStorage.getItem("questionnaireGender")
        );
    }

    if (isRegister && !nameInput.value) {
        nameInput.focus();
    } else {
        emailInput.focus();
    }

    if (showPassword) {
        showPassword.checked = false;
        passwordInput.type = "password";
    }
}


function closeForm() {
    accountForm.reset();
    accountForm.hidden = true;

    if (registrationGenderGroup) {
        registrationGenderGroup.hidden = true;
    }

    if (registrationGenderInput) {
        registrationGenderInput.required = false;
    }

    accessOptions.hidden = false;
    guestDetailsForm.hidden = true;
    guestNote.hidden = false;

    introText.textContent =
        "Your next opportunity starts with a single step. Choose how you'd like to continue.";
}


showLoginBtn.addEventListener("click", () => openForm("login"));

showRegisterBtn.addEventListener("click", () => openForm("register"));

cancelFormBtn.addEventListener("click", closeForm);


/* =====================================================
   10. OPEN GUEST DETAILS FORM
===================================================== */

guestBtn.addEventListener("click", () => {
    guestDetailsForm.reset();

    // Use questionnaire details when already available.
    guestNameInput.value =
        localStorage.getItem("questionnaireName") || "";

    guestGenderInput.value = normalizeGender(
        localStorage.getItem("questionnaireGender")
    );

    accessOptions.hidden = true;
    accountForm.hidden = true;
    guestDetailsForm.hidden = false;
    guestNote.hidden = true;

    introText.textContent =
        "Enter your name and choose a gender to continue as a guest.";

    if (!guestNameInput.value) {
        guestNameInput.focus();
    } else {
        guestGenderInput.focus();
    }
});


/* =====================================================
   11. CANCEL GUEST DETAILS FORM
===================================================== */

cancelGuestFormBtn.addEventListener("click", () => {
    guestDetailsForm.reset();
    guestDetailsForm.hidden = true;
    accessOptions.hidden = false;
    guestNote.hidden = false;

    introText.textContent =
        "Your next opportunity starts with a single step. Choose how you'd like to continue.";
});


/* =====================================================
   12. LOGIN AND CREATE ACCOUNT
===================================================== */

accountForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!accountForm.reportValidity()) return;

    submitBtn.disabled = true;

    const originalIcon = submitBtn.innerHTML;
    submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (formMode === "register") {
            const name = nameInput.value.trim();

            const gender = normalizeGender(
                registrationGenderInput?.value ||
                localStorage.getItem("questionnaireGender")
            );

            if (!name) {
                alert("Please enter your full name.");
                nameInput.focus();
                return;
            }

            if (!gender) {
                alert("Please select your gender.");
                registrationGenderInput?.focus();
                return;
            }

            localStorage.setItem("questionnaireName", name);
            localStorage.setItem("questionnaireGender", gender);

            await auth.authStateReady();

            let user;

            // If the visitor is already a guest, link the email
            // credentials to that same Firebase UID.
            if (auth.currentUser?.isAnonymous) {
                const credential = EmailAuthProvider.credential(
                    email,
                    password
                );

                const result = await linkWithCredential(
                    auth.currentUser,
                    credential
                );

                user = result.user;

            } else {
                const result = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                user = result.user;
            }

            await saveUserName(user, name);

            await saveUserToFirestore(
                user,
                "registered",
                name
            );

            await saveGenderToFirestore(user, gender);

            // A registered account must not retain a guest expiry.
            localStorage.removeItem(GUEST_EXPIRY_KEY);

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

            // Login must not increment community statistics.
            // Refresh the stored name only when it is available.
            if (user.displayName) {
                await setDoc(
                    doc(db, "Users", user.uid),
                    { name: user.displayName },
                    { merge: true }
                );
            }

            localStorage.removeItem(GUEST_EXPIRY_KEY);

            alert("Login successful!");

            window.location.replace("home.html");
        }

    } catch (error) {
        console.error(
            "Authentication error:",
            error.code,
            error.message
        );

        alert(getFriendlyError(error.code));

    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalIcon;
    }
});


/* =====================================================
   13. CONTINUE AS GUEST: SAVE DETAILS AND SIGN IN
===================================================== */

guestDetailsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!guestDetailsForm.reportValidity()) return;

    const name = guestNameInput.value.trim();
    const gender = normalizeGender(guestGenderInput.value);

    if (!name) {
        alert("Please enter your full name.");
        guestNameInput.focus();
        return;
    }

    if (!gender) {
        alert("Please select your gender.");
        guestGenderInput.focus();
        return;
    }

    const guestSubmitBtn =
        document.getElementById("submitGuestDetailsBtn");

    const originalText = guestSubmitBtn.textContent;

    guestSubmitBtn.disabled = true;
    guestSubmitBtn.textContent = "Please wait...";

    try {
        await auth.authStateReady();

        let user = auth.currentUser;

        if (user && user.isAnonymous) {
            // Reuse the existing anonymous UID.
            console.log("Reusing guest UID:", user.uid);

        } else {
            // If a registered user chooses guest access,
            // sign out before creating the anonymous session.
            if (user) {
                await signOut(auth);
            }

            const result = await signInAnonymously(auth);
            user = result.user;
        }

        // Keep local details available for the current browser.
        localStorage.setItem("questionnaireName", name);
        localStorage.setItem("questionnaireGender", gender);

        // Save the display name and both Firestore records.
        await saveUserName(user, name);

        await saveUserToFirestore(
            user,
            "guest",
            name
        );

        await saveGenderToFirestore(user, gender);

        // Start the 24-hour guest period after successful saves.
        localStorage.setItem(
            GUEST_EXPIRY_KEY,
            String(Date.now() + 24 * 60 * 60 * 1000)
        );

        console.log("Guest access started:", user.uid);

        window.location.replace("home.html");

    } catch (error) {
        console.error(
            "Guest sign-in failed:",
            error.code,
            error.message
        );

        alert(
            "Unable to continue as guest. Please check your internet connection and try again."
        );

    } finally {
        guestSubmitBtn.disabled = false;
        guestSubmitBtn.textContent = originalText;
    }
});


/* =====================================================
   14. PASSWORD VISIBILITY
===================================================== */

if (showPassword) {
    showPassword.addEventListener("change", () => {
        passwordInput.type = showPassword.checked
            ? "text"
            : "password";
    });
}


/* =====================================================
   15. FRIENDLY ERROR MESSAGES
===================================================== */

function getFriendlyError(code) {
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

        case "auth/invalid-password":
            return "Please check your password and try again.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        case "auth/operation-not-allowed":
            return "This sign-in method is not enabled in Firebase.";

        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";

        case "auth/credential-already-in-use":
            return "This email already belongs to another account. Please log in to that account instead.";

        case "auth/email-already-in-use":
            return "This email already has an account. Please log in instead.";

        default:
            return "Something went wrong. Please try again.";
    }
}
