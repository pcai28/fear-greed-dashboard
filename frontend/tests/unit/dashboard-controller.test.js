import { afterEach, describe, expect, it, vi } from "vitest";
import { createDashboardController } from "../../src/dashboard/controller.js";

function node() {
  return {
    hidden: false,
    textContent: "",
    attributes: {},
    listeners: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(name, handler) {
      this.listeners[name] = handler;
    }
  };
}

function setup() {
  const elements = {
    updatedAt: node(),
    dataAlert: node(),
    dataAlertText: node(),
    dataRetry: node(),
    chartSummary: node(),
    chartMessage: node(),
    chartMessageText: node(),
    chartRetry: node(),
    tooltip: node(),
    fearValue: node(),
    fearStatus: node(),
    fearTime: node(),
    vixValue: node(),
    vixStatus: node(),
    vixTime: node(),
    fearGauge: node(),
    vixGauge: node()
  };
  return {
    elements,
    chart: { setData: vi.fn() },
    fearGauge: { update: vi.fn() },
    vixGauge: { update: vi.fn() }
  };
}

const response = {
  range: "1Y",
  updatedAt: "2026-06-30T12:00:00Z",
  isStale: false,
  latest: {
    fearGreed: { value: 31, status: "Fear", date: "2026-06-30T12:00:00Z" },
    vix: { value: 16.32, status: "Moderate", date: "2026-06-30T12:00:00Z" }
  },
  points: [{ date: "2026-06-30", fearGreed: 31, vix: 16.32 }]
};

afterEach(() => {
  vi.useRealTimers();
});

describe("dashboard controller", () => {
  it("preserves successful data when a later refresh fails", async () => {
    vi.useFakeTimers();
    const parts = setup();
    const fetchData = vi
      .fn()
      .mockResolvedValueOnce(response)
      .mockRejectedValueOnce(new Error("offline"));
    const controller = createDashboardController({ ...parts, fetchData });

    await controller.start();
    await controller.selectRange("1M");

    expect(parts.elements.fearValue.textContent).toBe("31");
    expect(parts.elements.updatedAt.textContent).toBe("Unable to refresh");
    expect(parts.elements.dataAlertText.textContent).toContain("last successful update");
    expect(parts.elements.dataRetry.hidden).toBe(false);
    expect(parts.elements.chartMessage.hidden).toBe(true);
    vi.clearAllTimers();
  });
});
