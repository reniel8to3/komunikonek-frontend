// Import all functions we need from the official Firebase CDN URLs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    RecaptchaVerifier, 
    signInWithPhoneNumber,
    sendEmailVerification,  
    signOut,
    signInWithEmailAndPassword, 
    setPersistence,           
    browserSessionPersistence, 
    browserLocalPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    limit,
    orderBy,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Storage imports are REMOVED because we are on the free plan


// -------------------------------------------------------------------
// ⚠️ YOUR CONFIGURATION GOES HERE
// -------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR-PROJECT-ID.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT-ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
// -------------------------------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// EXPORT everything we need in other files
export { 
    app, 
    auth, 
    db, 
    
    // Auth Functions
    createUserWithEmailAndPassword, 
    RecaptchaVerifier, 
    signInWithPhoneNumber,
    sendEmailVerification,
    signOut,
    signInWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
    
    // Firestore Functions
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    limit,
    orderBy,
    addDoc,
    serverTimestamp
};