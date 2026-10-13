import type { Transition, Variants } from "framer-motion";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: EASE } satisfies Transition,
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 380, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

export const toastSlide: Variants = {
  hidden: { opacity: 0, x: 80, y: -10 },
  visible: { opacity: 1, x: 0, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } },
  exit: { opacity: 0, x: 80, transition: { duration: 0.2 } },
};

export const cardHover = { y: -4, transition: { type: "spring" as const, stiffness: 300, damping: 20 } };
export const buttonMotion = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } };
