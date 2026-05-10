"use client";

import { motion, useReducedMotion } from "framer-motion";

const defaultVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 85,
      damping: 26,
    },
  },
};

const staticVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export function SectionWrapper({
  children,
  className = "",
  delay = 0,
  id,
}: SectionWrapperProps) {
  const reduced = useReducedMotion();
  const variants = reduced ? staticVariants : defaultVariants;
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export const cardItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.99 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 24,
      delay: i * 0.08,
    },
  }),
};
