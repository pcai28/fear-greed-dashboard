import { drawAxes, drawXLabels } from "./axes.js";
import { createPlot, resizeCanvas, roundedRange } from "./geometry.js";
import { drawFearMarkers, drawVixMarker } from "./markers.js";
import { drawHover, drawLine } from "./series.js";
import { describePoint, showTooltipAtIndex, updateTooltip } from "./tooltip.js";

export function nextPointIndex(key, currentIndex, pointCount) {
  if (!pointCount) return null;
  const current = currentIndex == null ? pointCount - 1 : currentIndex;
  if (key === "Home") return 0;
  if (key === "End") return pointCount - 1;
  if (key === "ArrowLeft") return Math.max(0, current - 1);
  if (key === "ArrowRight") return Math.min(pointCount - 1, current + 1);
  return null;
}

export function createChart({ canvas, tooltip, announcement }) {
  const context = canvas.getContext("2d");
  const colors = {};
  let data = null;
  let hoverIndex = null;
  let pointerFrame = null;
  let pendingPointerEvent = null;

  function refreshColors() {
    const styles = getComputedStyle(document.documentElement);
    colors.ink = styles.getPropertyValue("--ink").trim();
    colors.muted = styles.getPropertyValue("--muted").trim();
    colors.grid = styles.getPropertyValue("--line").trim();
    colors.vix = styles.getPropertyValue("--vix").trim();
    colors.fear = styles.getPropertyValue("--fear").trim();
    colors.crosshair =
      document.documentElement.dataset.theme === "dark"
        ? "rgba(238,242,241,0.28)"
        : "rgba(24,32,38,0.28)";
  }

  function render() {
    const rect = resizeCanvas(canvas, context);
    context.clearRect(0, 0, rect.width, rect.height);
    if (!data?.points?.length) return;

    const plot = createPlot(rect);
    const points = data.points;
    const ranges = {
      fear: { min: 0, max: 100 },
      vix: roundedRange(points.map((point) => point.vix), 40)
    };

    drawAxes(context, rect, plot, ranges.fear, ranges.vix, colors);
    drawFearMarkers(context, plot, ranges.fear, colors.fear);
    drawVixMarker(context, plot, ranges.vix, colors.vix);
    drawLine(context, points, plot, ranges.fear, "fearGreed", colors.fear);
    drawLine(context, points, plot, ranges.vix, "vix", colors.vix);
    drawXLabels(context, points, plot, rect, data.range, colors.muted);
    drawHover(context, points, hoverIndex, plot, ranges, colors);
  }

  function showPoint(index, { announce = false, top = 96 } = {}) {
    if (index == null || !data?.points?.[index]) return;
    const rect = canvas.getBoundingClientRect();
    hoverIndex = showTooltipAtIndex({
      index,
      canvas,
      tooltip,
      points: data.points,
      plot: createPlot(rect),
      range: data.range,
      top
    });
    if (announce && announcement) {
      announcement.textContent = describePoint(data.points[index], data.range);
    }
    render();
  }

  function handlePointer(event) {
    if (!data?.points?.length) return;
    const rect = canvas.getBoundingClientRect();
    hoverIndex = updateTooltip({
      event,
      canvas,
      tooltip,
      points: data.points,
      plot: createPlot(rect),
      range: data.range
    });
    render();
  }

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    pendingPointerEvent = event;
    if (pointerFrame != null) return;
    pointerFrame = requestAnimationFrame(() => {
      handlePointer(pendingPointerEvent);
      pointerFrame = null;
    });
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (!data?.points?.length) return;
    const rect = canvas.getBoundingClientRect();
    const index = updateTooltip({
      event,
      canvas,
      tooltip,
      points: data.points,
      plot: createPlot(rect),
      range: data.range
    });
    showPoint(index, { announce: true, top: event.clientY - rect.top });
  });
  canvas.addEventListener("pointerleave", () => {
    if (pointerFrame != null) cancelAnimationFrame(pointerFrame);
    pointerFrame = null;
    hoverIndex = null;
    tooltip.hidden = true;
    render();
  });
  canvas.addEventListener("focus", () => {
    if (data?.points?.length && hoverIndex == null) {
      showPoint(data.points.length - 1, { announce: true });
    }
  });
  canvas.addEventListener("keydown", (event) => {
    const index = nextPointIndex(event.key, hoverIndex, data?.points?.length || 0);
    if (index == null) return;
    event.preventDefault();
    showPoint(index, { announce: true });
  });
  canvas.addEventListener("blur", () => {
    hoverIndex = null;
    tooltip.hidden = true;
    render();
  });
  window.addEventListener("resize", render);

  refreshColors();
  return {
    setData(nextData) {
      data = nextData;
      hoverIndex = null;
      tooltip.hidden = true;
      render();
    },
    refreshTheme() {
      refreshColors();
      render();
    },
    render
  };
}
