// js/translations-loader.js
import { langStrings } from './translations.js';

(function() {
    // Find the 'lang' buttons
    const langEnBtn = document.getElementById('lang-en');
    const langFilBtn = document.getElementById('lang-fil');

    function setLanguage(lang) {
        if (typeof langStrings === 'undefined' || !langStrings[lang]) {
            console.error(`Translation for language "${lang}" not found.`);
            return;
        }
        document.documentElement.lang = lang;
        
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (!key) return;
            const translation = langStrings[lang][key];
            if (!translation) return;
            
            if (el.tagName === 'TITLE') {
                document.title = "KomuniKonek | " + translation;
            } else {
                el.textContent = translation;
            }
        });
        
        langEnBtn?.classList.toggle('active', lang === 'en');
        langFilBtn?.classList.toggle('active', lang === 'fil');
    }

    // Set default language
    setLanguage('en');

    // Add click listeners
    langEnBtn?.addEventListener('click', () => setLanguage('en'));
    langFilBtn?.addEventListener('click', () => setLanguage('fil'));
})();