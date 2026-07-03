export function createRepeatableAnchor({ link, target }) {
  function navigate(event) {
    event.preventDefault();

    const hash = link.hash || link.getAttribute("href");
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  return {
    init() {
      link.addEventListener("click", navigate);
    }
  };
}
