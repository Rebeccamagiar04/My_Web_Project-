// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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


  //IMPORT AUTHENTICATION
  import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

  //INITIALIZE AUTHENTICATION
  const auth = getAuth(app);
  
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
      alert(error.message);
    });

});


   //GOOGLE signInWithPopup
   const googleBtn = document.getElementById("googleLogin");

googleBtn.addEventListener("click", () => {

  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then((result) => {
    if (result.user) {
      alert("Signed in with Google!");
      console.log(result.user);
    }
    })
    .catch((error) => {
      alert(error.message);
    });

});
  

