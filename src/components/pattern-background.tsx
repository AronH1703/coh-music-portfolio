"use client";

import { useEffect } from "react";

export default function PatternBackground() {
  useEffect(() => {
    const pattern = document.querySelector<HTMLElement>(".pattern");
    if (!pattern) return;

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      pattern.style.transform = "translate(-50%, -50%) rotate(0deg)";
      return;
    }

    let latestScrollY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;

    const updateRotation = () => {
      const angle = latestScrollY * 0.03;
      pattern.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      ticking = false;
    };

    const handleScroll = () => {
      latestScrollY = window.scrollY || window.pageYOffset || 0;
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateRotation);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Set initial position based on starting scroll offset.
    updateRotation();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="pattern-wrapper">
      <div className="pattern" />
    </div>
  );
}
