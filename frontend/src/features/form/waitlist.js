function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `waitlist-message${type ? ` ${type}` : ""}`;
}

export function createWaitlistForm({
  form,
  emailInput,
  consentInput,
  message,
  submitEmail,
  challenge,
  enabled = false
}) {
  if (!form) return { init() {} };

  return {
    async init() {
      const submitButton = form.querySelector("button[type='submit']");
      if (!enabled) {
        emailInput.disabled = true;
        consentInput.disabled = true;
        submitButton.disabled = true;
        setMessage(message, "Waitlist signups will open after the privacy launch checklist is complete.");
        return;
      }

      emailInput.disabled = false;
      consentInput.disabled = false;
      submitButton.disabled = true;
      setMessage(message, "Loading security check...");
      try {
        await challenge.init();
        submitButton.disabled = false;
        if (!message.classList.contains("error")) setMessage(message, "");
      } catch (error) {
        setMessage(message, `${error.message} Refresh the page to retry.`, "error");
        return;
      }
      emailInput.addEventListener("input", () => {
        emailInput.setAttribute("aria-invalid", "false");
        if (message.classList.contains("error")) setMessage(message, "");
      });
      consentInput.addEventListener("change", () => {
        consentInput.setAttribute("aria-invalid", "false");
        if (message.classList.contains("error")) setMessage(message, "");
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (form.dataset.submitting === "true") return;
        const email = emailInput.value.trim();
        if (!emailInput.checkValidity() || email.length > 254) {
          emailInput.setAttribute("aria-invalid", "true");
          setMessage(message, "Enter a valid email address with 254 characters or fewer.", "error");
          emailInput.focus();
          return;
        }
        if (!consentInput.checked) {
          consentInput.setAttribute("aria-invalid", "true");
          setMessage(message, "Agree to the one-time launch notification before joining.", "error");
          consentInput.focus();
          return;
        }
        const turnstileToken = challenge.getToken();
        if (!turnstileToken) {
          setMessage(message, "Complete the security check, then try again.", "error");
          challenge.focus();
          return;
        }

        const originalLabel = submitButton.textContent;
        form.dataset.submitting = "true";
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
        submitButton.textContent = "Saving...";
        setMessage(message, "Saving your email...");
        try {
          const result = await submitEmail(email, true, turnstileToken);
          form.reset();
          challenge.reset();
          setMessage(
            message,
            result.message || "Thanks — I’ll let you know when SMS alerts are available.",
            "success"
          );
        } catch (error) {
          challenge.reset();
          const fallback =
            error.status === 429
              ? "Too many attempts. Wait a moment and try again."
              : "Unable to save your email right now. Please try again.";
          setMessage(message, error.message || fallback, "error");
        } finally {
          delete form.dataset.submitting;
          submitButton.disabled = false;
          submitButton.removeAttribute("aria-busy");
          submitButton.textContent = originalLabel;
        }
      });
    }
  };
}
