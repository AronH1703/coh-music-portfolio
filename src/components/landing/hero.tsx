'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { HeroContent } from '@/lib/content';

type HeroProps = {
  data: HeroContent | null;
};

const DEFAULTS: Required<Pick<HeroContent, 'title' | 'subtitle'>> & {
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  eyebrow: string;
} = {
  title: 'Soundscapes crafted for the moments that matter.',
  subtitle:
    'Lean into immersive textures and evolving rhythms tailored for film, stage, and the listening room. This space will soon house releases, visuals, and stories from the studio floor.',
  primaryCtaLabel: 'Explore the work',
  primaryCtaHref: '#music',
  secondaryCtaLabel: 'Booking & inquiries',
  secondaryCtaHref: '#contact',
  eyebrow: 'Composer • Producer • Multi-Instrumentalist',
};

export function HeroSection({ data }: HeroProps) {
  const title = data?.title?.trim() || DEFAULTS.title;
  const subtitle = data?.subtitle?.trim() || DEFAULTS.subtitle;
  const primaryLabel = data?.primaryCtaLabel?.trim() || DEFAULTS.primaryCtaLabel;
  const primaryHref = data?.primaryCtaHref?.trim() || DEFAULTS.primaryCtaHref;
  const secondaryLabel = data?.secondaryCtaLabel?.trim() || DEFAULTS.secondaryCtaLabel;
  const secondaryHref = data?.secondaryCtaHref?.trim() || DEFAULTS.secondaryCtaHref;
  const eyebrow = DEFAULTS.eyebrow;

  const backgroundColor = data?.backgroundColor?.trim() || '#0f172a';
  const titleColor = data?.titleColor?.trim() || '#ffffff';
  const subtitleColor = data?.subtitleColor?.trim() || 'rgba(255,255,255,0.82)';
  const eyebrowColor = data?.eyebrowColor?.trim() || 'rgba(250, 204, 21, 0.85)';
  const titleFont = data?.titleFont?.trim();
  const subtitleFont = data?.subtitleFont?.trim();

  const titleStyle: CSSProperties = {
    color: titleColor,
    fontFamily: titleFont || undefined,
  };

  const subtitleStyle: CSSProperties = {
    color: subtitleColor,
    fontFamily: subtitleFont || undefined,
  };

  const eyebrowStyle: CSSProperties = {
    color: eyebrowColor,
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--site-background', backgroundColor);
    root.style.setProperty('--site-foreground', titleColor);
    root.style.setProperty('--foreground', titleColor);
    root.style.setProperty('--muted-foreground', subtitleColor);
    root.style.setProperty('--accent-foreground', eyebrowColor);
    root.style.setProperty('--accent', eyebrowColor);
  }, [backgroundColor, titleColor, subtitleColor, eyebrowColor]);

  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="section-inner" style={{ textAlign: 'left', marginTop: '2rem' }}>
        <motion.span
          className="eyebrow"
          style={eyebrowStyle}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {eyebrow}
        </motion.span>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            style={titleStyle}
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            style={subtitleStyle}
          >
            {subtitle}
          </motion.p>
        </div>

        <motion.div
          className={clsx('actions', 'flex flex-wrap items-center gap-3')}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        >
          {primaryLabel && (
            <Link href={primaryHref || '#'} className="btn btn-primary">
              {primaryLabel}
            </Link>
          )}
          {secondaryLabel && (
            <Link href={secondaryHref || '#'} className="btn btn-ghost">
              {secondaryLabel}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
