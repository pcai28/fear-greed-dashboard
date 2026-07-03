import { xFor, yFor } from "./geometry.js";

function traceSeries(context, points, plot, range, key) {
  context.beginPath();
  let moved = false;

  points.forEach((point, index) => {
    const value = point[key];
    if (value == null) {
      moved = false;
      return;
    }
    const x = xFor(index, points.length, plot);
    const y = yFor(value, plot, range);
    if (moved) context.lineTo(x, y);
    else context.moveTo(x, y);
    moved = true;
  });
}

export function drawLine(context, points, plot, range, key, color) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  context.lineJoin = "round";
  context.lineCap = "round";
  traceSeries(context, points, plot, range, key);
  context.stroke();
  context.restore();
}

export function drawHover(context, points, hoverIndex, plot, ranges, colors) {
  if (hoverIndex == null || !points[hoverIndex]) return;
  const point = points[hoverIndex];
  const x = xFor(hoverIndex, points.length, plot);
  context.strokeStyle = colors.crosshair;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, plot.top);
  context.lineTo(x, plot.bottom);
  context.stroke();

  const dots = [
    { value: point.fearGreed, range: ranges.fear, color: colors.fear },
    { value: point.vix, range: ranges.vix, color: colors.vix }
  ];
  for (const dot of dots) {
    if (dot.value == null) continue;
    context.fillStyle = "#ffffff";
    context.strokeStyle = dot.color;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(x, yFor(dot.value, plot, dot.range), 5, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
}
