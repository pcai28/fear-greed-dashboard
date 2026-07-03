import { formatDate, formatNumber } from "../../shared/formatters.js";
import { xFor } from "./geometry.js";

export function describePoint(point, range) {
  return `${formatDate(point.date, range)}. Fear and Greed ${formatNumber(point.fearGreed, 1)}. VIX ${formatNumber(point.vix, 2)}.`;
}

export function indexForClientX(clientX, rect, plot, pointCount) {
  const mouseX = clientX - rect.left;
  if (mouseX < plot.left || mouseX > plot.right) {
    return null;
  }
  return Math.round(
    ((mouseX - plot.left) / Math.max(plot.width, 1)) * (pointCount - 1)
  );
}

function appendValueRow(tooltip, label, value) {
  const row = document.createElement("span");
  const name = document.createElement("b");
  const reading = document.createElement("b");
  name.textContent = label;
  reading.textContent = value;
  row.append(name, reading);
  tooltip.append(row);
}

export function showTooltipAtIndex({ index, canvas, tooltip, points, plot, range, top = 96 }) {
  const rect = canvas.getBoundingClientRect();
  const point = points[index];
  if (!point) return null;
  const tooltipX = xFor(index, points.length, plot);

  const date = document.createElement("strong");
  date.textContent = formatDate(point.date, range);
  tooltip.replaceChildren(date);
  appendValueRow(tooltip, "Fear & Greed", formatNumber(point.fearGreed, 1));
  appendValueRow(tooltip, "VIX", formatNumber(point.vix, 2));
  tooltip.style.left = `${Math.min(Math.max(tooltipX, 96), rect.width - 96)}px`;
  tooltip.style.top = `${Math.max(96, top)}px`;
  tooltip.hidden = false;
  return index;
}

export function updateTooltip({ event, canvas, tooltip, points, plot, range }) {
  const rect = canvas.getBoundingClientRect();
  const index = indexForClientX(event.clientX, rect, plot, points.length);
  if (index == null) {
    tooltip.hidden = true;
    return null;
  }
  return showTooltipAtIndex({
    index,
    canvas,
    tooltip,
    points,
    plot,
    range,
    top: event.clientY - rect.top
  });
}
