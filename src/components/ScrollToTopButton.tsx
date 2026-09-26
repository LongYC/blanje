import { useEffect, useState } from "react";
import styles from "./ScrollToTopButton.module.css";

const SCROLL_THRESHOLD = 240;

export function ScrollToTopButton() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    function updateScrollPosition() {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    }

    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollPosition);
  }, []);

  function scrollToTop() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  }

  if (!isScrolled && !isFocused) return null;

  return (
    <button
      type="button"
      className={styles.button}
      aria-label="Scroll to top"
      onClick={scrollToTop}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}