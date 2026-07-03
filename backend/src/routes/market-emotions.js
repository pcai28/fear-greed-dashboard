import { Router } from "express";

export function createMarketEmotionsRouter({ service }) {
  const router = Router();

  router.get("/", async (request, response, next) => {
    try {
      const range = typeof request.query.range === "string" ? request.query.range : "1Y";
      const payload = await service.get(range);
      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
