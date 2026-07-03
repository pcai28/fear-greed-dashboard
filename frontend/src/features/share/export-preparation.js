export const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const SHARE_THEME_PROPERTIES = [
  "--bg",
  "--ink",
  "--muted",
  "--line",
  "--panel",
  "--panel-2",
  "--chart-bg",
  "--vix",
  "--on-vix",
  "--fear",
  "--fear-soft",
  "--vix-soft",
  "--shadow-selected",
  "--font-gauge-semantic"
];

const SVG_STYLE_PROPERTIES = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-dasharray",
  "stroke-dashoffset",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline"
];

function legacyColor(value) {
  const match = value.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/
  );
  if (!match) return value;
  const red = Math.round(Number(match[1]) * 255);
  const green = Math.round(Number(match[2]) * 255);
  const blue = Math.round(Number(match[3]) * 255);
  const alpha = match[4] == null ? 1 : Number(match[4]);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function applyComputedSvgStyles(target) {
  const nodes = [...target.querySelectorAll("svg, svg *")];
  const originals = nodes.map((node) => node.getAttribute("style"));
  nodes.forEach((node) => {
    const computed = getComputedStyle(node);
    SVG_STYLE_PROPERTIES.forEach((property) => {
      const value = computed.getPropertyValue(property);
      if (!value) return;
      node.style.setProperty(
        property,
        property === "fill" || property === "stroke" ? legacyColor(value) : value
      );
    });
  });
  return () => {
    nodes.forEach((node, index) => {
      if (originals[index] == null) node.removeAttribute("style");
      else node.setAttribute("style", originals[index]);
    });
  };
}

export function applyShareTheme(target) {
  const originalStyle = target.getAttribute("style");
  const rootStyles = getComputedStyle(document.documentElement);
  SHARE_THEME_PROPERTIES.forEach((property) => {
    target.style.setProperty(property, rootStyles.getPropertyValue(property).trim());
  });
  return () => {
    if (originalStyle == null) target.removeAttribute("style");
    else target.setAttribute("style", originalStyle);
  };
}
