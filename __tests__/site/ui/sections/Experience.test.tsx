import { cleanup, render, screen } from "@testing-library/react";
import { Experience } from "src/site/ui/sections/Experience";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { mockIntersectionObserver } from "../../../mocks/IntersectionObserver.tsx";
import { testExperienceData } from "../../../fixtures";

describe("<Experience />", () => {
  beforeEach(() => {
    mockIntersectionObserver();
  });
  afterEach(cleanup);

  it("should match the snapshot", () => {
    const { container } = render(<Experience experienceData={testExperienceData} />);
    expect(container).toMatchSnapshot();
  });

  it("should render a heading", () => {
    render(<Experience experienceData={testExperienceData} />);
    expect(screen.getByRole("heading", { name: /experience/i })).toBeDefined();
  });

  it("should render accordion items", () => {
    render(<Experience experienceData={testExperienceData} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("should auto-open the most recent experience", () => {
    render(<Experience experienceData={testExperienceData} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
  });

  it("should render experience images", () => {
    render(<Experience experienceData={testExperienceData} />);
    expect(screen.getAllByRole("img").length).toBeGreaterThanOrEqual(1);
  });

  it("renders sub-periods as accordion items with the first `#` heading as title", () => {
    const split = {
      ...testExperienceData[0],
      description:
        "# Consulting Firm:\n\n- PLEXUS\n\n> 1 year 3 months\n\n---\n\n# Consulting Firm:\n\n- Knowmad Mood",
    };
    render(<Experience experienceData={[split]} />);
    const buttons = screen.getAllByRole("button");
    const periodButton = buttons.find((b) => b.textContent?.includes("Period "));
    expect(periodButton).toBeUndefined();
    const headingButtons = buttons.filter((b) => b.textContent?.includes("Consulting Firm:"));
    expect(headingButtons.length).toBeGreaterThanOrEqual(2);
    expect(headingButtons[0].getAttribute("aria-expanded")).toBe("true");
    expect(headingButtons[1].getAttribute("aria-expanded")).toBe("false");
    expect(headingButtons[0].textContent).toContain("1 year 3 months");
    expect(screen.getByText("PLEXUS")).toBeDefined();
    expect(screen.getByText("Knowmad Mood")).toBeDefined();
    expect(screen.getAllByText("Consulting Firm:").length).toBe(2);
    expect(screen.getAllByText("1 year 3 months").length).toBe(1);
  });

  it("renders the description directly when there is no `---`", () => {
    render(<Experience experienceData={testExperienceData} />);
    const buttons = screen.getAllByRole("button");
    const periodButton = buttons.find((b) => b.textContent?.includes("Period "));
    expect(periodButton).toBeUndefined();
  });
});
