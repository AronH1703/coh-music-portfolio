"use client";

import { useEffect, useRef } from "react";

export default function PatternBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      const rotation = window.scrollY / 10; // adjust speed
      el.style.transform = `rotate(${rotation}deg)`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div ref={ref} className="pattern" aria-hidden="true" />;
}
