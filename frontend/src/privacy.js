import "./styles/fonts.css";
import "./styles/index.css";
import "./styles/privacy.css";
import { privacyConfig } from "./config/privacy.js";

for (const element of document.querySelectorAll("[data-privacy-email]")) {
  if (!privacyConfig.contactEmail) continue;
  const link = document.createElement("a");
  link.href = `mailto:${privacyConfig.contactEmail}`;
  link.textContent = privacyConfig.contactEmail;
  element.replaceChildren(link);
}

for (const element of document.querySelectorAll("[data-privacy-controller]")) {
  if (privacyConfig.controllerName) element.textContent = privacyConfig.controllerName;
}
