export function roundedRange(values, fallbackMax) {
  const clean = values.filter((value) => value != null && Number.isFinite(value));
  if (!clean.length) return { min: 0, max: fallbackMax };

  let min = Math.min(...clean);
  let max = Math.max(...clean);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.12;
  min = Math.max(0, min - pad);
  max += pad;
  const step = max > 60 ? 10 : 5;
  return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step };
}

export function createPlot(rect) {
  const plot = { left: 54, right: rect.width - 54, top: 24, bottom: rect.height - 54 };
  plot.width = plot.right - plot.left;
  plot.height = plot.bottom - plot.top;
  return plot;
}

export function yFor(value, plot, range) {
  return plot.bottom - ((value - range.min) / Math.max(range.max - range.min, 1)) * plot.height;
}

export function xFor(index, count, plot) {
  return plot.left + (index / Math.max(count - 1, 1)) * plot.width;
}

export function resizeCanvas(canvas, context) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return rect;
}
