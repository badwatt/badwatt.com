import { lazy, Suspense, type ReactNode } from "react";
import { CapWidget } from "src/captcha/ui/CapWidget";
import { CVThemePicker } from "src/cv/ui/CVThemePicker";
import { Modal } from "src/cv/ui/Modal";
import { useCV } from "src/cv/ui/useCV";
import type { AboutEntry, ExperienceEntry, SkillEntry } from "src/content/domain/content";

// Cargado bajo demanda: arrastra pdfjs-dist y solo se necesita al abrir el CV.
const PdfViewer = lazy(() => import("src/cv/ui/PdfViewer").then((m) => ({ default: m.PdfViewer })));

interface CvLauncherProps {
  experienceData: ExperienceEntry[];
  aboutData: AboutEntry[];
  skillsData: SkillEntry[];
  /** What the page shows before the flow starts; `start` opens the palette picker. */
  idle: (start: () => void) => ReactNode;
}

/**
 * The whole CV flow as one widget: palette picker, captcha, generating state and
 * the viewer. The page only decides how the idle state looks.
 */
export const CvLauncher = ({ experienceData, aboutData, skillsData, idle }: CvLauncherProps) => {
  const cv = useCV({ experienceData, aboutData, skillsData });

  return (
    <>
      {cv.step === "loading" ? (
        <span className="px-8 py-3.5 border border-badwatt-border text-badwatt-white font-semibold rounded-xl">
          Generating...
        </span>
      ) : cv.step === "captcha" ? (
        <div className="flex flex-col items-center gap-3">
          <CapWidget onVerified={cv.verify} />
          <button
            type="button"
            onClick={cv.openThemes}
            className="text-xs text-badwatt-muted hover:text-badwatt-primary transition-colors duration-300 cursor-pointer"
          >
            Change palette
          </button>
        </div>
      ) : (
        idle(cv.openThemes)
      )}

      {cv.viewerUrl !== null && (
        <Suspense fallback={null}>
          <PdfViewer src={cv.viewerUrl} isOpen onClose={cv.closeViewer} />
        </Suspense>
      )}

      <Modal
        isOpen={cv.step === "themes"}
        onClose={cv.closeThemes}
        ariaLabel="Choose CV palette"
        className="md:h-auto md:max-h-[85vh] md:max-w-3xl"
      >
        <CVThemePicker selectedId={cv.theme.id} onSelect={cv.pickTheme} />
      </Modal>
    </>
  );
};
