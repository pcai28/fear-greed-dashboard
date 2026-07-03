const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(value) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function nearestDailyFearGreed(fearPoints, targetDate) {
  const target = startOfUtcDay(targetDate);
  let best = null;
  let bestDistance = Infinity;

  for (const point of fearPoints) {
    const distance = Math.abs(startOfUtcDay(point.date) - target);
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }

  return bestDistance <= 3 * DAY_MS ? best : null;
}

export function alignSeries(vixPoints, fearPoints, range) {
  if (range === "1D" || range === "5D") {
    return vixPoints.map((vix) => ({
      date: vix.date,
      vix: vix.value,
      fearGreed: nearestDailyFearGreed(fearPoints, vix.date)?.value ?? null
    }));
  }

  const fearByDay = new Map(
    fearPoints.map((point) => [new Date(point.date).toISOString().slice(0, 10), point.value])
  );

  return vixPoints.map((vix) => {
    const key = new Date(vix.date).toISOString().slice(0, 10);
    return {
      date: vix.date,
      vix: vix.value,
      fearGreed: fearByDay.get(key) ?? nearestDailyFearGreed(fearPoints, vix.date)?.value ?? null
    };
  });
}
