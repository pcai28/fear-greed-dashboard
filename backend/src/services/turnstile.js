const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function verificationError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  return error;
}

export function createTurnstileVerifier({
  secret,
  expectedHostname,
  expectedAction = "waitlist",
  fetchImpl = fetch,
  timeoutMs = 5_000
}) {
  return {
    async verify(token) {
      if (typeof token !== "string" || !token.trim() || token.length > 2_048) {
        throw verificationError("Complete the security check before joining the waitlist.");
      }

      let response;
      try {
        response = await fetchImpl(siteverifyUrl, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ secret, response: token.trim() }),
          signal: AbortSignal.timeout(timeoutMs)
        });
      } catch {
        throw verificationError("The security check is unavailable. Please try again.", 503);
      }

      if (!response.ok) {
        throw verificationError("The security check is unavailable. Please try again.", 503);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw verificationError("The security check is unavailable. Please try again.", 503);
      }

      if (
        result.success !== true ||
        result.hostname !== expectedHostname ||
        result.action !== expectedAction
      ) {
        throw verificationError("The security check expired or failed. Please try again.");
      }
      return true;
    }
  };
}
