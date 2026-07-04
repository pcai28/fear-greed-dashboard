# Project Architecture

This repository is an npm workspace with independently owned frontend and backend packages.

## Runtime flow

```text
Browser -> Vite/Express -> Route -> Service -> Model, Store, or Provider
```

- Routes translate HTTP input and output. They contain no persistence or market-data logic.
- Services own application workflows such as cache refresh, stale fallback, and signup rules.
- Models define Mongoose schemas and MongoDB operations.
- Stores isolate Redis and in-memory cache or rate-limit state.
- Providers isolate third-party market-data APIs.
- Domain modules contain pure market-status and time-series logic.

The frontend controller owns dashboard state and refresh timing. Features render gauges, charts,
theme state, range controls, and forms without making cross-feature calls.

## Development

- `npm run dev` starts Express on port 5174 and Vite on port 5173.
- Vite proxies `/api` requests to Express.
- `npm run build` creates the production frontend in `frontend/dist`.
- `npm start` runs Express; in production it also serves `frontend/dist`.

## Dependency rules

- Routes may depend on services, never directly on models, stores, or providers.
- Services may depend on models, stores, providers, and domain modules.
- Domain modules must remain side-effect free.
- Frontend API modules are the only modules that call `fetch`.
- Dashboard state belongs to `dashboard/controller.js`.

Business source files under `backend/src` and `frontend/src` should stay at or below 200 lines.
Run `npm run check:structure` to enforce this boundary.
