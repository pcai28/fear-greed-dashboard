import { yFor } from "./geometry.js";

export function drawFearMarkers(context, plot, fearRange, color) {
  const markers = [
    { value: 75, label: "Extreme Greed", direction: "up" },
    { value: 25, label: "Extreme Fear", direction: "down" }
  ];

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.25;
  context.font = "11px Inter, system-ui, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";

  for (const marker of markers) {
    const x = plot.left + 10;
    const y = yFor(marker.value, plot, fearRange);
    const wingY = marker.direction === "up" ? y + 7 : y - 7;
    context.beginPath();
    context.moveTo(x - 8, wingY);
    context.lineTo(x, y);
    context.lineTo(x + 8, wingY);
    context.stroke();
    context.fillText(marker.label, x + 16, y);
  }
  context.restore();
}

export function drawVixMarker(context, plot, vixRange, color) {
  const y = yFor(30, plot, vixRange);
  const x = plot.right - 10;

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.25;
  context.font = "11px Inter, system-ui, sans-serif";
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.beginPath();
  context.moveTo(x - 8, y + 7);
  context.lineTo(x, y);
  context.lineTo(x + 8, y + 7);
  context.stroke();
  context.fillText("Significant Fear", x - 16, y);
  context.restore();
}
