import { toBlob } from "html-to-image";
import { applyComputedSvgStyles, applyShareTheme, nextFrame } from "./export-preparation.js";
import { platformShareInstructions, platformShareUrl, shareCopy, shareFilename } from "./platforms.js";

const PREVIEW_PLACEHOLDER = "/favicon.svg";

async function copyPng(blob, navigatorRef, ClipboardItemRef) {
  if (!ClipboardItemRef || typeof navigatorRef?.clipboard?.write !== "function") return false;
  await navigatorRef.clipboard.write([
    new ClipboardItemRef({ "image/png": blob })
  ]);
  return true;
}

export function createShareController({
  elements,
  chart,
  renderPng = toBlob,
  navigatorRef = navigator,
  windowRef = window,
  ClipboardItemRef = globalThis.ClipboardItem
}) {
  const configurations = {
    gauges: {
      target: elements.gaugeShareTarget,
      trigger: elements.gaugeShareButton,
      title: "Share gauge snapshot",
      previewAlt: "Preview of both current market sentiment gauges"
    },
    "line-chart": {
      target: elements.chartPanel,
      trigger: elements.chartShareButton,
      title: "Share line chart snapshot",
      previewAlt: "Preview of the current market sentiment line chart",
      refresh: () => chart.render()
    }
  };

  let activeKind = null;
  let currentBlob = null;
  let currentObjectUrl = null;
  let activePlatformButton = null;

  function closeInstructions({ restoreFocus = false } = {}) {
    elements.shareInstructions.hidden = true;
    elements.shareOptions?.querySelectorAll("[data-share-platform]").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });
    elements.shareCopyImageLabel.textContent = "Copy image";
    if (restoreFocus) activePlatformButton?.focus();
    activePlatformButton = null;
  }

  function clearObjectUrl() {
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    elements.sharePreviewImage.src = PREVIEW_PLACEHOLDER;
    currentObjectUrl = null;
    currentBlob = null;
  }

  function setLoading(config) {
    clearObjectUrl();
    elements.shareDialogTitle.textContent = config.title;
    elements.sharePreview.setAttribute("aria-busy", "true");
    elements.sharePreviewImage.hidden = true;
    elements.sharePreviewImage.src = PREVIEW_PLACEHOLDER;
    elements.sharePreviewPlaceholder.hidden = false;
    elements.sharePreviewPlaceholder.textContent = "Rendering current market data…";
    elements.shareStatus.textContent = "Preparing PNG…";
    elements.shareOptions.hidden = true;
    closeInstructions();
    elements.shareRetry.hidden = true;
  }

  function setReady(config, blob) {
    const filename = shareFilename(activeKind);
    currentBlob = blob;
    currentObjectUrl = URL.createObjectURL(blob);

    elements.sharePreviewImage.src = currentObjectUrl;
    elements.sharePreviewImage.alt = config.previewAlt;
    elements.sharePreviewImage.hidden = false;
    elements.sharePreviewPlaceholder.hidden = true;
    elements.sharePreview.setAttribute("aria-busy", "false");
    elements.shareDownload.href = currentObjectUrl;
    elements.shareDownload.download = filename;
    elements.shareOptions.hidden = false;
    elements.shareStatus.textContent = "PNG ready.";
  }

  function setError() {
    elements.sharePreview.setAttribute("aria-busy", "false");
    elements.sharePreviewPlaceholder.hidden = false;
    elements.sharePreviewPlaceholder.textContent = "The image could not be created.";
    elements.shareStatus.textContent = "Something interrupted the PNG render. Try again.";
    elements.shareOptions.hidden = true;
    closeInstructions();
    elements.shareRetry.hidden = false;
  }

  async function generate(kind) {
    const config = configurations[kind];
    if (!config?.target || !config.trigger) return;
    activeKind = kind;
    setLoading(config);
    config.trigger.disabled = true;
    config.trigger.setAttribute("aria-busy", "true");
    if (!elements.shareDialog.open) elements.shareDialog.showModal();

    config.target.classList.add("share-export");
    const restoreTheme = applyShareTheme(config.target);
    const restoreSvgStyles = applyComputedSvgStyles(config.target);
    try {
      await document.fonts?.ready;
      await nextFrame();
      config.refresh?.();
      await nextFrame();
      const rect = config.target.getBoundingClientRect();
      const backgroundColor = getComputedStyle(config.target).backgroundColor;
      const blob = await renderPng(config.target, {
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor,
        filter: (node) => node?.getAttribute?.("data-share-exclude") !== "true"
      });
      if (!blob) throw new Error("PNG renderer returned no image");
      setReady(config, blob);
    } catch (error) {
      console.error("Share image generation failed", error);
      setError();
    } finally {
      config.target.classList.remove("share-export");
      restoreSvgStyles();
      restoreTheme();
      config.trigger.disabled = false;
      config.trigger.removeAttribute("aria-busy");
      config.refresh?.();
    }
  }

  function showPlatformInstructions(platform, button) {
    if (!currentBlob || !activeKind) return;
    const pageUrl = `${windowRef.location.origin}${windowRef.location.pathname}`;
    const instructions = platformShareInstructions(platform);
    const composerUrl = platformShareUrl(platform, {
      pageUrl,
      text: shareCopy(activeKind)
    });
    closeInstructions();
    activePlatformButton = button;
    button.setAttribute("aria-expanded", "true");
    elements.shareInstructionsTitle.textContent = instructions.title;
    elements.shareOpenComposerLabel.textContent = instructions.composerLabel;
    elements.shareOpenComposer.href = composerUrl;
    elements.shareInstructions.hidden = false;
    elements.shareStatus.textContent = `${instructions.title} instructions opened.`;
  }

  async function copyCurrentImage() {
    if (!currentBlob) return;
    elements.shareCopyImage.disabled = true;
    const copied = await copyPng(currentBlob, navigatorRef, ClipboardItemRef).catch(() => false);
    elements.shareCopyImage.disabled = false;
    elements.shareCopyImageLabel.textContent = copied ? "Image copied" : "Copy unavailable";
    elements.shareStatus.textContent = copied
      ? "PNG copied. Open the composer, then paste the image into your post."
      : "This browser could not copy the PNG. Use Save PNG instead.";
  }

  function closeDialog() {
    elements.shareDialog.close();
  }

  return {
    init() {
      elements.gaugeShareButton?.addEventListener("click", () => generate("gauges"));
      elements.chartShareButton?.addEventListener("click", () => generate("line-chart"));
      elements.shareDialogClose?.addEventListener("click", closeDialog);
      elements.shareRetry?.addEventListener("click", () => generate(activeKind));
      elements.shareOptions?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-share-platform]");
        if (button) showPlatformInstructions(button.dataset.sharePlatform, button);
      });
      elements.shareInstructionsClose?.addEventListener("click", () => closeInstructions({ restoreFocus: true }));
      elements.shareCopyImage?.addEventListener("click", copyCurrentImage);
      elements.shareDialog?.addEventListener("click", (event) => {
        if (event.target === elements.shareDialog) closeDialog();
      });
      elements.shareDialog?.addEventListener("close", () => {
        closeInstructions();
        clearObjectUrl();
      });
      return this;
    }
  };
}
