import { Router } from "express";

export function createWaitlistRouter({ service, turnstile, enabled = false }) {
  const router = Router();

  router.post("/", async (request, response, next) => {
    try {
      if (!enabled) {
        const error = new Error("Waitlist collection is not enabled.");
        error.status = 503;
        error.publicMessage = "The waitlist is not accepting signups yet.";
        throw error;
      }
      await turnstile.verify(request.body?.turnstileToken);
      const result = await service.signup({
        email: request.body?.email,
        consent: request.body?.consent
      });
      response.status(200).json(result);
    } catch (error) {
      if (!error.status) {
        error.status = 503;
        error.publicMessage = "Unable to save your email right now.";
      }
      next(error);
    }
  });

  return router;
}
