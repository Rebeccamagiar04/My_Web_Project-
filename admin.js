
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

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

const ADMIN_UID = "cjImzlagCxNFWDm2dEXwz2kwTbf1";

const form = document.getElementById("notificationForm");
const titleInput = document.getElementById("title");
const messageInput = document.getElementById("message");
const postButton = document.getElementById("postButton");
const status = document.getElementById("status");

let isAdmin = false;

function showStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? "#b42318" : "#18713b";
}

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
      "Could not post notification. Check your access and connection.",
      true
    );
  } finally {
    postButton.disabled = false;
  }
});

onAuthStateChanged(auth, user => {
  isAdmin = Boolean(user && user.uid === ADMIN_UID);

  if (!isAdmin) {
    form.hidden = true;
    showStatus(
      user
        ? "Access denied. This account is not authorized."
        : "Please sign in with your administrator account to use this page.",
      true
    );
    return;
  }

  form.hidden = false;
  showStatus("Administrator access verified.");
});
