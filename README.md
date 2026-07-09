# Fear Greed Market

## 1. What it is

Fear Greed Market is a market sentiment dashboard that combines CNN Fear & Greed data and VIX market data in one clear interface.

Users can view the latest Fear & Greed and VIX readings, compare historical trends across different time ranges, and quickly understand whether the market is showing fear, greed, calm, or uncertainty.

## 2. Why I built it

First, I wanted to learn how to use Codex to assist real software development: planning features, refactoring code, debugging, improving frontend UX, writing tests.

Second, I wanted to create a tool that I personally want to check every day. I follow market sentiment regularly, but I wanted a simple dashboard that brings the key signals together without needing to open multiple financial websites.

## 3. Tech stack

- Frontend: Vite, vanilla JavaScript, HTML, CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose for waitlist signups
- Cache and rate limiting: Upstash Redis with in-memory fallback
- External data providers: Yahoo Finance chart API for VIX and CNN Fear & Greed graph data
- Security: Helmet security headers, API rate limiting, Cloudflare Turnstile for waitlist protection
- Testing: Vitest, Supertest
- Deployment: Railway-ready configuration

## 4. Features

- Latest CNN Fear & Greed and VIX gauges
- Historical dual-axis chart
- Time ranges: 1D, 5D, 1M, 6M, YTD, 1Y, 5Y
- Auto-refresh about every 10 minutes
- Loading, error, retry, and stale-data states
- Light, dark, and system theme modes
- Share/export PNG snapshots for gauges and charts
- Accessible chart keyboard navigation
- Waitlist signup for future SMS alerts
- Privacy and terms pages

## 5. Challenge / learning

The biggest learning was understanding how production-style data flow works across a full-stack app:

```text
Browser -> Frontend API module -> Express route -> Service -> Cache / Provider / Database
```

I learned how to keep responsibilities separated: routes handle HTTP, services handle workflows, providers isolate third-party APIs, stores handle cache/rate-limit state, and frontend feature modules stay focused on UI behavior.

Another important challenge was data reliability. External market data can be delayed, unavailable, or change shape, so the app includes validation, caching, stale fallback, retry states, and clear user-facing messages instead of assuming every request will succeed.

I also learned how to protect a public signup endpoint. For `/api/waitlist`, the app uses three layers:

- Rate limit: 3 requests per minute to control request frequency
- CAPTCHA: Cloudflare Turnstile to help distinguish humans from bots
- Backend email validation: server-side format checks to improve data quality

## Local development

Install dependencies:

```bash
npm install
```

Run frontend and backend together:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

## Project structure

```text
frontend/   Vite frontend, dashboard UI, chart, gauges, share, waitlist form
backend/    Express API, services, providers, cache, rate limiting, MongoDB models
shared/     Shared market sentiment band logic
docs/       Architecture, deployment, privacy, and data reliability notes
```
