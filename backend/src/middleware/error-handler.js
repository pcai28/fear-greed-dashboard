export function createErrorHandler({ isProduction, logger = console }) {
  return function errorHandler(error, request, response, next) {
    if (response.headersSent) return next(error);

    const status = Number(error.status) || (error.type === "entity.parse.failed" ? 400 : 502);
    const defaultMessage =
      status === 400 ? "Request body must be valid JSON." : "Unable to load market emotion data.";
    if (status >= 500) {
      logger.error("Request failed", {
        status,
        method: request.method,
        path: request.path,
        type: error.name || "Error"
      });
    }

    const body = { error: error.publicMessage || defaultMessage };
    if (!isProduction) body.detail = error.message;
    response.status(status).json(body);
  };
}
