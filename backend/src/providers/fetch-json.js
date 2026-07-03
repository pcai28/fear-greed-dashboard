export async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 market-emotions-dashboard"
    }
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}
