const scriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise;

function loadTurnstile() {
  if (globalThis.turnstile) return Promise.resolve(globalThis.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    const script = existing || document.createElement("script");
    const onLoad = () =>
      globalThis.turnstile
        ? resolve(globalThis.turnstile)
        : reject(new Error("Turnstile did not initialize."));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load.")), {
      once: true
    });
    if (!existing) {
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }
  });
  return scriptPromise;
}

export function createTurnstileChallenge({ container, siteKey, onState = () => {} }) {
  let api;
  let widgetId;
  let token = "";

  return {
    async init() {
      onState("loading");
      try {
        api = await loadTurnstile();
        widgetId = api.render(container, {
          sitekey: siteKey,
          action: "waitlist",
          theme: "auto",
          appearance: "interaction-only",
          "response-field": false,
          retry: "auto",
          "retry-interval": 8_000,
          "refresh-expired": "auto",
          callback(value) {
            token = value;
            onState("ready");
          },
          "expired-callback"() {
            token = "";
            onState("expired");
          },
          "error-callback"() {
            token = "";
            onState("error");
          }
        });
        onState("ready");
      } catch {
        onState("error");
        throw new Error("The security check could not load.");
      }
    },
    getToken() {
      return token;
    },
    reset() {
      token = "";
      if (api && widgetId !== undefined) api.reset(widgetId);
      onState("ready");
    },
    focus() {
      container?.querySelector("iframe")?.focus();
    }
  };
}
