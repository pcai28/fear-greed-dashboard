import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const includePattern = /<!--\s*@include:([^\s]+)\s*-->/g;

function htmlPartials() {
  return {
    name: "html-partials",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] === "/privacy") request.url = "/privacy.html";
        if (request.url?.split("?")[0] === "/terms") request.url = "/terms.html";
        next();
      });
    },
    transformIndexHtml(html) {
      return html.replace(includePattern, (_, path) =>
        readFileSync(resolve(import.meta.dirname, "src", path), "utf8")
      );
    }
  };
}

export default defineConfig({
  plugins: [htmlPartials()],
  envDir: resolve(import.meta.dirname, ".."),
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        privacy: resolve(import.meta.dirname, "privacy.html"),
        terms: resolve(import.meta.dirname, "terms.html")
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:5174"
    }
  }
});
