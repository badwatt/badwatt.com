import { useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { usePdfPages } from "src/cv/ui/usePdfPages";
import { usePinchZoom } from "src/cv/ui/usePinchZoom";
import { renderPageToCanvas } from "src/cv/infrastructure/pdf/renderPageToCanvas";
import { Spinner } from "src/ui/components/Spinner";

// new Worker() y el fallback import() de pdfjs necesitan una URL de módulo real.
// Un fichero de /public no sirve: Vite rechaza importarlo desde código ("should not be
// imported from source code") y convierte el fallback en un 500 en dev.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// pdfjs-dist v6 ya no acepta un string suelto: exige DocumentInitParameters ({ url }).
// Estable a nivel de módulo para que usePdfPages no re-ejecute su efecto en cada render.
const loadDocument = (src: string) => pdfjsLib.getDocument({ url: src });

interface PdfCanvasProps {
  src: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function PdfCanvas({ src, zoom = 1, onZoomChange }: PdfCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { loading, error } = usePdfPages({
    src,
    containerRef: canvasRef,
    // pdfjs-dist v6 no acepta un string suelto: exige DocumentInitParameters.
    getDocument: loadDocument,
    renderPage: renderPageToCanvas,
  });

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = usePinchZoom(
    zoom,
    onZoomChange,
    wrapperRef,
  );

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    for (const canvas of container.querySelectorAll("canvas")) {
      (canvas as HTMLCanvasElement).style.width = `${zoom * 100}%`;
    }
  }, [zoom, loading]);

  if (!src) return null;

  if (error) {
    return <div className="grid h-full place-items-center text-badwatt-muted">{error}</div>;
  }

  return (
    <div
      ref={wrapperRef}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-badwatt-surface">
          <Spinner />
        </div>
      )}
      <div ref={canvasRef} className="min-h-full pb-8 w-full" data-testid="pdf-canvas-container" />
    </div>
  );
}
