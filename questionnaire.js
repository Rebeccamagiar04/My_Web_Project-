
/* =====================================================
   PORTICO KAKUMA
   QUESTIONNAIRE AND AUTHENTICATION SYSTEM

   Firebase SDK: 12.14.0

   Features:
   - Personalisation
   - Email account creation
   - Email login
   - Google authentication
   - Anonymous guest access
   - Firestore user profiles
   - Gender statistics
   - Community user statistics
===================================================== */


/* =====================================================
   1. FIREBASE IMPORTS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
    getAnalytics,
    isSupported
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";

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
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


/* =====================================================
   2. FIREBASE CONFIGURATION

   IMPORTANT:
   Copy the exact apiKey from Firebase Console.
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

const auth = getAuth(app);

const db = getFirestore(app);


// Analytics must never prevent authentication
// or questionnaire navigation from working.

isSupported()
    .then((supported) => {

        if (supported) {
            getAnalytics(app);
        }

    })
    .catch((error) => {

        console.warn(
            "Analytics unavailable:",
            error
        );

    });


/* =====================================================
   4. HTML ELEMENTS
===================================================== */

// Form

const form = document.getElementById("form-page");


// Stages

const personalisationStage = document.getElementById(
    "personalisation-stage"
);

const accountStage = document.getElementById(
    "account-stage"
);


// Personalisation fields

const nameInput = document.getElementById("name");

const levelInput = document.getElementById("level");

const genderOptions = document.querySelectorAll(
    'input[name="gender"]'
);


// Navigation

const continueBtn = document.getElementById("continue-btn");

const personaliseBtn = document.getElementById("personalise-btn");

const backBtn = document.getElementById("back-btn");


// Progress

const progressBar = document.getElementById("progress-bar");


// Authentication buttons

const signupBtn = document.getElementById("createAccount");

const googleBtn = document.getElementById("googleLogin");

const loginBtn = document.getElementById("login-btn");

const guestBtn = document.getElementById("guestBtn");


// Account fields

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const showPassword = document.getElementById("showPassword");


// Check that the essential HTML elements exist.

if (
    !form ||
    !personalisationStage ||
    !accountStage ||
    !nameInput ||
    !levelInput ||
    !progressBar ||
    !continueBtn ||
    !personaliseBtn ||
    !backBtn
) {

    throw new Error(
        "Questionnaire initialization failed. Check the HTML element IDs."
    );

}


/* =====================================================
   5. LOCAL STORAGE KEYS
===================================================== */

const STORAGE_KEYS = {

    name: "questionnaireName",

    gender: "questionnaireGender",

    level: "questionnaireLevel"

};


/* =====================================================
   6. PERSONALISATION STORAGE
===================================================== */


// Save all personalisation answers.

function savePersonalisationLocally() {

    const name = nameInput.value.trim();

    const selectedGender = document.querySelector(
        'input[name="gender"]:checked'
    );

    const gender = selectedGender
        ? selectedGender.value
        : "";

    const level = levelInput.value;


    localStorage.setItem(
        STORAGE_KEYS.name,
        name
    );

    localStorage.setItem(
        STORAGE_KEYS.gender,
        gender
    );

    localStorage.setItem(
        STORAGE_KEYS.level,
        level
    );

}


// Restore previously saved answers.

function restorePersonalisation() {

    const savedName = localStorage.getItem(
        STORAGE_KEYS.name
    );

    const savedGender = localStorage.getItem(
        STORAGE_KEYS.gender
    );

    const savedLevel = localStorage.getItem(
        STORAGE_KEYS.level
    );


    if (savedName) {

        nameInput.value = savedName;

    }


    if (savedGender) {

        genderOptions.forEach((option) => {

            option.checked =
                option.value === savedGender;

        });

    }


    if (savedLevel) {

        levelInput.value = savedLevel;

    }

}


// Restore answers when the page opens.

restorePersonalisation();


// Automatically save name changes.

nameInput.addEventListener("input", () => {

    localStorage.setItem(
        STORAGE_KEYS.name,
        nameInput.value.trim()
    );

});


// Automatically save gender changes.

genderOptions.forEach((option) => {

    option.addEventListener("change", () => {

        localStorage.setItem(
            STORAGE_KEYS.gender,
            option.value
        );

    });

});


// Automatically save education-level changes.

levelInput.addEventListener("change", () => {

    localStorage.setItem(
        STORAGE_KEYS.level,
        levelInput.value
    );

});


/* =====================================================
   7. PERSONALISATION VALIDATION
===================================================== */

function validatePersonalisation() {

    const name = nameInput.value.trim();

    const selectedGender = document.querySelector(
        'input[name="gender"]:checked'
    );

    const level = levelInput.value;


    if (!name) {

        alert("Please enter your name.");

        nameInput.focus();

        return false;

    }


    if (!selectedGender) {

        alert("Please select your gender.");

        return false;

    }


    if (!level) {

        alert(
            "Please select the education level you are looking for."
        );

        levelInput.focus();

        return false;

    }


    savePersonalisationLocally();

    return true;

}


/* =====================================================
   8. STAGE NAVIGATION
===================================================== */

function showStage(stage) {

    personalisationStage.classList.remove("active");

    accountStage.classList.remove("active");


    if (stage === 1) {

        personalisationStage.classList.add("active");

        progressBar.style.width = "50%";

    }


    if (stage === 2) {

        accountStage.classList.add("active");

        progressBar.style.width = "100%";

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// Continue to account activation.

continueBtn.addEventListener("click", () => {

    if (!validatePersonalisation()) return;

    showStage(2);

});


// Personalise without creating an account.

personaliseBtn.addEventListener("click", () => {

    if (!validatePersonalisation()) return;

    window.location.replace("index.html");

});


// Return to personalisation.

backBtn.addEventListener("click", () => {

    showStage(1);

});


// Prevent accidental form submission.

form.addEventListener("submit", (event) => {

    event.preventDefault();

});


/* =====================================================
   9. SAVE GENDER TO FIRESTORE

   One gender record per Firebase UID.

   Existing gender counts are adjusted when
   a user's recorded gender changes.
===================================================== */

async function saveGenderToFirestore(user, gender) {

    if (!user || !gender) return;


    const genderRef = doc(
        db,
        "Gender",
        user.uid
    );


    const statsRef = doc(
        db,
        "publicStats",
        "community"
    );


    const newGender = gender.trim().toLowerCase();


    await runTransaction(db, async (transaction) => {


        // Read both documents before writing.

        const genderSnapshot = await transaction.get(
            genderRef
        );

        const statsSnapshot = await transaction.get(
            statsRef
        );


        const oldGender = genderSnapshot.exists()

            ? String(
                genderSnapshot.data().gender || ""
            ).trim().toLowerCase()

            : null;


        // Avoid counting the same answer twice.

        if (oldGender === newGender) return;


        const stats = statsSnapshot.exists()

            ? statsSnapshot.data()

            : {};


        const femaleUsers =
            Number(stats.femaleUsers) || 0;

        const maleUsers =
            Number(stats.maleUsers) || 0;


        let newFemaleUsers = femaleUsers;

        let newMaleUsers = maleUsers;


        // Remove previous count.

        if (oldGender === "female") {

            newFemaleUsers = Math.max(
                0,
                newFemaleUsers - 1
            );

        } else if (oldGender === "male") {

            newMaleUsers = Math.max(
                0,
                newMaleUsers - 1
            );

        }


        // Add new count.

        if (newGender === "female") {

            newFemaleUsers++;

        } else if (newGender === "male") {

            newMaleUsers++;

        }


        transaction.set(
            genderRef,
            {

                gender: newGender,

                timestamp: serverTimestamp()

            },
            { merge: true }
        );


        // Prefer not to say is recorded but not counted
        // in female or male statistics.

        if (
            oldGender === "female" ||
            oldGender === "male" ||
            newGender === "female" ||
            newGender === "male"
        ) {

            transaction.set(
                statsRef,
                {

                    femaleUsers: newFemaleUsers,

                    maleUsers: newMaleUsers

                },
                { merge: true }
            );

        }

    });

}


/* =====================================================
   10. SAVE USERS AND AUTHENTICATION STATISTICS

   Each UID is counted only once.

   Existing users are not counted again.
   Authentication method counts are maintained.
===================================================== */

async function saveUserToFirestore(
    user,
    userType,
    authMethod
) {

    if (!user) return;


    if (
        userType !== "registered" &&
        userType !== "guest"
    ) {

        return;

    }


    const userRef = doc(
        db,
        "Users",
        user.uid
    );


    const statsRef = doc(
        db,
        "publicStats",
        "community"
    );


    const methodCounters = {

        emailPassword: "emailPasswordUsers",

        google: "googleUsers",

        guest: "anonymousUsers"

    };


    const newMethodCounter =
        methodCounters[authMethod];


    if (!newMethodCounter) {

        throw new Error(
            "Invalid authentication method: " + authMethod
        );

    }


    await runTransaction(db, async (transaction) => {


        // Read both documents first.

        const userSnapshot = await transaction.get(
            userRef
        );

        const statsSnapshot = await transaction.get(
            statsRef
        );


        const stats = statsSnapshot.exists()

            ? statsSnapshot.data()

            : {};


        const userData = userSnapshot.exists()

            ? userSnapshot.data()

            : {};


        const isNewUser = !userSnapshot.exists();

        const oldMethod = userData.authMethod || null;


        const updatedUserData = {

            authMethod: authMethod,

            lastSignInAt: serverTimestamp()

        };


        if (isNewUser) {


            updatedUserData.userType = userType;

            updatedUserData.createdAt =
                serverTimestamp();


            const totalUsers =
                Number(stats.totalUsers) || 0;

            const registeredUsers =
                Number(stats.registeredUsers) || 0;

            const guestUsers =
                Number(stats.guestUsers) || 0;

            const methodCount =
                Number(stats[newMethodCounter]) || 0;


            transaction.set(
                userRef,
                updatedUserData
            );


            transaction.set(
                statsRef,
                {

                    totalUsers: totalUsers + 1,

                    registeredUsers:
                        registeredUsers +
                        (userType === "registered" ? 1 : 0),

                    guestUsers:
                        guestUsers +
                        (userType === "guest" ? 1 : 0),

                    [newMethodCounter]:
                        methodCount + 1

                },
                { merge: true }
            );


        } else {


            // Existing users are never counted as new users.

            transaction.set(
                userRef,
                updatedUserData,
                { merge: true }
            );


            // Update method statistics only when
            // the recorded authentication method changes.

            if (oldMethod !== authMethod) {


                const oldMethodCounter =
                    methodCounters[oldMethod];


                const changes = {};


                if (oldMethodCounter) {

                    const oldCount =
                        Number(stats[oldMethodCounter]) || 0;

                    changes[oldMethodCounter] =
                        Math.max(0, oldCount - 1);

                }


                const newCount =
                    Number(stats[newMethodCounter]) || 0;


                changes[newMethodCounter] =
                    newCount + 1;


                transaction.set(
                    statsRef,
                    changes,
                    { merge: true }
                );

            }

        }

    });

}


/* =====================================================
   11. SAVE USER PROFILE

   Existing personal information is preserved.

   New profiles receive questionnaire information.

   Existing profiles only receive missing information.
===================================================== */

async function saveUserProfileToFirestore(
    user,
    userType,
    authMethod
) {

    if (!user) return null;


    const profileRef = doc(
        db,
        "UserProfiles",
        user.uid
    );


    // Get the visitor's current questionnaire answers.

    const localName = (
        localStorage.getItem(STORAGE_KEYS.name) || ""
    ).trim();


    const localGender = (
        localStorage.getItem(STORAGE_KEYS.gender) || ""
    ).trim().toLowerCase();


    const localLevel = (
        localStorage.getItem(STORAGE_KEYS.level) || ""
    ).trim();


    let savedGender = "";


    await runTransaction(db, async (transaction) => {


        const profileSnapshot = await transaction.get(
            profileRef
        );


        const existingProfile = profileSnapshot.exists()

            ? profileSnapshot.data()

            : {};


        // Existing Firestore information takes priority.
        // This prevents old browser data from replacing
        // an existing user's saved preferences.

        const name =
            existingProfile.name ||
            localName ||
            user.displayName ||
            "";


        const gender =
            existingProfile.gender ||
            localGender ||
            "";


        const level =
            existingProfile.level ||
            localLevel ||
            "";


        savedGender = gender;


        const profileData = {

            userType: userType,

            authMethod: authMethod,

            name: name,

            gender: gender,

            level: level,

            questionnaireComplete: Boolean(
                name && gender && level
            ),

            updatedAt: serverTimestamp()

        };


        // Only set creation date for new profiles.

        if (!profileSnapshot.exists()) {

            profileData.createdAt =
                serverTimestamp();

        }


        transaction.set(
            profileRef,
            profileData,
            { merge: true }
        );

    });


    console.log(
        "USER PROFILE SAVED:",
        user.uid
    );


    return savedGender;

}


/* =====================================================
   12. SAVE ALL USER DATA

   Each operation is independently protected.

   A failure in one collection does not prevent
   attempts to save the remaining collections.
===================================================== */

async function saveAllUserData(
    user,
    userType,
    authMethod
) {


    const failed = [];


    // Save profile first so that we can use the
    // existing Firestore gender rather than stale
    // local storage when updating gender statistics.

    let profileGender = "";


    try {

        profileGender = await saveUserProfileToFirestore(
            user,
            userType,
            authMethod
        );

    } catch (error) {

        console.error(
            "UserProfiles save failed:",
            error.code,
            error.message
        );

        failed.push(
            "UserProfiles: " +
            (error.code || error.message)
        );

    }


    // Save user record and authentication statistics.

    try {

        await saveUserToFirestore(
            user,
            userType,
            authMethod
        );

    } catch (error) {

        console.error(
            "Users save failed:",
            error.code,
            error.message
        );

        failed.push(
            "Users: " +
            (error.code || error.message)
        );

    }


    // Save gender using the profile's saved answer.
    // Local storage is only a fallback if profile
    // saving failed.

    const genderToSave =
        profileGender ||
        localStorage.getItem(STORAGE_KEYS.gender) ||
        "";


    if (genderToSave) {

        try {

            await saveGenderToFirestore(
                user,
                genderToSave
            );

        } catch (error) {

            console.error(
                "Gender save failed:",
                error.code,
                error.message
            );

            failed.push(
                "Gender: " +
                (error.code || error.message)
            );

        }

    }


    return failed;

}


/* =====================================================
   13. BUSY BUTTON HELPER
===================================================== */

async function withBusy(button, task) {

    if (!button) return;


    const originalText = button.textContent;


    button.disabled = true;

    button.textContent = "Please wait...";


    try {

        await task();

    } catch (error) {


        console.error(
            "Authentication operation failed:",
            error.code,
            error.message,
            error
        );


        alert(
            "Firebase Error Code: " +
            (error.code || "Unknown") +

            "\n\nError Message: " +
            (error.message || "Unknown error") +

            "\n\n" +
            getFriendlyError(error.code)
        );


    } finally {

        button.disabled = false;

        button.textContent = originalText;

    }

}


/* =====================================================
   14. SUCCESSFUL AUTHENTICATION HANDLING
===================================================== */

async function finishAuthentication(
    user,
    userType,
    authMethod,
    successMessage
) {


    const failed = await saveAllUserData(
        user,
        userType,
        authMethod
    );


    if (failed.length > 0) {


        console.error(
            "Some Firestore operations failed:",
            failed
        );


        alert(

            "You are authenticated, but some profile " +
            "information could not be saved:\n\n" +

            failed.join("\n") +

            "\n\nPlease contact us if this continues."

        );


    } else {


        alert(successMessage);

    }


    // Firebase authentication has succeeded.
    // Continue to the homepage even if a non-auth
    // Firestore operation needs attention.

    window.location.replace("index.html");

}


/* =====================================================
   15. CREATE ACCOUNT WITH EMAIL AND PASSWORD
===================================================== */

if (signupBtn) {


    signupBtn.addEventListener("click", async () => {


        // New accounts must complete personalisation.

        if (!validatePersonalisation()) return;


        const email = emailInput.value.trim();

        const password = passwordInput.value;


        if (!email) {

            alert("Please enter your email address.");

            emailInput.focus();

            return;

        }


        if (!password) {

            alert("Please create a password.");

            passwordInput.focus();

            return;

        }


        if (password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            passwordInput.focus();

            return;

        }


        await withBusy(signupBtn, async () => {


            const name = nameInput.value.trim();


            // Create the Firebase Authentication account.

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user = userCredential.user;


            // Save the visitor's chosen name
            // to their Firebase Authentication profile.

            try {

                await updateProfile(user, {

                    displayName: name

                });

            } catch (error) {

                console.error(
                    "Display name update failed:",
                    error.code,
                    error.message
                );

            }


            await finishAuthentication(

                user,

                "registered",

                "emailPassword",

                "Your account has been created successfully!"

            );

        });

    });

}


/* =====================================================
   16. GOOGLE SIGN-IN
===================================================== */

if (googleBtn) {


    googleBtn.addEventListener("click", async () => {


        if (!validatePersonalisation()) return;


        await withBusy(googleBtn, async () => {


            const provider = new GoogleAuthProvider();


            const result = await signInWithPopup(
                auth,
                provider
            );


            const user = result.user;


            console.log(
                "Google sign-in successful:",
                user.email
            );


            // The questionnaire name takes priority.
            // Use Google's display name only when
            // the questionnaire name is unavailable.

            if (
                !localStorage.getItem(STORAGE_KEYS.name) &&
                user.displayName
            ) {

                localStorage.setItem(
                    STORAGE_KEYS.name,
                    user.displayName
                );

            }


            await finishAuthentication(

                user,

                "registered",

                "google",

                "You have successfully signed in with Google!"

            );

        });

    });

}


/* =====================================================
   17. LOGIN WITH EMAIL AND PASSWORD
===================================================== */

if (loginBtn) {


    loginBtn.addEventListener("click", async () => {


        const email = emailInput.value.trim();

        const password = passwordInput.value;


        if (!email) {

            alert("Please enter your email address.");

            emailInput.focus();

            return;

        }


        if (!password) {

            alert("Please enter your password.");

            passwordInput.focus();

            return;

        }


        await withBusy(loginBtn, async () => {


            // Authenticate the existing account.

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user = userCredential.user;


            console.log(
                "Email login successful:",
                user.email
            );


            // Do not overwrite an existing profile
            // with potentially outdated local storage.
            // The profile-saving function handles this.


            await finishAuthentication(

                user,

                "registered",

                "emailPassword",

                "Login successful!"

            );

        });

    });

}


/* =====================================================
   18. CONTINUE AS GUEST

   No 24-hour expiry is created.

   Existing anonymous sessions are reused.
===================================================== */

if (guestBtn) {


    guestBtn.addEventListener("click", async () => {


        if (!validatePersonalisation()) return;


        await withBusy(guestBtn, async () => {


            let user = auth.currentUser;


            // Reuse an existing anonymous session.

            if (user && user.isAnonymous) {


                console.log(
                    "Reusing guest account:",
                    user.uid
                );


            } else {


                // Sign out another account before
                // creating a separate guest session.

                if (user) {

                    await signOut(auth);

                }


                const result = await signInAnonymously(auth);

                user = result.user;

            }


            await finishAuthentication(

                user,

                "guest",

                "guest",

                "You are now continuing as a guest!"

            );

        });

    });

}


/* =====================================================
   19. FRIENDLY ERROR MESSAGES
===================================================== */

function getFriendlyError(code) {


    switch (code) {


        case "auth/email-already-in-use":

            return "This email already has an account. Please log in instead.";


        case "auth/weak-password":

            return "Your password must be at least 6 characters.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/invalid-login-credentials":

        case "auth/invalid-credential":

        case "auth/wrong-password":

        case "auth/user-not-found":

            return "Incorrect email or password. Please try again.";


        case "auth/user-disabled":

            return "This account has been disabled. Please contact support.";


        case "auth/popup-closed-by-user":

            return "The Google sign-in window was closed before sign-in finished.";


        case "auth/popup-blocked":

            return "Your browser blocked the Google sign-in window. Please allow pop-ups and try again.";


        case "auth/cancelled-popup-request":

            return "A Google sign-in request is already in progress.";


        case "auth/network-request-failed":

            return "Network error. Check your internet connection and try again.";


        case "auth/too-many-requests":

            return "Too many attempts. Please wait a while and try again.";


        case "auth/operation-not-allowed":

            return "This sign-in method is not enabled in Firebase Authentication.";


        case "auth/api-key-not-valid":

            return "Your Firebase API key is invalid or incorrectly configured. Check your Firebase project configuration and Google Cloud API key restrictions.";


        case "auth/unauthorized-domain":

            return "This website domain is not authorized in Firebase Authentication.";


        case "permission-denied":

            return "Firestore permissions prevented information from being saved. Check your Firestore security rules.";


        case "unavailable":

            return "The database is temporarily unavailable. Please try again.";


        case "auth/internal-error":

            return "Firebase encountered an internal error. Please try again.";


        default:

            return "An unexpected error occurred. Please check the error details and try again.";

    }

}


/* =====================================================
   20. PASSWORD VISIBILITY
===================================================== */

if (showPassword && passwordInput) {


    showPassword.addEventListener("change", () => {


        passwordInput.type = showPassword.checked

            ? "text"

            : "password";

    });

}


/* =====================================================
   21. INITIALIZE QUESTIONNAIRE
===================================================== */

// Always begin at Stage 1.

showStage(1);


console.log(
    "Portico Kakuma questionnaire initialized successfully."
);
