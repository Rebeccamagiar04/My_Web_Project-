
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/* FIREBASE CONFIGURATION */

const firebaseConfig = {
  apiKey: "AIzaSyAoH3X26Hx8jFjaCJcknuB6Kgx7u10nVUE",
  authDomain: "first-webproject-865a5.firebaseapp.com",
  projectId: "first-webproject-865a5",
  storageBucket: "first-webproject-865a5.firebasestorage.app",
  messagingSenderId: "586929157801",
  appId: "1:586929157801:web:46dcd3fee9343ba6895bb8",
  measurementId: "G-DHPQ1CL34X"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_UID = "BmnwopfyXgXq1ByvLtq3eAMbygC2";

/* PAGE ELEMENTS */

const loginSection = document.getElementById("loginSection");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("adminEmail");
const loginPassword = document.getElementById("adminPassword");
const loginButton = document.getElementById("loginButton");
const loginStatus = document.getElementById("loginStatus");
const logoutButton = document.getElementById("logoutButton");

const adminPanel = document.getElementById("adminPanel");
const form = document.getElementById("notificationForm");
const titleInput = document.getElementById("title");
const messageInput = document.getElementById("message");
const postButton = document.getElementById("postButton");
const status = document.getElementById("status");
const notificationList = document.getElementById("adminNotificationList");

let isAdmin = false;
let stopNotificationListener = null;

/* STATUS MESSAGES */

function showLoginStatus(message, isError = false) {
  loginStatus.textContent = message;
  loginStatus.style.color = isError ? "#b42318" : "#18713b";
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? "#b42318" : "#18713b";
}

/* LOGIN */

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  loginButton.disabled = true;
  showLoginStatus("Signing in...");

  try {
    await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value
    );
  } catch (error) {
    console.error("Admin login failed:", error.code, error.message);

    showLoginStatus(
      error.code === "auth/invalid-credential"
        ? "Incorrect email or password."
        : "Sign-in failed. Please check your details and try again.",
      true
    );
  } finally {
    loginButton.disabled = false;
  }
});

/* LOG OUT */

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showLoginStatus("You have been signed out.");
  } catch (error) {
    console.error("Sign-out failed:", error);
    showStatus("Could not sign out. Please try again.", true);
  }
});

/* DISPLAY NOTIFICATIONS IN ADMIN PANEL */

function renderAdminNotifications(snapshot) {
  notificationList.replaceChildren();

  if (snapshot.empty) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No notifications yet.";
    notificationList.appendChild(emptyItem);
    return;
  }

  const items = snapshot.docs.slice().sort((a, b) => {
    const dateA = a.data().createdAt?.toMillis?.() || 0;
    const dateB = b.data().createdAt?.toMillis?.() || 0;
    return dateB - dateA;
  });

  items.forEach(notificationDoc => {
    const data = notificationDoc.data();
    const item = document.createElement("li");

    const title = document.createElement("h3");
    title.textContent = data.title || "Notification";

    const message = document.createElement("p");
    message.textContent = data.message || "";

    const state = document.createElement("p");
    state.textContent =
      data.active === true ? "Status: Active" : "Status: Inactive";

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.textContent =
      data.active === true ? "Deactivate" : "Activate";

    toggleButton.addEventListener("click", async () => {
      if (!isAdmin || auth.currentUser?.uid !== ADMIN_UID) return;

      toggleButton.disabled = true;

      try {
        await updateDoc(
          doc(db, "Notifications", notificationDoc.id),
          { active: data.active !== true }
        );

        showStatus(
          data.active === true
            ? "Notification deactivated."
            : "Notification activated."
        );
      } catch (error) {
        console.error("Notification update failed:", error);
        showStatus("Could not update notification.", true);
      } finally {
        toggleButton.disabled = false;
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.style.marginLeft = "8px";

    deleteButton.addEventListener("click", async () => {
      if (!isAdmin || auth.currentUser?.uid !== ADMIN_UID) return;

      if (!confirm(
        `Permanently delete "${data.title || "Notification"}"? This cannot be undone.`
      )) {
        return;
      }

      deleteButton.disabled = true;

      try {
        await deleteDoc(doc(db, "Notifications", notificationDoc.id));
        showStatus("Notification permanently deleted.");
      } catch (error) {
        console.error("Notification deletion failed:", error);
        showStatus("Could not delete notification.", true);
      } finally {
        deleteButton.disabled = false;
      }
    });

    item.append(title, message, state, toggleButton, deleteButton);
    notificationList.appendChild(item);
  });
}

/* POST A NOTIFICATION */

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin || auth.currentUser?.uid !== ADMIN_UID) {
    showStatus("You are not authorized to post notifications.", true);
    return;
  }

  const title = titleInput.value.trim();
  const message = messageInput.value.trim();

  if (!title || !message) {
    showStatus("Please enter both a title and a message.", true);
    return;
  }

  postButton.disabled = true;
  showStatus("Posting notification...");

  try {
    await addDoc(collection(db, "Notifications"), {
      title,
      message,
      active: true,
      createdAt: serverTimestamp()
    });

    form.reset();
    showStatus("Notification posted successfully!");
  } catch (error) {
    console.error("Notification posting failed:", error);
    showStatus(
      "Could not post notification. Check your connection and permissions.",
      true
    );
  } finally {
    postButton.disabled = false;
  }
});

/* CHECK AUTHENTICATION AND ADMIN UID */

onAuthStateChanged(auth, user => {
  isAdmin = Boolean(user && user.uid === ADMIN_UID);

  if (stopNotificationListener) {
    stopNotificationListener();
    stopNotificationListener = null;
  }

  // Hide the admin panel until the correct account is verified.
  adminPanel.hidden = !isAdmin;
  loginSection.hidden = isAdmin;
  notificationList.replaceChildren();

  if (!isAdmin) {
    showLoginStatus(
      user
        ? "This account is not authorized to manage notifications. Please sign in with the administrator account."
        : "Sign in with your administrator email and password."
    );

    // Sign out any authenticated non-admin account.
    if (user) {
      signOut(auth).catch(error => {
        console.error("Could not sign out unauthorized account:", error);
      });
    }

    return;
  }

  loginPassword.value = "";
  showStatus("Administrator access verified.");

  // Load active and inactive notifications for the admin.
  stopNotificationListener = onSnapshot(
    collection(db, "Notifications"),
    renderAdminNotifications,
    error => {
      console.error(
        "Could not load admin notifications:",
        error.code,
        error.message
      );

      showStatus(
        "Could not load notifications. Check Firestore permissions.",
        true
      );
    }
  );
});
