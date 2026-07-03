export function notFound(request, response) {
  if (request.path.startsWith("/api/")) {
    response.status(404).json({ error: "Not found." });
    return;
  }
  response.status(404).type("text/plain").send("Not found");
}
