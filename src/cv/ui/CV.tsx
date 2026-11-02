import { lazy, Suspense } from "react";
import { ArrowLeftIcon, FileTextIcon, SpinnerIcon } from "@phosphor-icons/react";
import { CapWidget } from "src/components/CapWidget";
import { CVThemePicker } from "src/cv/ui/CVThemePicker";
import { useCV, type CvStep } from "src/cv/ui/useCV";
import type { CVTheme } from "src/cv/domain/theme";
import { Toaster } from "react-hot-toast";
import type { ExperienceEntry, AboutEntry, SkillEntry } from "src/domain/content";

// Cargado bajo demanda: arrastra pdfjs-dist y solo se necesita al abrir el CV.
const PdfViewer = lazy(() => import("src/cv/ui/PdfViewer").then((m) => ({ default: m.PdfViewer })));

interface CVProps {
  experienceData: ExperienceEntry[];
  aboutData: AboutEntry[];
  skillsData: SkillEntry[];
}

export const CV = ({ experienceData, aboutData, skillsData }: CVProps) => {
  const cv = useCV({ experienceData, aboutData, skillsData });

  return (
    <section id="cv" className="section-curve mt-32 md:mt-48 px-4 md:px-0">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-badwatt-surface)",
            color: "var(--color-badwatt-white)",
            border: "1px solid var(--color-badwatt-border)",
          },
        }}
      />
      {renderStep(cv.step, {
        onOpen: cv.openThemes,
        onPickTheme: cv.pickTheme,
        onBackToThemes: cv.backToThemes,
        onVerified: cv.verify,
        selectedTheme: cv.theme,
      })}
      {cv.viewerUrl !== null && (
        <Suspense fallback={null}>
          <PdfViewer src={cv.viewerUrl} isOpen onClose={cv.closeViewer} />
        </Suspense>
      )}
    </section>
  );
};

interface StepHandlers {
  onOpen: () => void;
  onPickTheme: (theme: CVTheme) => void;
  onBackToThemes: () => void;
  onVerified: (token: string) => void;
  selectedTheme: CVTheme;
}

function renderStep(step: CvStep, h: StepHandlers) {
  switch (step) {
    case "idle":
      return <IdleStep onOpen={h.onOpen} />;
    case "themes":
      return <CVThemePicker selectedId={h.selectedTheme.id} onSelect={h.onPickTheme} />;
    case "captcha":
      return (
        <CaptchaStep theme={h.selectedTheme} onBack={h.onBackToThemes} onVerified={h.onVerified} />
      );
    case "loading":
      return <LoadingStep theme={h.selectedTheme} />;
  }
}

function IdleStep({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label="Open CV"
      onClick={onOpen}
      className="w-full grid place-items-center p-12 md:p-20 rounded-3xl bg-badwatt-surface border border-badwatt-border hover:border-badwatt-primary/40 transition-all duration-500 group cursor-pointer active:scale-[0.99] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-br from-badwatt-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-badwatt-primary/20 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-badwatt-primary/20 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
      <h2 className="relative z-10 text-4xl md:text-5xl tracking-[-0.03em] font-bold text-badwatt-white group-hover:text-badwatt-primary transition-colors duration-300">
        Check out my CV
      </h2>
      <div className="relative z-10 mt-6 p-3 rounded-full bg-badwatt-primary/10 group-hover:bg-badwatt-primary/20 transition-all duration-300">
        <FileTextIcon
          size={32}
          weight="bold"
          className="text-badwatt-muted group-hover:text-badwatt-primary transition-colors duration-300"
        />
      </div>
    </button>
  );
}

function CaptchaStep({
  theme,
  onBack,
  onVerified,
}: {
  theme: CVTheme;
  onBack: () => void;
  onVerified: (token: string) => void;
}) {
  return (
    <div className="w-full p-8 md:p-12 rounded-3xl bg-badwatt-surface border border-badwatt-border">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl tracking-[-0.03em] font-bold text-badwatt-white">
            Verify to generate
          </h2>
          <p className="mt-2 text-sm text-badwatt-muted">
            One quick check, then your PDF is ready.
          </p>
        </div>
        <SelectedThemeBadge theme={theme} />
      </div>
      <div className="grid place-items-center">
        <CapWidget onVerified={onVerified} />
      </div>
      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-badwatt-muted hover:text-badwatt-primary transition-colors duration-300 cursor-pointer"
        >
          <ArrowLeftIcon size={14} weight="bold" />
          Back to themes
        </button>
      </div>
    </div>
  );
}

function SelectedThemeBadge({ theme }: { theme: CVTheme }) {
  const base = `rgb(${theme.colors.base.join(", ")})`;
  const accent = `rgb(${theme.colors.accent.join(", ")})`;
  return (
    <div
      className="inline-flex items-center gap-3 rounded-full border border-badwatt-border bg-badwatt-base/60 px-3 py-1.5"
      aria-label={`Selected theme: ${theme.name}`}
    >
      <span
        className="inline-block h-3 w-3 rounded-full border border-badwatt-border"
        style={{ backgroundColor: base }}
        aria-hidden="true"
      />
      <span
        className="inline-block h-3 w-3 rounded-full border border-badwatt-border"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <span className="text-[11px] font-mono uppercase tracking-widest text-badwatt-muted">
        {theme.name}
      </span>
    </div>
  );
}

function LoadingStep({ theme }: { theme: CVTheme }) {
  return (
    <div className="w-full grid place-items-center p-12 md:p-20 rounded-3xl bg-badwatt-surface border border-badwatt-border">
      <h2 className="relative z-10 text-4xl md:text-5xl tracking-[-0.03em] font-bold text-badwatt-white">
        Generating CV...
      </h2>
      <div className="relative z-10 mt-6 p-3 rounded-full bg-badwatt-primary/10">
        <SpinnerIcon size={32} weight="bold" className="text-badwatt-primary animate-spin" />
      </div>
      <p className="relative z-10 mt-4 text-xs font-mono uppercase tracking-widest text-badwatt-muted">
        {theme.name}
      </p>
    </div>
  );
}
