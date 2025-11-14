// js/auth-guard.js

import { auth, db, onAuthStateChanged, getDoc, doc, setDoc, serverTimestamp, signOut } from './firebase.js';

/**
 * Call this function at the top of your page scripts.
 * @param {object} options
 * @param {('user'|'admin')} options.expectedRole - The role expected to see this page.
 */
export function protectPage(options = { expectedRole: 'user' }) {
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- User is logged in, now check their role ---
            console.log("Auth Guard: User detected:", user.uid);
            
            try {
                const userDocRef = doc(db, "users", user.uid);
                let userDoc = await getDoc(userDocRef);
                let userData;

                // --- "SELF-HEALING" FIX ---
                // If the user is authenticated but has no profile, create one.
                if (!userDoc.exists()) {
                    console.warn("Auth Guard: No profile found. Creating one.");
                    userData = {
                        accountType: "user", // Default to 'user'
                        createdAt: serverTimestamp()
                    };
                    if(user.email) userData.email = user.email;
                    if(user.phoneNumber) userData.phone = user.phoneNumber;

                    await setDoc(userDocRef, userData);
                } else {
                    userData = userDoc.data();
                }
                
                // --- Role-Based Security Check ---
                if (userData.accountType !== options.expectedRole) {
                    console.warn(`Auth Guard: Role mismatch. Expected ${options.expectedRole}, got ${userData.accountType}. Redirecting...`);
                    // Kick them to the correct page
                    if (userData.accountType === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                    return;
                }

                // --- Success! User is logged in and has the correct role ---
                console.log("User authenticated and authorized.", userData);
                
                // Dispatch a custom event to tell the page it's safe to load
                const event = new CustomEvent('user-loaded', { detail: { user, userData } });
                document.dispatchEvent(event);

            } catch (error) {
                console.error("Auth Guard: Error fetching profile:", error);
                await signOut(auth);
                window.location.href = 'login.html';
            }

        } else {
            // --- User is NOT logged in ---
            console.log("Auth Guard: No user logged in. Redirecting to login.");
            window.location.href = 'login.html';
        }
    });
}

/**
 * Attaches a logout listener to ALL logout buttons
 */
export function setupLogoutButton() {
    const logoutButtons = [
        document.getElementById('logout-button'),
        document.getElementById('logout-button-alt')
    ];

    const handleLogout = async (e) => {
        e.preventDefault(); // Prevents the <a> tag from navigating
        try {
            await signOut(auth);
            console.log("User signed out.");
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    logoutButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', handleLogout);
        }
    });
}