import { describe, expect, it, vi } from "vitest";
import { createRangeSelector } from "../../src/features/range-selector/selector.js";

function createButton(range, active = false) {
  const classes = new Set(active ? ["active"] : []);
  return {
    dataset: { range },
    attributes: {},
    classList: {
      contains: (name) => classes.has(name),
      toggle: (name, force) => (force ? classes.add(name) : classes.delete(name))
    },
    closest: () => null,
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
}

function createElement(buttons) {
  const listeners = {};
  return {
    attributes: {},
    listeners,
    querySelectorAll: () => buttons,
    querySelector(selector) {
      if (selector === "button.active") {
        return buttons.find((button) => button.classList.contains("active")) || null;
      }
      return buttons[0] || null;
    },
    addEventListener(name, handler) {
      listeners[name] = handler;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    }
  };
}

describe("range selector", () => {
  it("exposes selection state and rolls back a failed change", async () => {
    const oneYear = createButton("1Y", true);
    const fiveYear = createButton("5Y");
    const element = createElement([oneYear, fiveYear]);
    const onChange = vi.fn().mockResolvedValue(false);
    createRangeSelector({ element, onChange });

    fiveYear.closest = () => fiveYear;
    await element.listeners.click({ target: fiveYear });

    expect(onChange).toHaveBeenCalledWith("5Y");
    expect(oneYear.attributes["aria-pressed"]).toBe("true");
    expect(fiveYear.attributes["aria-pressed"]).toBe("false");
    expect(element.attributes["aria-busy"]).toBeUndefined();
  });
});
