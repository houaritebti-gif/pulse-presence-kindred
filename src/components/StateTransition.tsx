import { ReactNode } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface StateTransitionProps {
  state: "loading" | "error" | "empty" | "content";
  loadingContent: ReactNode;
  errorContent: ReactNode;
  emptyContent: ReactNode;
  children: ReactNode;
}

const variants: Variants = {
  initial: { 
    opacity: 0, 
    y: 12,
    scale: 0.98
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: "easeIn"
    }
  }
};

const StateTransition = ({
  state,
  loadingContent,
  errorContent,
  emptyContent,
  children,
}: StateTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      {state === "loading" && (
        <motion.div
          key="loading"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {loadingContent}
        </motion.div>
      )}
      
      {state === "error" && (
        <motion.div
          key="error"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {errorContent}
        </motion.div>
      )}
      
      {state === "empty" && (
        <motion.div
          key="empty"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {emptyContent}
        </motion.div>
      )}
      
      {state === "content" && (
        <motion.div
          key="content"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StateTransition;
