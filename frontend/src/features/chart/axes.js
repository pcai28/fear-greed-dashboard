import { formatDate, formatNumber } from "../../shared/formatters.js";
import { xFor } from "./geometry.js";

export function drawAxes(context, rect, plot, fearRange, vixRange, colors) {
  context.font = "12px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";

  for (let index = 0; index <= 5; index += 1) {
    const ratio = index / 5;
    const y = plot.bottom - ratio * plot.height;
    const fear = fearRange.min + ratio * (fearRange.max - fearRange.min);
    const vix = vixRange.min + ratio * (vixRange.max - vixRange.min);

    context.strokeStyle = colors.grid;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(plot.left, y);
    context.lineTo(plot.right, y);
    context.stroke();

    context.fillStyle = colors.fear;
    context.textAlign = "left";
    context.fillText(formatNumber(fear, 0), 12, y);
    context.fillStyle = colors.vix;
    context.textAlign = "right";
    context.fillText(formatNumber(vix, 0), rect.width - 12, y);
  }
}

export function drawXLabels(context, points, plot, rect, range, color) {
  if (!points.length) return;
  const labelCount = rect.width < 720 ? 4 : 6;
  context.fillStyle = color;
  context.font = "12px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "top";

  for (let index = 0; index < labelCount; index += 1) {
    const pointIndex = Math.round((index / Math.max(labelCount - 1, 1)) * (points.length - 1));
    context.fillText(
      formatDate(points[pointIndex].date, range),
      xFor(pointIndex, points.length, plot),
      plot.bottom + 16
    );
  }
}
