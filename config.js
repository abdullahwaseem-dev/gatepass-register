// ============================================================================
// CONFIGURATION — fill these in to go live. Until you do, the app runs in
// DEMO MODE automatically (local storage instead of Firestore, no real
// emails sent) so the registration + QR flow never breaks during a demo.
// ============================================================================

// --- 1. FIREBASE ------------------------------------------------------------
// Get this from: Firebase Console → Project Settings → General → Your apps → Web app
// (Create a project first at https://console.firebase.google.com — takes ~2 min,
// no billing/credit card needed, the free "Spark" plan covers everything here.)
// Then in Firestore Database, click "Create database" and start in test mode
// (lock it down later with the rules in firestore.rules).
window.APP_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCWFgK8qhH9rtkZ5LBzEr4M0qd07poC64E",
    authDomain: "charity-event-reg-2026.firebaseapp.com",
    projectId: "charity-event-reg-2026",
    storageBucket: "charity-event-reg-2026.firebasestorage.app",
    messagingSenderId: "190779733594",
    appId: "1:190779733594:web:d510237f8e9ded7f9c4a63",
  },

  // --- 2. EMAILJS -----------------------------------------------------------
  // EmailJS sends the confirmation email straight from the browser — no backend,
  // no Firebase billing plan required. Sign up free at https://www.emailjs.com
  //   1. Add an Email Service (connect your Gmail/Outlook) → copy the Service ID
  //   2. Create an Email Template with variables: {{name}} {{email}} {{phone}}
  //      {{company}} {{category}} {{reg_id}} {{qr_image}} → copy the Template ID
  //   3. Account → General → copy your Public Key
  emailjs: {
    publicKey: "REPLACE_ME",
    serviceId: "REPLACE_ME",
    templateId: "REPLACE_ME",
  },

  // Organization display info — swap in real branding when it arrives.
  // Bilingual: the site auto-picks the string matching the visitor's chosen
  // language (see i18n.js / orgName() / eventNameText() in app.js).
  org: {
    name: { en: "ATC Gate Access System", ar: "نظام ATC للتحكم في دخول البوابات" },
    eventName: { en: "Event Registration", ar: "التسجيل في الفعالية" },
  },
};

// Current-language accessors — org.name/eventName are {en, ar} objects, not
// plain strings, precisely so a name change only has to happen once here
// rather than in every place that reads it.
window.APP_CONFIG.orgName = () => window.APP_CONFIG.org.name[window.currentLang] || window.APP_CONFIG.org.name.en;
window.APP_CONFIG.eventNameText = () => window.APP_CONFIG.org.eventName[window.currentLang] || window.APP_CONFIG.org.eventName.en;

// True once every placeholder above has been replaced with a real value.
window.APP_CONFIG.isLive =
  window.APP_CONFIG.firebase.apiKey !== "REPLACE_ME" &&
  window.APP_CONFIG.firebase.projectId !== "REPLACE_ME";

window.APP_CONFIG.emailIsLive =
  window.APP_CONFIG.emailjs.publicKey !== "REPLACE_ME" &&
  window.APP_CONFIG.emailjs.serviceId !== "REPLACE_ME" &&
  window.APP_CONFIG.emailjs.templateId !== "REPLACE_ME";
