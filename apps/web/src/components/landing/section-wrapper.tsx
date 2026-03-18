"use client";

import { motion } from "framer-motion";

const defaultVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 22,
    },
  },
};

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SectionWrapper({
  children,
  className = "",
  delay = 0,
}: SectionWrapperProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
      variants={defaultVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export const cardItemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 22,
      delay: i * 0.1,
    },
  }),
};
