"use client";

import { useEffect, useState, type ReactNode } from "react";

type ComingSoonBadgeProps = {
  comingSoon: boolean;
  releaseTimestamp: number | null;
  className?: string;
  children?: ReactNode;
};

const UPDATE_INTERVAL_MS = 30_000;

export function ComingSoonBadge({
  comingSoon,
  releaseTimestamp,
  className,
  children,
}: ComingSoonBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), UPDATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const shouldShow =
    comingSoon && (!releaseTimestamp || releaseTimestamp > now);

  if (!shouldShow) {
    return null;
  }

  return (
    <span className={className} aria-label="Coming soon">
      {children ?? "Coming soon"}
    </span>
  );
}
