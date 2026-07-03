const PLATFORM_URLS = {
  x: ({ pageUrl, text }) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`,
  threads: ({ pageUrl, text }) =>
    `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${pageUrl}`)}`,
  facebook: ({ pageUrl }) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
  reddit: ({ pageUrl, text }) =>
    `https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(text)}`
};

const PLATFORM_NAMES = {
  x: "X",
  threads: "Threads",
  facebook: "Facebook",
  reddit: "Reddit"
};

export function shareFilename(kind, date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const subject = kind === "gauges" ? "gauges" : "line-chart";
  return `market-sentiment-${subject}-${day}.png`;
}

export function shareCopy(kind) {
  return kind === "gauges"
    ? "Today’s US market sentiment: Fear & Greed and VIX."
    : "US market sentiment history: Fear & Greed and VIX.";
}

export function platformShareUrl(platform, options) {
  const buildUrl = PLATFORM_URLS[platform];
  if (!buildUrl) throw new Error(`Unsupported share platform: ${platform}`);
  return buildUrl(options);
}

export function platformShareInstructions(platform) {
  const name = PLATFORM_NAMES[platform];
  if (!name) throw new Error(`Unsupported share platform: ${platform}`);
  return {
    title: `Share to ${name}`,
    composerLabel: `Open ${name} composer`
  };
}
