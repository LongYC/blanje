// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollToTopButton } from "./ScrollToTopButton";

function setScrollY(scrollY: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: scrollY });
  fireEvent.scroll(window);
}

function setReducedMotionPreference(prefersReducedMotion: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: prefersReducedMotion }),
  });
}

beforeEach(() => {
  setReducedMotionPreference(false);
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ScrollToTopButton", () => {
  it("appears after scrolling past the threshold with an accessible button name", () => {
    render(<ScrollToTopButton />);

    expect(screen.queryByRole("button", { name: "Scroll to top" })).toBeNull();

    setScrollY(241);

    expect(screen.getByRole("button", { name: "Scroll to top" })).toBeTruthy();
  });

  it("scrolls smoothly and supports keyboard activation", async () => {
    const user = userEvent.setup();
    setScrollY(300);
    render(<ScrollToTopButton />);

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Scroll to top" }),
    );
    await user.keyboard("{Enter}");

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("scrolls instantly when reduced motion is preferred", async () => {
    setReducedMotionPreference(true);
    setScrollY(300);
    render(<ScrollToTopButton />);

    await userEvent.click(screen.getByRole("button", { name: "Scroll to top" }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("stays available while focused and hides after focus leaves at the top", () => {
    setScrollY(300);
    render(<ScrollToTopButton />);
    const button = screen.getByRole("button", { name: "Scroll to top" });

    fireEvent.focus(button);
    setScrollY(0);
    expect(screen.getByRole("button", { name: "Scroll to top" })).toBeTruthy();

    fireEvent.blur(button);
    expect(screen.queryByRole("button", { name: "Scroll to top" })).toBeNull();
  });
});