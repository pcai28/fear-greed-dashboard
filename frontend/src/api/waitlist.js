export async function submitWaitlistEmail(email, consent, turnstileToken) {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, consent, turnstileToken })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || response.statusText || "Unable to save your email.");
    error.status = response.status;
    throw error;
  }
  return result;
}
