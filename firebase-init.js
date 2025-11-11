// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAI31wig54dJMZ67M5kszZcUB0XYaKTMVE",
  authDomain: "komunikonek-66b8a.firebaseapp.com",
  projectId: "komunikonek-66b8a",
  storageBucket: "komunikonek-66b8a.firebasestorage.app",
  messagingSenderId: "940871451272",
  appId: "1:940871451272:web:133704eb28f959f37f553d",
  measurementId: "G-V396RPRTS9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export the services so other files can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);