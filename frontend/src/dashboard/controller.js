import { formatDate, formatNumber } from "../shared/formatters.js";

export function createDashboardController({ elements, fetchData, chart, fearGauge, vixGauge }) {
  let activeRange = "1Y";
  let reloadTimer;
  let requestController;
  let requestId = 0;
  let hasData = false;

  function setChartMessage(text = "", { retry = false } = {}) {
    elements.chartMessageText.textContent = text;
    elements.chartRetry.hidden = !retry;
    elements.chartMessage.hidden = !text && !retry;
  }

  function setDataAlert(text = "", { retry = false } = {}) {
    elements.dataAlertText.textContent = text;
    elements.dataRetry.hidden = !retry;
    elements.dataAlert.hidden = !text && !retry;
  }

  function updateCards(data) {
    const fear = data.latest.fearGreed;
    const vix = data.latest.vix;
    elements.fearValue.textContent = formatNumber(fear.value, 0);
    elements.fearStatus.textContent = fear.status || "Unavailable";
    elements.fearTime.textContent = `Latest: ${formatDate(fear.date, "1D")}`;
    fearGauge.update(fear.value);
    elements.fearGauge.setAttribute(
      "aria-label",
      `CNN Fear and Greed Index is ${formatNumber(fear.value, 0)}, status ${fear.status || "Unavailable"}.`
    );

    elements.vixValue.textContent = formatNumber(vix.value, 2);
    elements.vixStatus.textContent = vix.status || "Unavailable";
    elements.vixTime.textContent = `Latest: ${formatDate(vix.date, "1D")}`;
    vixGauge.update(vix.value);
    elements.vixGauge.setAttribute(
      "aria-label",
      `VIX is ${formatNumber(vix.value, 2)}, status ${vix.status || "Unavailable"}.`
    );
    elements.chartSummary.textContent =
      `The ${data.range} chart compares Fear and Greed at ${formatNumber(fear.value, 0)}` +
      ` and VIX at ${formatNumber(vix.value, 2)}. Fear and Greed uses the left axis; ` +
      "VIX uses the right axis.";
    hasData = true;

    if (data.isStale) {
      const staleTime = data.lastSuccessfulUpdate || data.updatedAt;
      elements.updatedAt.textContent = `Stale data from ${formatDate(staleTime, "1D")}`;
      setDataAlert("Live data is temporarily unavailable. Showing the last successful update.");
    } else {
      elements.updatedAt.textContent = `Updated ${formatDate(data.updatedAt, "1D")}`;
      setDataAlert();
    }
  }

  function showUnavailable(error) {
    const message = error?.timedOut
      ? "Market data took too long to respond."
      : "Market data could not be loaded.";
    setChartMessage(`${message} Check your connection and try again.`, { retry: true });
    if (hasData) {
      setChartMessage();
      elements.updatedAt.textContent = "Unable to refresh";
      setDataAlert("The latest refresh failed. Showing the last successful update.", {
        retry: true
      });
      return;
    }
    elements.updatedAt.textContent = "Unable to update";
    elements.fearValue.textContent = "--";
    elements.fearStatus.textContent = "Temporarily unavailable";
    elements.fearTime.textContent = "Latest: --";
    elements.vixValue.textContent = "--";
    elements.vixStatus.textContent = "Temporarily unavailable";
    elements.vixTime.textContent = "Latest: --";
    elements.fearGauge.setAttribute(
      "aria-label",
      "CNN Fear and Greed Index is temporarily unavailable."
    );
    elements.vixGauge.setAttribute("aria-label", "VIX is temporarily unavailable.");
    elements.chartSummary.textContent =
      "The chart is temporarily unavailable because live data could not be loaded.";
    setDataAlert("Live data is temporarily unavailable and no cached data is ready yet.");
  }

  async function load(range = activeRange) {
    const id = ++requestId;
    requestController?.abort();
    const controller = new AbortController();
    requestController = controller;
    const timeout = setTimeout(() => controller.abort(), 15_000);
    if (hasData) {
      setChartMessage();
      elements.updatedAt.textContent = "Refreshing...";
    } else {
      setChartMessage(`Loading ${range} chart...`);
    }
    elements.tooltip.hidden = true;
    try {
      const data = await fetchData(range, { signal: controller.signal });
      if (id !== requestId) return null;
      activeRange = range;
      updateCards(data);
      setChartMessage(data.points.length ? "" : "No historical points are available for this range.");
      chart.setData(data);
      return true;
    } catch (error) {
      if (id !== requestId) return null;
      showUnavailable(controller.signal.aborted ? { timedOut: true } : error);
      return false;
    } finally {
      clearTimeout(timeout);
      if (id !== requestId) return;
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => load(activeRange), 10 * 60 * 1000);
    }
  }

  elements.chartRetry.addEventListener("click", () => load(activeRange));
  elements.dataRetry.addEventListener("click", () => load(activeRange));

  return { start: () => load(), selectRange: load };
}
