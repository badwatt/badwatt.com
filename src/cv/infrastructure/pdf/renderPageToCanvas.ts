import type { PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDF_SCALE } from "src/cv/infrastructure/pdf/constants";

const MAX_RENDER_SCALE = 3;

export async function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale = PDF_SCALE,
  containerWidth?: number,
) {
  const dpr = window.devicePixelRatio || 1;
  const baseViewport = page.getViewport({ scale: 1 });

  let renderScale = containerWidth ? (containerWidth / baseViewport.width) * dpr : scale * dpr;
  renderScale = Math.min(renderScale, MAX_RENDER_SCALE);

  const viewport = page.getViewport({ scale: renderScale });
  canvas.width = 0;
  canvas.height = 0;
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
}
