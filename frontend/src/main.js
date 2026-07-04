import "./styles/fonts.css";
import "./styles/index.css";
import { fetchMarketData } from "./api/market.js";
import { submitWaitlistEmail } from "./api/waitlist.js";
import { privacyConfig } from "./config/privacy.js";
import { createDashboardController } from "./dashboard/controller.js";
import { createChart } from "./features/chart/renderer.js";
import { createWaitlistForm } from "./features/form/waitlist.js";
import { createTurnstileChallenge } from "./features/form/turnstile.js";
import { createGauge } from "./features/gauges/renderer.js";
import { fearState, vixState } from "./features/gauges/status.js";
import { createRepeatableAnchor } from "./features/navigation/repeatable-anchor.js";
import { createRangeSelector } from "./features/range-selector/selector.js";
import { createShareController } from "./features/share/controller.js";
import { createThemeController } from "./features/theme/controller.js";
import { getDashboardElements } from "./shared/dom.js";

const elements = getDashboardElements();
const chart = createChart({
  canvas: elements.canvas,
  tooltip: elements.tooltip,
  announcement: elements.chartAnnouncement
});
const fearGauge = createGauge({
  element: elements.fearGauge,
  needle: elements.fearNeedle,
  min: 0,
  max: 100,
  getState: fearState
});
const vixGauge = createGauge({
  element: elements.vixGauge,
  needle: elements.vixNeedle,
  min: 0,
  max: 45,
  getState: vixState
});
const dashboard = createDashboardController({
  elements,
  fetchData: fetchMarketData,
  chart,
  fearGauge,
  vixGauge
});

createRangeSelector({ element: elements.rangeTabs, onChange: dashboard.selectRange });
createRepeatableAnchor({
  link: elements.alertsLink,
  target: elements.waitlistForm
}).init();
createThemeController({
  button: elements.themeToggle,
  onChange: chart.refreshTheme
}).init();
const waitlistChallenge = createTurnstileChallenge({
  container: elements.waitlistChallenge,
  siteKey: privacyConfig.turnstileSiteKey,
  onState(state) {
    if (state === "expired") {
      elements.waitlistMessage.textContent = "The security check expired. Complete it again.";
      elements.waitlistMessage.className = "waitlist-message error";
    } else if (state === "error") {
      elements.waitlistMessage.textContent = "The security check failed. Please retry.";
      elements.waitlistMessage.className = "waitlist-message error";
    }
  }
});
createWaitlistForm({
  form: elements.waitlistForm,
  emailInput: elements.waitlistEmail,
  consentInput: elements.waitlistConsent,
  message: elements.waitlistMessage,
  submitEmail: submitWaitlistEmail,
  challenge: waitlistChallenge,
  enabled: privacyConfig.waitlistEnabled
}).init();
createShareController({ elements, chart }).init();

dashboard.start();
