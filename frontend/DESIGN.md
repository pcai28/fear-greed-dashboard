---
name: US Stock Market Emotions
description: A calm, scannable market-sentiment dashboard for investors.
colors:
  signal-blue: "#255f85"
  sentiment-orange: "#c05235"
  error-orange: "#a6402a"
  canvas: "#f7f8f4"
  panel: "#ffffff"
  panel-subtle: "#f4f6f3"
  ink: "#182026"
  muted-ink: "#626d75"
  divider: "#d9dfdc"
  night-canvas: "#15191d"
  night-panel: "#1d2328"
  night-ink: "#eef2f1"
  night-muted-ink: "#a8b3b8"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2.75rem (2rem compact)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 2.1vw, 1.45rem)"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 650
    lineHeight: 1.25
  gauge-semantic:
    fontFamily: "Archivo Narrow Variable, Arial Narrow, sans-serif"
    fontSize: "15px range labels / clamp(1rem, 2.1vw, 1.45rem) status"
    fontWeight: "560 inactive / 680 active / 650 status"
    lineHeight: 1.25
rounded:
  control: "6px"
  surface: "8px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.panel}"
    typography: "{typography.label}"
    rounded: "{rounded.surface}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.surface}"
    padding: "0 16px"
    height: "44px"
  header-alert-link:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.panel}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    visualHeight: "36px"
    targetSize: "44px"
  theme-cycle:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.full}"
    visualSize: "36px"
    targetSize: "44px"
    modes: "auto, light, dark"
  range-tab:
    backgroundColor: "{colors.panel-subtle}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "44px"
  range-tab-active:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "44px"
  text-input:
    backgroundColor: "{colors.panel-subtle}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.surface}"
    padding: "0 12px"
    height: "44px"
  data-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
---

# Design System: US Stock Market Emotions

## Overview

**Creative North Star: "The Calm Signal Desk"**

The interface should feel like a well-organized desk where market signals are already sorted before the investor arrives. It is trustworthy, approachable, clear, and calm: dense enough for active traders, but immediately understandable to a casual investor checking the market between other tasks.

Information hierarchy carries the experience. Current readings lead, historical context follows, and supporting definitions remain available without competing for attention. The system rejects the urgency theater of financial media, the visual congestion of overbuilt trading terminals, and any component that does not improve understanding or decision-making.

**Key Characteristics:**

- Restrained light and dark surfaces with two stable signal colors.
- Compact, familiar controls that disappear into the task.
- Strong numeric hierarchy supported by plain-language status labels.
- Border-defined data panels balanced by open quote and footer regions.
- Structural responsiveness at the 820px breakpoint.

## Colors

The palette pairs cool, dependable blue with a controlled orange signal against low-chroma neutral surfaces.

### Primary

- **Signal Blue** (`#255f85`): VIX data, primary actions, success messaging, and focused interaction. Its dark-theme counterpart is `#7cb7d8`.

### Secondary

- **Sentiment Orange** (`#c05235`): Fear & Greed data, warning and error messaging, and meaningful sentiment emphasis. Its dark-theme counterpart is `#ee9273`.
- **Error Orange** (`#a6402a`): Light-theme form error text, darkened from Sentiment Orange to maintain AA contrast at helper size. Dark mode uses `#ee9273`.

### Neutral

- **Quiet Canvas** (`#f7f8f4`): The light application background.
- **Clear Panel** (`#ffffff`): Primary cards, controls, tables, and tool surfaces.
- **Subtle Panel** (`#f4f6f3`): Secondary fields, headers, and grouped controls.
- **Graphite Ink** (`#182026`): Primary text and high-confidence information.
- **Measured Ink** (`#626d75`): Supporting copy, timestamps, labels, and secondary values with WCAG AA contrast on every light surface.
- **Soft Divider** (`#d9dfdc`): Borders and separators that clarify structure without creating a box around everything.
- **Night Canvas** (`#15191d`), **Night Panel** (`#1d2328`), **Night Ink** (`#eef2f1`), and **Night Measured Ink** (`#a8b3b8`): Dark-theme equivalents that preserve hierarchy rather than simply inverting colors.

### Named Rules

**The Two Signal Rule.** Signal Blue belongs to VIX and action; Sentiment Orange belongs to Fear & Greed and caution. Never introduce a third decorative accent.

**The Redundant Meaning Rule.** Color never carries market state alone. Pair it with text, position, shape, line style, or an accessible label so color-vision differences never erase meaning.

## Typography

**Display Font:** Inter with the system sans stack

**Body Font:** Inter with the system sans stack

**Interface Label Font:** Inter with the system sans stack

**Gauge Semantic Font:** Archivo Narrow Variable with a narrow system fallback

**Character:** Inter keeps the dashboard familiar and highly scannable. Archivo Narrow is reserved for qualitative gauge meaning, adding a compact instrument character without entering controls, prose, headings, numbers, or tick labels.

### Hierarchy

- **Display** (700, `2.75rem` wide / `2rem` compact, 1): The single page title; never use this scale for ordinary panel headings.
- **Headline** (700, `1rem`, 1.25): Section, table, and footer headings.
- **Title** (700, `clamp(1rem, 2.1vw, 1.45rem)`, 1.25): Metric status and other high-value state summaries.
- **Body** (400, `0.94rem`, 1.65): Definitions and explanatory content, capped near 70 characters per line where layout permits.
- **Label** (650, `0.9rem`, 1.25): Controls, legends, metric labels, and compact navigation.
- **Gauge Semantic** (Archivo Narrow, 560–680): Range labels and the status beneath each gauge value only. Numbers and ticks remain Inter.

### Named Rules

**The Gauge Semantic Exception.** Use Inter for the interface and quantitative data. Use Archivo Narrow only for qualitative range labels and the status beneath each gauge value, so the second family reads as a deliberate semantic role rather than decoration.

## Elevation

The system is deliberately flat. Neutral surface changes and Soft Divider borders establish structure; shadows are reserved for genuinely floating details. Never combine a decorative 1px border with a wide soft shadow on the same element.

### Shadow Vocabulary

- **Gauge Hub** (`0 1px 4px rgba(24, 32, 38, 0.08)`): Provides just enough separation for the central gauge reading.
- **Floating Detail** (`0 6px 18px rgba(24, 32, 38, 0.14)`): Reserved for transient chart tooltips; never for static content.

### Named Rules

**The Quiet Depth Rule.** Use tonal layering first, borders second, and shadows last. If every surface floats, none of the hierarchy is trustworthy.

**The Reading Rhythm Rule.** Use the same section transition between the live readings and historical chart and between the historical chart and Index Reference, including each section's Share toolbar in that rhythm. The quote is the deliberate pause: give it generous, symmetrical whitespace before the footer. Supporting regions remain open rather than card-framed.

**The Reference Hierarchy Rule.** The Index Reference region begins with one visible section heading and a short interpretation summary. Definitions and table titles are subordinate headings in sentence case. Establish hierarchy through type and spacing rather than additional nested cards.

## Components

### Buttons

- **Shape:** Familiar compact rectangles with gently curved corners (8px).
- **Primary:** Signal Blue with white text in light mode and Graphite Ink in dark mode, a 44px minimum height, and 14px horizontal padding. Reserve it for the single highest-value action in its region.
- **Hover / Focus:** Hover slightly deepens the existing blue; focus uses a visible 2px blue-tinted outline with 2px offset. Disabled controls retain their label and lower opacity without relying on color alone.
- **Secondary:** Clear Panel with Graphite Ink, a structural divider, a 44px minimum height, and 12px horizontal padding.
- **Header exceptions:** “Get alerts” is a compact 36px-high pill and the theme cycle is a 36px circular icon button. Both extend their interactive target to 44px. The theme button cycles Auto → Light → Dark, shows the current mode icon, follows system changes while in Auto, and exposes the current and next modes in its accessible name.

### Chips

- **Style:** Range options live in one grouped control with a Subtle Panel track, 4px internal gap, and 6px item corners.
- **State:** Unselected labels use Measured Ink; the selected option moves to Clear Panel and Graphite Ink without elevation. Hover and focus never imitate selection.

### Cards / Containers

- **Corner Style:** Consistent gently curved corners (8px); cards never become pill-shaped.
- **Background:** Clear Panel for most top-level regions. The two primary metric cards use restrained full-surface gradients from Clear Panel into their corresponding Sentiment Orange or Signal Blue soft field, reinforcing which reading is which without adding new colors.
- **Shadow Strategy:** Follow the Quiet Depth Rule; static regions stay flat and floating details alone receive elevation.
- **Border:** Soft Divider for top-level regions, embedded chart frames, table wrappers, and grouped controls.
- **Internal Padding:** 24px for signature metric and reference regions, 16px for chart and compact mobile regions, and 8–16px for controls.
- **Open Regions:** The quote and footer intentionally have no card background, rounded frame, or elevation. The quote relies on centered measure and whitespace; the footer uses a single top divider.
- **Footer Layout:** On wide screens, the open footer uses two equal columns: the email-interest form on the left and four disclaimer sections in one vertical stack on the right. A single divider separates the columns. Below 820px, both columns stack with the form first.
- **Footer Typography:** Every disclaimer heading uses Headline (`1rem`, 700, 1.25); every disclaimer paragraph uses Body (`0.94rem`, 400, 1.65). The waitlist title is the deliberate exception at `1.25rem` wide and `1.125rem` compact. The waitlist uses only three roles: title, body/input, and helper/status.
- **Footer Legal Links:** Privacy Policy and Terms of Use form a separate fine-print utility row at the bottom-right of the page. Use Measured Ink at `0.75rem`, preserve underlines and visible focus, and separate the row from the primary footer content through the footer spacing rhythm rather than another divider or card.
- **Copy Rhythm:** Keep the Buffett quote on one line when the wide layout can contain it. The waitlist opens with one value-led title, followed by one supporting paragraph, a 24px break before the form, and one consolidated trust note. Avoid forced line breaks and duplicated reassurance. On compact screens, the quote may wrap to prevent overflow.

### Inputs / Fields

- **Style:** Subtle Panel fill, Soft Divider stroke, 8px corners, 44px minimum height, and 12px horizontal padding.
- **Focus:** A 2px Signal Blue-tinted outline with 2px offset. Placeholder text must maintain WCAG 2.2 AA contrast.
- **Error / Disabled:** Error copy uses Sentiment Orange plus explicit text; saving disables the submit action while preserving its readable label.

### Navigation

- **Style:** The time-range selector is the dashboard's compact navigation pattern. Keep labels short, keyboard reachable, and structurally responsive: seven columns on wide screens and four columns below 820px.
- **Header actions:** Keep “Get alerts” and the theme cycle at the upper-right of the wide header, with the update timestamp subordinate below them. “Get alerts” links directly to the signup form.

### Sentiment Gauges

Gauges are the signature reading surface. They combine a large numeric value, plain-language state, scale labels, and an accessible sentence. Qualitative range labels follow the outer portion of the arc and remain centered within their corresponding segments; long labels may wrap onto a second concentric path but must retain the same type size as every other range label. The label matching the current state becomes Graphite Ink and heavier while inactive labels remain measured, linking the needle position to its qualitative meaning without relying on segment color alone. Numeric ticks sit upright at evenly spaced angular positions along the inner arc. Both label systems belong to the non-selectable SVG so they scale and align with the gauge rather than floating above it as HTML. Needle motion and label emphasis communicate a state change and must become instant or near-instant when reduced motion is requested. Gauge colors follow the Two Signal Rule, and status remains understandable when all color is removed.

### Historical Chart

Use one semantic grid system only: the six Canvas-rendered horizontal lines that align with the dual Y-axis values. The plotting field remains a solid Chart Background with no decorative CSS grid. Add vertical guides only when they align with visible date ticks and materially improve lookup.

### Sharing and Export

Use separate compact share pills at the bottom-right outside the current gauges and historical line chart cards. Gauge export always produces the two metric cards side by side; chart export captures the full analytical card at its readable desktop composition. Both are rendered from the current DOM into a 2× PNG. The export dialog offers exactly five equal, circular, icon-only actions: X, Threads, Facebook, Reddit, and Save, with Threads placed directly after X. Every icon requires an accessible name and visible focus state. Selecting a social shortcut reveals one compact inline instruction panel beneath the actions with three explicit steps: copy the PNG, open that platform's composer, and paste the image. Save remains a direct download. Loading, ready, error, retry, close, copy-feedback, and reduced-motion states are required.

## Do's and Don'ts

### Do:

- **Do** preserve Signal Blue (`#255f85`) and Sentiment Orange (`#c05235`) as the two stable data-and-action colors.
- **Do** make today's readings understandable before presenting definitions, methodology, or subscription prompts.
- **Do** pair every chart color and gauge state with text, position, line style, or an accessible label.
- **Do** maintain WCAG 2.2 AA contrast, full keyboard use, screen-reader summaries, and reduced-motion behavior from the first implementation pass.
- **Do** keep controls familiar, compact, and consistent: 6–8px corners for standard controls, full pills only for the two approved header actions, 44px minimum touch targets, and visible focus outlines.

### Don't:

- **Don't** resemble a clickbait financial-news website, an ad-heavy content site, or an overwhelming trading terminal.
- **Don't** use sensational claims, attention traps, decorative market noise, or components that do not improve understanding or decision-making.
- **Don't** introduce gradient text, decorative glassmorphism, oversized pill-shaped cards, or repeated identical card grids.
- **Don't** combine a decorative 1px border with a wide soft shadow on the same static surface.
- **Don't** use color as the only carrier of fear, greed, volatility, warning, success, or selection.
