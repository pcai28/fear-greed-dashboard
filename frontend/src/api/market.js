export async function fetchMarketData(range, { signal } = {}) {
  const response = await fetch(`/api/market-emotions?range=${encodeURIComponent(range)}`, { signal });
  const detail = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(detail.detail || response.statusText);
  if (!detail?.latest?.fearGreed || !detail?.latest?.vix || !Array.isArray(detail.points)) {
    throw new Error("The market data response was incomplete.");
  }
  return detail;
}
