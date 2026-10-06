export const easeOut = [0.22, 1, 0.36, 1];
export const easeInOut = [0.4, 0, 0.2, 1];

export const motionTiming = {
  instant: 0.12,
  fast: 0.16,
  base: 0.2,
  slow: 0.26,
};

export const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const popVariants = {
  initial: { opacity: 0, scale: 0.985, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.99, y: 6 },
};

export const sheetVariants = {
  initial: { opacity: 0, y: 18, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.995 },
};

export const listItemVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.985, height: 0, marginTop: 0, marginBottom: 0 },
};

export const interaction = {
  hover: { y: -1 },
  tap: { scale: 0.98 },
};

export const primaryActionInteraction = {
  hover: { scale: 1.045, y: -2 },
  tap: { scale: 0.92, y: 1 },
};

export const fastTransition = { duration: motionTiming.fast, ease: easeOut };
export const baseTransition = { duration: motionTiming.base, ease: easeOut };
export const slowTransition = { duration: motionTiming.slow, ease: easeOut };
