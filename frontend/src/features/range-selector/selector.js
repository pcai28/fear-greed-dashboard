export function createRangeSelector({ element, onChange }) {
  let changeId = 0;

  function setActive(button) {
    element.querySelectorAll("button").forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  const initial = element.querySelector("button.active") || element.querySelector("button");
  if (initial) setActive(initial);

  element.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-range]");
    if (!button) return;

    const previous = element.querySelector("button.active");
    const id = ++changeId;
    setActive(button);
    element.setAttribute("aria-busy", "true");
    let succeeded = false;
    try {
      succeeded = await onChange(button.dataset.range);
    } catch {
      succeeded = false;
    }
    if (id !== changeId) return;
    if (succeeded === false && previous) setActive(previous);
    element.removeAttribute("aria-busy");
  });
}
