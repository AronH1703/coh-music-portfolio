'use client';

import type { ReactNode } from 'react';
import { motion, type MotionProps } from 'framer-motion';

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  duration?: number;
} & MotionProps;

export function SectionReveal({
  children,
  className,
  id,
  delay = 0,
  duration = 0.7,
  ...rest
}: SectionRevealProps) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration, ease: 'easeOut', delay }}
      {...rest}
    >
      {children}
    </motion.section>
  );
}
