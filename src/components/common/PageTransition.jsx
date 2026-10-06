import React from "react";
import { motion } from "framer-motion";
import { baseTransition, pageVariants } from "../../lib/motion";

export default function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={baseTransition}
    >
      {children}
    </motion.div>
  );
}
