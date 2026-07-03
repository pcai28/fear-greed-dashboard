const contactEmail = String(import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || "").trim();
const controllerName = String(import.meta.env.VITE_PRIVACY_CONTROLLER_NAME || "").trim();
const validContactEmail =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) &&
  !/@example\.(com|invalid)$/i.test(contactEmail);
const validControllerName =
  controllerName.length >= 2 &&
  !/your name|operator|controller|example|tbd/i.test(controllerName);

export const privacyConfig = Object.freeze({
  contactEmail: validContactEmail ? contactEmail : "",
  controllerName: validControllerName ? controllerName : "",
  waitlistEnabled:
    import.meta.env.VITE_WAITLIST_ENABLED === "1" &&
    validContactEmail &&
    validControllerName
});
