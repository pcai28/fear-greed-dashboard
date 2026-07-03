export function createUpstashClient({ url, token, disabled = false }) {
  const enabled = Boolean(!disabled && url && token);

  return {
    enabled,
    async command(command) {
      if (!enabled) return null;

      const response = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(command)
      });

      if (!response.ok) {
        throw new Error(`Upstash Redis returned ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (json.error) throw new Error(`Upstash Redis error: ${json.error}`);
      return json.result;
    }
  };
}
