// ============================================================================
// Bilingual (English / Arabic) support for the registration page.
// Static text is translated via data-i18n / data-i18n-placeholder attributes
// in index.html; dynamic text generated in app.js calls t('key') directly.
// ============================================================================

window.I18N = {
  en: {
    eventRegistration: "Event Registration",
    registerForEvent: "Register for the Event",
    registerSubtitle: "Fill in your details below to get your unique QR code. Scan it at the kiosk and your wristband prints automatically.",
    fullName: "Full Name",
    fullNamePh: "e.g. Ahmed Al-Saud",
    phoneNumber: "Phone Number",
    phonePh: "+966 5X XXX XXXX",
    companyOrganization: "Company / Organization",
    companyPh: "e.g. Alpha Holdings",
    emailAddress: "Email Address",
    emailPh: "name@example.com",
    category: "Category",
    vip: "VIP",
    visitors: "Visitors",
    sponsors: "Sponsors",
    completeRegistration: "Complete Registration",
    registering: "Registering…",
    youreRegistered: "You're Registered!",
    successSubtitle: "Your QR code is ready. Hold it under the scanner at the kiosk — your wristband prints automatically. Save it or check your email so you have it on hand.",
    name: "Name",
    company: "Company",
    email: "Email",
    phone: "Phone",
    id: "ID",
    savePng: "⬇ Save as PNG",
    savePdf: "⬇ Save as PDF",
    registerAnother: "Register another person",
    nameRequired: "Name is required.",
    phoneRequired: "Phone number is required.",
    phoneInvalid: "Enter a valid phone number.",
    emailRequired: "Email is required.",
    emailInvalid: "Enter a valid email address.",
    categoryRequired: "Please select a category.",
    sendingEmail: "Sending confirmation email…",
    emailSent: "✓ Confirmation email sent to",
    emailFailed: "Couldn't send the email automatically",
    saveQrNow: "please save your QR code now.",
    emailNotConfigured: "Email delivery not yet configured for this demo — save your QR code below.",
    demoModeBanner: "⚠ DEMO MODE — Firebase / Email not yet connected. Data is saved locally in this browser only. See README.md to go live.",
    footerDemo: "Demo mode — registrations are stored locally in this browser only",
    footerLive: "Connected — Firebase project",
    footerEmailLive: "Email live",
    footerEmailOff: "Email not configured",
    registrationFailed: "Something went wrong saving your registration. Please try again.",
  },
  ar: {
    eventRegistration: "التسجيل في الفعالية",
    registerForEvent: "التسجيل في الفعالية",
    registerSubtitle: "املأ بياناتك أدناه للحصول على رمز QR الخاص بك. امسحه عند الكشك وسيُطبع سوارك تلقائيًا.",
    fullName: "الاسم الكامل",
    fullNamePh: "مثال: أحمد آل سعود",
    phoneNumber: "رقم الهاتف",
    phonePh: "+966 5X XXX XXXX",
    companyOrganization: "الشركة / الجهة",
    companyPh: "مثال: شركة ألفا القابضة",
    emailAddress: "البريد الإلكتروني",
    emailPh: "name@example.com",
    category: "الفئة",
    vip: "ضيف مميز",
    visitors: "زوار",
    sponsors: "رعاة",
    completeRegistration: "إتمام التسجيل",
    registering: "جارٍ التسجيل…",
    youreRegistered: "تم تسجيلك بنجاح!",
    successSubtitle: "رمز QR الخاص بك جاهز. ضعه أمام الماسح عند الكشك — سيُطبع سوارك تلقائيًا. احفظه أو تحقق من بريدك الإلكتروني ليكون معك.",
    name: "الاسم",
    company: "الشركة",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    id: "المعرّف",
    savePng: "⬇ حفظ كـ PNG",
    savePdf: "⬇ حفظ كـ PDF",
    registerAnother: "تسجيل شخص آخر",
    nameRequired: "الاسم مطلوب.",
    phoneRequired: "رقم الهاتف مطلوب.",
    phoneInvalid: "أدخل رقم هاتف صحيحًا.",
    emailRequired: "البريد الإلكتروني مطلوب.",
    emailInvalid: "أدخل بريدًا إلكترونيًا صحيحًا.",
    categoryRequired: "يرجى اختيار الفئة.",
    sendingEmail: "جارٍ إرسال رسالة التأكيد…",
    emailSent: "✓ تم إرسال رسالة التأكيد إلى",
    emailFailed: "تعذر إرسال البريد الإلكتروني تلقائيًا",
    saveQrNow: "يرجى حفظ رمز QR الآن.",
    emailNotConfigured: "لم يتم إعداد إرسال البريد الإلكتروني بعد لهذا العرض التجريبي — احفظ رمز QR أدناه.",
    demoModeBanner: "⚠ وضع تجريبي — لم يتم ربط Firebase / البريد الإلكتروني بعد. تُحفظ البيانات محليًا في هذا المتصفح فقط.",
    footerDemo: "وضع تجريبي — يتم حفظ التسجيلات محليًا في هذا المتصفح فقط",
    footerLive: "متصل — مشروع Firebase",
    footerEmailLive: "البريد الإلكتروني مفعّل",
    footerEmailOff: "البريد الإلكتروني غير مُعد",
    registrationFailed: "حدث خطأ أثناء حفظ التسجيل. يرجى المحاولة مرة أخرى.",
  },
};

window.currentLang = localStorage.getItem("lang") === "ar" ? "ar" : "en";

function t(key) {
  return (window.I18N[window.currentLang] && window.I18N[window.currentLang][key]) || key;
}

function applyStaticTranslations() {
  document.documentElement.lang = window.currentLang;
  document.documentElement.dir = window.currentLang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("lang-ar", window.currentLang === "ar");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });

  const toggle = document.getElementById("langToggle");
  if (toggle) toggle.textContent = window.currentLang === "en" ? "العربية" : "English";
}

function setLang(lang) {
  window.currentLang = lang;
  localStorage.setItem("lang", lang);
  applyStaticTranslations();
  document.dispatchEvent(new CustomEvent("langchange"));
}

document.addEventListener("DOMContentLoaded", () => {
  applyStaticTranslations();
  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.addEventListener("click", () => setLang(window.currentLang === "en" ? "ar" : "en"));
  }
});
