// js/auth-guard.js

import { auth, db, onAuthStateChanged, getDoc, doc, signOut } from './firebase.js';

/**
 * Call this function at the top of your page scripts.
 * @param {object} options
 * @param {('user'|'admin')} options.expectedRole - The role expected to see this page.
 */
export async function protectPage(options = { expectedRole: 'user' }) {
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- User is logged in, now check their role ---
            console.log("Auth state changed: User is logged in", user.uid);
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                console.error("No user document found in Firestore!");
                await signOut(auth);
                window.location.href = 'login.html';
                return;
            }

            const userData = userDoc.data();
            
            // --- Role-Based Security Check ---
            if (userData.accountType !== options.expectedRole) {
                console.warn(`Role mismatch: Expected '${options.expectedRole}' but got '${userData.accountType}'. Redirecting...`);
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

        } else {
            // --- User is NOT logged in ---
            console.log("Auth state changed: User is not logged in. Redirecting to login.");
            window.location.href = 'login.html';
        }
    });
}

/**
 * Attaches a logout listener to ALL logout buttons
 */
export function setupLogoutButton() {
    // --- THIS IS THE FIX ---
    // Find all logout buttons (in sidebar and profile dropdown)
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
    // --- END FIX ---
}